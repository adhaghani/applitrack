"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Contact } from "@/types/job";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Plus,
  User,
  Mail,
  Phone,
  Briefcase,
  Trash2,
  Edit,
  Linkedin,
} from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  title: z.string().optional(),
  email: z
    .string()
    .email("Valid email is required")
    .optional()
    .or(z.literal("")),
  phone: z.string().optional(),
  linkedIn: z.string().optional(),
  type: z.enum(["recruiter", "hiring-manager", "team-member", "other"]),
});

type ContactFormData = z.infer<typeof contactSchema>;

interface ContactManagerProps {
  contacts: Contact[];
  onAddContact: (contact: Omit<Contact, "id">) => void;
  onUpdateContact: (id: string, contact: Partial<Contact>) => void;
  onDeleteContact: (id: string) => void;
}

export function ContactManager({
  contacts,
  onAddContact,
  onUpdateContact,
  onDeleteContact,
}: ContactManagerProps) {
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      title: "",
      email: "",
      phone: "",
      linkedIn: "",
      type: "other",
    },
  });

  const onSubmit = (data: ContactFormData) => {
    if (editingContact) {
      onUpdateContact(editingContact.id, {
        ...data,
        title: data.title || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        linkedIn: data.linkedIn || undefined,
      });
      setEditingContact(null);
    } else {
      onAddContact({
        ...data,
        title: data.title || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        linkedIn: data.linkedIn || undefined,
      });
    }

    form.reset();
    setOpen(false);
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    form.reset({
      name: contact.name,
      title: contact.title || "",
      email: contact.email || "",
      phone: contact.phone || "",
      linkedIn: contact.linkedIn || "",
      type: contact.type,
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingContact(null);
    form.reset();
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "hiring-manager":
        return "Hiring Manager";
      case "team-member":
        return "Team Member";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Contacts</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editingContact ? "Edit Contact" : "Add New Contact"}
              </DialogTitle>
            </DialogHeader>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Senior Software Engineer"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select contact type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="recruiter">Recruiter</SelectItem>
                          <SelectItem value="hiring-manager">
                            Hiring Manager
                          </SelectItem>
                          <SelectItem value="team-member">
                            Team Member
                          </SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@company.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1 (555) 123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="linkedIn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>LinkedIn</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="linkedin.com/in/username"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingContact ? "Update" : "Add"} Contact
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {contacts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No contacts added yet</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {contacts.map((contact) => (
            <Card key={contact.id} className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium truncate">{contact.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {getTypeLabel(contact.type)}
                    </Badge>
                  </div>

                  {contact.title && (
                    <p className="text-sm text-muted-foreground mb-2 truncate">
                      {contact.title}
                    </p>
                  )}

                  <div className="space-y-1 text-sm text-muted-foreground">
                    {contact.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{contact.email}</span>
                      </div>
                    )}
                    {contact.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3" />
                        <span>{contact.phone}</span>
                      </div>
                    )}
                    {contact.linkedIn && (
                      <div className="flex items-center space-x-2">
                        <Linkedin className="h-3 w-3" />
                        <span className="truncate">{contact.linkedIn}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex space-x-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(contact)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDeleteContact(contact.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive-foreground hover:bg-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
