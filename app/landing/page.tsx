"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Briefcase,
  TrendingUp,
  CheckCircle,
  Bell,
  Users,
  FileText,
  Upload,
  Lightbulb,
  ArrowRight,
  Play,
  Star,
  Target,
  Zap,
  Shield,
  Smartphone,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";

const features = [
  {
    icon: Briefcase,
    title: "Smart Job Tracking",
    description:
      "Track applications with advanced filtering, search, and status management",
    color: "text-blue-500",
    bgColor: "bg-blue-50",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Get intelligent reminders for follow-ups, interviews, and deadlines",
    color: "text-green-500",
    bgColor: "bg-green-50",
  },
  {
    icon: FileText,
    title: "Application Templates",
    description:
      "Pre-built templates for quick application creation and consistency",
    color: "text-purple-500",
    bgColor: "bg-purple-50",
  },
  {
    icon: Users,
    title: "Contact Management",
    description:
      "Build and manage your professional network with detailed contact profiles",
    color: "text-orange-500",
    bgColor: "bg-orange-50",
  },
  {
    icon: Upload,
    title: "Document Manager",
    description:
      "Organize resumes, cover letters, and portfolios with version control",
    color: "text-teal-500",
    bgColor: "bg-teal-50",
  },
];

const stats = [
  { label: "Applications Tracked", value: "10,000+", icon: Briefcase },
  { label: "Users Worldwide", value: "5,000+", icon: Users },
  { label: "Success Rate", value: "85%", icon: Target },
  { label: "Time Saved", value: "20hrs/week", icon: Zap },
];

export default function LandingPage() {
  const [activeDemo, setActiveDemo] = useState("dashboard");
  const { theme, setTheme } = useTheme();

  const demoContent = {
    dashboard: {
      title: "Application Dashboard",
      description:
        "Get a comprehensive overview of all your job applications with real-time statistics and progress tracking.",
      image: "/api/placeholder/600/400",
    },
    notifications: {
      title: "Smart Notifications",
      description:
        "Never miss important deadlines with intelligent reminders and follow-up suggestions.",
      image: "/api/placeholder/600/400",
    },
    templates: {
      title: "Application Templates",
      description:
        "Speed up your application process with pre-built templates for different job types.",
      image: "/api/placeholder/600/400",
    },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="bg-background/95 border-b backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Briefcase className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AppliTrack</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Link href="/app">
              <Button>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-16 sm:py-24">
          <div className="text-center">
            <div>
              <Badge className="mb-4" variant="secondary">
                <Star className="mr-1 h-3 w-3" />
                Professional Job Tracking Platform
              </Badge>
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
                Master Your <span className="text-primary">Job Search</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl">
                The most comprehensive job application tracker with smart
                notifications, templates, contact management, and advanced
                analytics to accelerate your career.
              </p>
            </div>

            <div className="mt-10 flex items-center justify-center gap-4">
              <Link href="/app">
                <Button size="lg" className="text-lg px-8 py-4">
                  <Play className="mr-2 h-5 w-5" />
                  Start Tracking Now
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Watch Demo
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {stats.map((stat, index) => (
                <Card key={index} className="border-0 bg-card/50">
                  <CardContent className="p-4 text-center">
                    <stat.icon className="mx-auto h-6 w-6 text-primary mb-2" />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">
                      {stat.label}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything You Need to Land Your Dream Job
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Comprehensive tools designed for modern job seekers
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <div key={index}>
                <Card className="h-full border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div
                      className={`inline-flex p-3 rounded-lg ${feature.bgColor} mb-4`}
                    >
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section className="py-16 sm:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              See AppliTrack in Action
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Experience the power of professional job tracking
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            <div className="flex justify-center mb-8">
              <div className="flex space-x-1 bg-background rounded-lg p-1">
                {Object.entries(demoContent).map(([key, content]) => (
                  <Button
                    key={key}
                    variant={activeDemo === key ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveDemo(key)}
                    className="px-4"
                  >
                    {content.title}
                  </Button>
                ))}
              </div>
            </div>

            <div
              key={activeDemo}
              className="bg-background rounded-xl shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">
                    {demoContent[activeDemo as keyof typeof demoContent].title}
                  </h3>
                  <p className="text-muted-foreground">
                    {
                      demoContent[activeDemo as keyof typeof demoContent]
                        .description
                    }
                  </p>
                </div>

                {/* Demo Preview */}
                <div className="bg-muted/50 rounded-lg p-8 min-h-[300px] flex items-center justify-center">
                  <div className="text-center">
                    <Briefcase className="h-16 w-16 text-primary mx-auto mb-4" />
                    <p className="text-lg font-medium">
                      Interactive Demo Coming Soon
                    </p>
                    <p className="text-muted-foreground">
                      Click "Start Tracking Now" to try the full application
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                Why Choose AppliTrack?
              </h2>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <Shield className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Privacy First</h3>
                    <p className="text-muted-foreground">
                      Your data stays on your device with local storage
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Smartphone className="h-6 w-6 text-blue-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Mobile Optimized</h3>
                    <p className="text-muted-foreground">
                      Track applications anywhere with responsive design
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Zap className="h-6 w-6 text-yellow-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">Lightning Fast</h3>
                    <p className="text-muted-foreground">
                      Optimized performance with instant search and filtering
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Lightbulb className="h-6 w-6 text-purple-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold">AI-Powered Insights</h3>
                    <p className="text-muted-foreground">
                      Smart suggestions and status automation
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Link href="/app">
                  <Button size="lg">
                    Start Your Success Story
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8">
                <div className="bg-background rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Application Summary</h4>
                    <Badge>Live</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        127
                      </div>
                      <div className="text-xs text-blue-600">Total Applied</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        23
                      </div>
                      <div className="text-xs text-green-600">Interviews</div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span>Software Engineer at TechCorp</span>
                      </div>
                      <Badge variant="secondary">Interview</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span>Product Manager at StartupXYZ</span>
                      </div>
                      <Badge variant="outline">Applied</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span>Data Scientist at BigData Inc</span>
                      </div>
                      <Badge variant="secondary">Follow-up</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
            Ready to Transform Your Job Search?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of professionals who have accelerated their careers
            with AppliTrack
          </p>

          <Link href="/app">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              <Play className="mr-2 h-5 w-5" />
              Start Tracking Applications Now
            </Button>
          </Link>

          <p className="mt-4 text-sm opacity-75">
            Free to use • No account required • Your data stays private
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 sm:mb-0">
              <Briefcase className="h-5 w-5 text-primary" />
              <span className="font-semibold">AppliTrack</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with ❤️ for job seekers worldwide
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
