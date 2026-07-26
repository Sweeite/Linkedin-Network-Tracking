"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const SOURCE_TYPES = [
  "article",
  "video",
  "podcast",
  "book",
  "conversation",
  "other",
] as const;

export type LearningSourceType = (typeof SOURCE_TYPES)[number];

export interface LearningEntryFormValues {
  entry_date: string;
  source_type: LearningSourceType;
  title: string;
  url: string;
  takeaway: string;
  tags: string;
}

function todayISO() {
  const now = new Date();
  const localMidnight = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localMidnight.toISOString().slice(0, 10);
}

export function emptyLearningEntryValues(): LearningEntryFormValues {
  return {
    entry_date: todayISO(),
    source_type: "article",
    title: "",
    url: "",
    takeaway: "",
    tags: "",
  };
}

interface LearningEntryFormProps {
  mode: "create" | "edit";
  initialValues?: LearningEntryFormValues;
  onSubmit: (values: LearningEntryFormValues) => Promise<void>;
  onCancel?: () => void;
}

const dateInputClassName = cn(
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none",
  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
  "disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50",
  "md:text-sm dark:bg-input/30"
);

export function LearningEntryForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
}: LearningEntryFormProps) {
  const [values, setValues] = useState<LearningEntryFormValues>(
    () => initialValues ?? emptyLearningEntryValues()
  );
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof LearningEntryFormValues>(
    key: K,
    value: LearningEntryFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!values.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(values);
      if (mode === "create") {
        setValues(emptyLearningEntryValues());
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="grid gap-1.5">
          <Label htmlFor="entry_date">Date</Label>
          <input
            id="entry_date"
            type="date"
            required
            value={values.entry_date}
            onChange={(e) => update("entry_date", e.target.value)}
            className={dateInputClassName}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="source_type">Type</Label>
          <Select
            value={values.source_type}
            onValueChange={(value) =>
              update("source_type", value as LearningSourceType)
            }
          >
            <SelectTrigger id="source_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type[0].toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5 lg:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            required
            autoFocus
            placeholder="What did you learn?"
            value={values.title}
            onChange={(e) => update("title", e.target.value)}
          />
        </div>

        <div className="grid gap-1.5 lg:col-span-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            placeholder="https://..."
            value={values.url}
            onChange={(e) => update("url", e.target.value)}
          />
        </div>

        <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
          <Label htmlFor="takeaway">Takeaway</Label>
          <Input
            id="takeaway"
            placeholder="One-line takeaway"
            value={values.takeaway}
            onChange={(e) => update("takeaway", e.target.value)}
          />
        </div>

        <div className="grid gap-1.5 sm:col-span-2 lg:col-span-3">
          <Label htmlFor="tags">Tags</Label>
          <Input
            id="tags"
            placeholder="comma, separated, tags"
            value={values.tags}
            onChange={(e) => update("tags", e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {mode === "edit" ? "Save changes" : "Add entry"}
        </Button>
      </div>
    </form>
  );
}
