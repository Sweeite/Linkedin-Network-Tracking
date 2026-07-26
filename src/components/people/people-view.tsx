"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PeopleTable } from "@/components/people/people-table";
import {
  PersonFormDialog,
  type PersonFormValues,
} from "@/components/people/person-form-dialog";
import { STAGES, type Person, type Stage } from "@/components/people/constants";
import type { TablesInsert } from "@/lib/database.types";

const STAGE_FILTERS: Array<Stage | "All"> = ["All", ...STAGES];

export function PeopleView() {
  const [people, setPeople] = useState<Person[] | null>(null);
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<Stage | "All">("All");

  const [formOpen, setFormOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchPeople = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("people")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error(`Failed to load people: ${error.message}`);
      setPeople([]);
      return;
    }

    setPeople(data ?? []);
  }, []);

  useEffect(() => {
    // Client-only Supabase fetch on mount (and whenever fetchPeople is
    // recreated). There's no server-side loader here since the browser
    // Supabase client owns the auth session, and this view also needs to
    // re-run the same fetch imperatively after mutations.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPeople();
  }, [fetchPeople]);

  const filteredPeople = useMemo(() => {
    if (!people) return [];
    const query = search.trim().toLowerCase();

    return people.filter((person) => {
      const matchesStage = stageFilter === "All" || person.stage === stageFilter;
      if (!matchesStage) return false;

      if (!query) return true;
      const haystack = `${person.name} ${person.company ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [people, search, stageFilter]);

  function openAddDialog() {
    setEditingPerson(null);
    setFormOpen(true);
  }

  function openEditDialog(person: Person) {
    setEditingPerson(person);
    setFormOpen(true);
  }

  async function handleSave(values: PersonFormValues): Promise<boolean> {
    const supabase = createClient();
    const name = values.name.trim();

    const payload: TablesInsert<"people"> = {
      name,
      role: values.role.trim() || null,
      company: values.company.trim() || null,
      stage: values.stage,
      source: values.source.trim() || null,
      connected_date: values.connected_date || null,
      last_contact_date: values.last_contact_date || null,
      conversation_depth: values.conversation_depth,
      asked_what_i_do: values.asked_what_i_do,
      pain_point: values.pain_point.trim() || null,
      notes: values.notes.trim() || null,
    };

    if (editingPerson) {
      const { error } = await supabase
        .from("people")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", editingPerson.id);

      if (error) {
        toast.error(`Failed to update ${name}: ${error.message}`);
        return false;
      }
      toast.success(`Updated ${name}`);
    } else {
      const { error } = await supabase.from("people").insert(payload);

      if (error) {
        toast.error(`Failed to add ${name}: ${error.message}`);
        return false;
      }
      toast.success(`Added ${name}`);
    }

    await fetchPeople();
    return true;
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("people")
      .delete()
      .eq("id", deleteTarget.id);

    setDeleting(false);

    if (error) {
      toast.error(`Failed to delete ${deleteTarget.name}: ${error.message}`);
      return;
    }

    toast.success(`Deleted ${deleteTarget.name}`);
    setDeleteTarget(null);
    await fetchPeople();
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">People</h1>
          <p className="mt-1 text-muted-foreground">
            Connections CRM + funnel — list, search, filter, add/edit.
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <PlusIcon data-icon="inline-start" />
          Add connection
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or company…"
          className="max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {STAGE_FILTERS.map((stage) => (
            <Button
              key={stage}
              type="button"
              size="sm"
              variant={stageFilter === stage ? "default" : "outline"}
              onClick={() => setStageFilter(stage)}
            >
              {stage}
            </Button>
          ))}
        </div>
      </div>

      {people === null ? (
        <div className="grid gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <PeopleTable
          people={filteredPeople}
          onEdit={openEditDialog}
          onDelete={setDeleteTarget}
        />
      )}

      <PersonFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        person={editingPerson}
        onSave={handleSave}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete connection?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteTarget?.name ?? "this person"}{" "}
              from your funnel. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
