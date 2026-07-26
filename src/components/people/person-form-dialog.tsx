"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  CONVERSATION_DEPTHS,
  STAGES,
  type ConversationDepth,
  type Person,
  type Stage,
} from "@/components/people/constants";

export type PersonFormValues = {
  name: string;
  role: string;
  company: string;
  stage: Stage;
  source: string;
  connected_date: string;
  last_contact_date: string;
  conversation_depth: ConversationDepth;
  asked_what_i_do: boolean;
  pain_point: string;
  notes: string;
};

const BLANK_VALUES: PersonFormValues = {
  name: "",
  role: "",
  company: "",
  stage: "Connected",
  source: "LinkedIn outreach",
  connected_date: "",
  last_contact_date: "",
  conversation_depth: "single",
  asked_what_i_do: false,
  pain_point: "",
  notes: "",
};

function personToFormValues(person: Person): PersonFormValues {
  return {
    name: person.name,
    role: person.role ?? "",
    company: person.company ?? "",
    stage: (STAGES as readonly string[]).includes(person.stage)
      ? (person.stage as Stage)
      : "Connected",
    source: person.source ?? "",
    connected_date: person.connected_date ?? "",
    last_contact_date: person.last_contact_date ?? "",
    conversation_depth: (
      CONVERSATION_DEPTHS as readonly string[]
    ).includes(person.conversation_depth ?? "")
      ? (person.conversation_depth as ConversationDepth)
      : "single",
    asked_what_i_do: person.asked_what_i_do ?? false,
    pain_point: person.pain_point ?? "",
    notes: person.notes ?? "",
  };
}

interface PersonFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
  onSave: (values: PersonFormValues) => Promise<boolean>;
}

export function PersonFormDialog({
  open,
  onOpenChange,
  person,
  onSave,
}: PersonFormDialogProps) {
  const isEditing = !!person;
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PersonFormValues>({
    defaultValues: BLANK_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(person ? personToFormValues(person) : BLANK_VALUES);
    }
  }, [open, person, form]);

  async function handleSubmit(values: PersonFormValues) {
    setSubmitting(true);
    const success = await onSave(values);
    setSubmitting(false);
    if (success) {
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit connection" : "Add connection"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details for this connection."
              : "Add a new connection to your funnel."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="grid max-h-[70vh] gap-4 overflow-y-auto px-1 py-1"
          >
            <FormField
              control={form.control}
              name="name"
              rules={{ required: "Name is required" }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="Product Manager" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company</FormLabel>
                    <FormControl>
                      <Input placeholder="Acme Corp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stage</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STAGES.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <FormControl>
                      <Input placeholder="LinkedIn outreach" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="connected_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Connected date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_contact_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last contact date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="conversation_depth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conversation depth</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select depth" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CONVERSATION_DEPTHS.map((depth) => (
                          <SelectItem key={depth} value={depth}>
                            {depth === "single" ? "Single" : "Multi"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="asked_what_i_do"
                render={({ field }) => (
                  <FormItem className="justify-end">
                    <FormLabel>Asked what I do</FormLabel>
                    <FormControl>
                      <div className="flex h-8 items-center">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) =>
                            field.onChange(checked === true)
                          }
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="pain_point"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pain point</FormLabel>
                  <FormControl>
                    <Input placeholder="What are they struggling with?" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving…" : isEditing ? "Save changes" : "Add connection"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
