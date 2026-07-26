"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import {
  LearningEntryForm,
  type LearningEntryFormValues,
} from "@/components/learning/learning-entry-form";
import { LearningEntryList } from "@/components/learning/learning-entry-list";

type LearningLogRow = Database["public"]["Tables"]["learning_log"]["Row"];

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function sortEntries(entries: LearningLogRow[]): LearningLogRow[] {
  return [...entries].sort((a, b) => {
    if (a.entry_date !== b.entry_date) {
      return a.entry_date > b.entry_date ? -1 : 1;
    }
    return (b.created_at ?? "").localeCompare(a.created_at ?? "");
  });
}

function rowToFormValues(row: LearningLogRow): LearningEntryFormValues {
  return {
    entry_date: row.entry_date,
    source_type: (row.source_type ?? "article") as LearningEntryFormValues["source_type"],
    title: row.title,
    url: row.url ?? "",
    takeaway: row.takeaway ?? "",
    tags: (row.tags ?? []).join(", "),
  };
}

export function LearningLogClient() {
  const [supabase] = useState(() => createClient());
  const [entries, setEntries] = useState<LearningLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<LearningLogRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchEntries() {
      const { data, error } = await supabase
        .from("learning_log")
        .select("*")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        toast.error(`Failed to load learning log: ${error.message}`);
      } else {
        setEntries(data ?? []);
      }
      setLoading(false);
    }

    fetchEntries();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function handleCreate(values: LearningEntryFormValues) {
    const { data, error } = await supabase
      .from("learning_log")
      .insert({
        entry_date: values.entry_date,
        source_type: values.source_type,
        title: values.title.trim(),
        url: values.url.trim() || null,
        takeaway: values.takeaway.trim() || null,
        tags: parseTags(values.tags),
      })
      .select()
      .single();

    if (error || !data) {
      toast.error(`Couldn't save entry: ${error?.message ?? "unknown error"}`);
      return;
    }

    setEntries((prev) => sortEntries([...prev, data]));
    toast.success("Entry added");
  }

  async function handleUpdate(id: string, values: LearningEntryFormValues) {
    const { data, error } = await supabase
      .from("learning_log")
      .update({
        entry_date: values.entry_date,
        source_type: values.source_type,
        title: values.title.trim(),
        url: values.url.trim() || null,
        takeaway: values.takeaway.trim() || null,
        tags: parseTags(values.tags),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      toast.error(`Couldn't update entry: ${error?.message ?? "unknown error"}`);
      return;
    }

    setEntries((prev) => sortEntries(prev.map((entry) => (entry.id === id ? data : entry))));
    setEditingEntry(null);
    toast.success("Entry updated");
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from("learning_log").delete().eq("id", id);

    if (error) {
      toast.error(`Couldn't delete entry: ${error.message}`);
      return;
    }

    setEntries((prev) => prev.filter((entry) => entry.id !== id));
    setEditingEntry((current) => (current?.id === id ? null : current));
    toast.success("Entry deleted");
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Learning log</h1>
        <p className="mt-1 text-muted-foreground">
          Fast-entry log for articles, videos, podcasts, and conversations.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{editingEntry ? "Edit entry" : "Add an entry"}</CardTitle>
          {editingEntry && (
            <CardDescription>Editing &ldquo;{editingEntry.title}&rdquo;.</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <LearningEntryForm
            key={editingEntry?.id ?? "new"}
            mode={editingEntry ? "edit" : "create"}
            initialValues={editingEntry ? rowToFormValues(editingEntry) : undefined}
            onSubmit={(values) =>
              editingEntry ? handleUpdate(editingEntry.id, values) : handleCreate(values)
            }
            onCancel={editingEntry ? () => setEditingEntry(null) : undefined}
          />
        </CardContent>
      </Card>

      <LearningEntryList
        entries={entries}
        loading={loading}
        onEdit={setEditingEntry}
        onDelete={handleDelete}
      />
    </div>
  );
}
