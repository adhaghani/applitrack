import { JobApplication } from "@/types/job";

export interface PerformanceMetrics {
  renderTime: number;
  searchTime: number;
  filterTime: number;
  totalItems: number;
  visibleItems: number;
  memoryUsage?: number;
}

export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

class PerformanceService {
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 100;

  // Virtual scrolling implementation
  calculateVirtualScrollItems<T>(
    items: T[],
    options: VirtualScrollOptions,
    scrollTop: number
  ): {
    visibleItems: T[];
    startIndex: number;
    endIndex: number;
    totalHeight: number;
    offsetY: number;
  } {
    const { itemHeight, containerHeight, overscan = 5 } = options;

    const totalHeight = items.length * itemHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight);

    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / itemHeight) - overscan
    );
    const endIndex = Math.min(
      items.length - 1,
      startIndex + visibleCount + overscan * 2
    );

    const visibleItems = items.slice(startIndex, endIndex + 1);
    const offsetY = startIndex * itemHeight;

    return {
      visibleItems,
      startIndex,
      endIndex,
      totalHeight,
      offsetY,
    };
  }

  // Debounced search function
  createDebouncedSearch<T>(
    searchFunction: (query: string, items: T[]) => T[],
    delay: number = 300
  ): (query: string, items: T[]) => Promise<T[]> {
    let timeoutId: NodeJS.Timeout;

    return (query: string, items: T[]): Promise<T[]> => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const startTime = performance.now();
          const results = searchFunction(query, items);
          const searchTime = performance.now() - startTime;

          this.recordMetric({
            renderTime: 0,
            searchTime,
            filterTime: 0,
            totalItems: items.length,
            visibleItems: results.length,
          });

          resolve(results);
        }, delay);
      });
    };
  }

  // Optimized filtering with memoization
  createMemoizedFilter<T>(
    filterFunction: (items: T[], filters: any) => T[]
  ): (items: T[], filters: any) => T[] {
    const cache = new Map<string, T[]>();
    const MAX_CACHE_SIZE = 50;

    return (items: T[], filters: any): T[] => {
      const cacheKey = JSON.stringify({ itemsLength: items.length, filters });

      if (cache.has(cacheKey)) {
        return cache.get(cacheKey)!;
      }

      const startTime = performance.now();
      const results = filterFunction(items, filters);
      const filterTime = performance.now() - startTime;

      this.recordMetric({
        renderTime: 0,
        searchTime: 0,
        filterTime,
        totalItems: items.length,
        visibleItems: results.length,
      });

      // Manage cache size
      if (cache.size >= MAX_CACHE_SIZE) {
        const firstKey = cache.keys().next().value;
        if (firstKey) {
          cache.delete(firstKey);
        }
      }

      cache.set(cacheKey, results);
      return results;
    };
  }

  // Batch processing for large operations
  async processBatch<T, R>(
    items: T[],
    processor: (item: T) => R | Promise<R>,
    batchSize: number = 50
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map((item) => processor(item))
      );

      results.push(...batchResults);

      // Allow other tasks to run
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    return results;
  }

  // Optimized job search with indexes
  createSearchIndex(jobs: JobApplication[]): Map<string, Set<number>> {
    const index = new Map<string, Set<number>>();

    jobs.forEach((job, idx) => {
      const searchableText = [
        job.company,
        job.role,
        job.workLocation,
        job.category,
        job.notes,
        job.status,
        job.experienceLevel,
        job.jobType,
        job.workMode,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Create n-grams for better search
      const words = searchableText.split(/\s+/);
      words.forEach((word) => {
        if (word.length > 0) {
          // Add full word
          if (!index.has(word)) {
            index.set(word, new Set());
          }
          index.get(word)!.add(idx);

          // Add prefixes for autocomplete
          for (let i = 1; i <= word.length; i++) {
            const prefix = word.substring(0, i);
            if (!index.has(prefix)) {
              index.set(prefix, new Set());
            }
            index.get(prefix)!.add(idx);
          }
        }
      });
    });

    return index;
  }

  // Fast search using index
  searchWithIndex(
    query: string,
    jobs: JobApplication[],
    searchIndex: Map<string, Set<number>>
  ): JobApplication[] {
    if (!query.trim()) return jobs;

    const startTime = performance.now();
    const terms = query.toLowerCase().split(/\s+/);
    let resultIndexes: Set<number> | null = null;

    terms.forEach((term) => {
      const termIndexes = searchIndex.get(term) || new Set();

      if (resultIndexes === null) {
        resultIndexes = new Set(termIndexes);
      } else {
        // Intersection of results
        resultIndexes = new Set(
          [...resultIndexes].filter((idx) => termIndexes.has(idx))
        );
      }
    });

    const results = resultIndexes
      ? [...resultIndexes].map((idx) => jobs[idx])
      : [];

    const searchTime = performance.now() - startTime;

    this.recordMetric({
      renderTime: 0,
      searchTime,
      filterTime: 0,
      totalItems: jobs.length,
      visibleItems: results.length,
    });

    return results;
  }

  // Lazy loading implementation
  createLazyLoader<T>(
    loadFunction: (page: number, pageSize: number) => Promise<T[]>,
    pageSize: number = 20
  ): {
    loadMore: () => Promise<T[]>;
    hasMore: boolean;
    isLoading: boolean;
    reset: () => void;
  } {
    let currentPage = 0;
    let hasMore = true;
    let isLoading = false;
    let allItems: T[] = [];

    const loadMore = async (): Promise<T[]> => {
      if (isLoading || !hasMore) return allItems;

      isLoading = true;
      try {
        const newItems = await loadFunction(currentPage, pageSize);

        if (newItems.length < pageSize) {
          hasMore = false;
        }

        allItems = [...allItems, ...newItems];
        currentPage++;

        return allItems;
      } finally {
        isLoading = false;
      }
    };

    const reset = () => {
      currentPage = 0;
      hasMore = true;
      isLoading = false;
      allItems = [];
    };

    return {
      loadMore,
      get hasMore() {
        return hasMore;
      },
      get isLoading() {
        return isLoading;
      },
      reset,
    };
  }

  // Performance monitoring
  recordMetric(metric: PerformanceMetrics): void {
    this.metrics.push({
      ...metric,
      memoryUsage: this.getMemoryUsage(),
    });

    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift();
    }
  }

  private getMemoryUsage(): number | undefined {
    if ("memory" in performance) {
      return (performance as any).memory?.usedJSHeapSize;
    }
    return undefined;
  }

  getPerformanceStats(): {
    averageSearchTime: number;
    averageFilterTime: number;
    averageRenderTime: number;
    totalMetrics: number;
    memoryTrend: string;
  } {
    if (this.metrics.length === 0) {
      return {
        averageSearchTime: 0,
        averageFilterTime: 0,
        averageRenderTime: 0,
        totalMetrics: 0,
        memoryTrend: "unknown",
      };
    }

    const totals = this.metrics.reduce(
      (acc, metric) => ({
        searchTime: acc.searchTime + metric.searchTime,
        filterTime: acc.filterTime + metric.filterTime,
        renderTime: acc.renderTime + metric.renderTime,
      }),
      { searchTime: 0, filterTime: 0, renderTime: 0 }
    );

    const count = this.metrics.length;

    // Calculate memory trend
    let memoryTrend = "unknown";
    const recentMetrics = this.metrics.slice(-10);
    const memoryValues = recentMetrics
      .map((m) => m.memoryUsage)
      .filter(Boolean) as number[];

    if (memoryValues.length > 5) {
      const firstHalf = memoryValues.slice(
        0,
        Math.floor(memoryValues.length / 2)
      );
      const secondHalf = memoryValues.slice(
        Math.floor(memoryValues.length / 2)
      );

      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

      if (secondAvg > firstAvg * 1.1) {
        memoryTrend = "increasing";
      } else if (secondAvg < firstAvg * 0.9) {
        memoryTrend = "decreasing";
      } else {
        memoryTrend = "stable";
      }
    }

    return {
      averageSearchTime: totals.searchTime / count,
      averageFilterTime: totals.filterTime / count,
      averageRenderTime: totals.renderTime / count,
      totalMetrics: count,
      memoryTrend,
    };
  }

  // Optimize component rendering
  shouldComponentUpdate<T extends Record<string, any>>(
    prevProps: T,
    nextProps: T,
    shallowCompare: boolean = true
  ): boolean {
    if (shallowCompare) {
      const prevKeys = Object.keys(prevProps);
      const nextKeys = Object.keys(nextProps);

      if (prevKeys.length !== nextKeys.length) return true;

      return prevKeys.some((key) => prevProps[key] !== nextProps[key]);
    }

    return JSON.stringify(prevProps) !== JSON.stringify(nextProps);
  }

  // Clear performance data
  clearMetrics(): void {
    this.metrics = [];
  }
}

export const performanceService = new PerformanceService();
