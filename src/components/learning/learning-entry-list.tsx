"use client";

import { ExternalLinkIcon, PencilIcon, Trash2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Database } from "@/lib/database.types";

type LearningLogRow = Database["public"]["Tables"]["learning_log"]["Row"];

const SOURCE_LABELS: Record<string, string> = {
  article: "Article",
  video: "Video",
  podcast: "Podcast",
  book: "Book",
  conversation: "Conversation",
  other: "Other",
};

interface LearningEntryListProps {
  entries: LearningLogRow[];
  loading: boolean;
  onEdit: (entry: LearningLogRow) => void;
  onDelete: (id: string) => void | Promise<void>;
}

export function LearningEntryList({
  entries,
  loading,
  onEdit,
  onDelete,
}: LearningEntryListProps) {
  if (loading) {
    return (
      <div className="grid gap-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No entries yet — add your first one above.
      </p>
    );
  }

  return (
    <div className="rounded-xl ring-1 ring-foreground/10">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Takeaway</TableHead>
            <TableHead>Tags</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="text-muted-foreground">
                {entry.entry_date}
              </TableCell>
              <TableCell>
                <Badge variant="secondary">
                  {SOURCE_LABELS[entry.source_type ?? "other"] ??
                    entry.source_type}
                </Badge>
              </TableCell>
              <TableCell className="max-w-64 whitespace-normal font-medium">
                {entry.url ? (
                  <a
                    href={entry.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 hover:underline"
                  >
                    {entry.title}
                    <ExternalLinkIcon className="size-3.5 text-muted-foreground" />
                  </a>
                ) : (
                  entry.title
                )}
              </TableCell>
              <TableCell className="max-w-80 whitespace-normal text-muted-foreground">
                {entry.takeaway}
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {(entry.tags ?? []).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Edit entry"
                    onClick={() => onEdit(entry)}
                  >
                    <PencilIcon />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Delete entry"
                      >
                        <Trash2Icon />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
                        <AlertDialogDescription>
                          &ldquo;{entry.title}&rdquo; will be permanently
                          removed. This can&rsquo;t be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          variant="destructive"
                          onClick={() => onDelete(entry.id)}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
