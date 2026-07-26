"use client";

import * as React from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
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

type Post = Database["public"]["Tables"]["posts"]["Row"];

export function DeletePostDialog({
  open,
  onOpenChange,
  post,
  onDeleted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  onDeleted: () => void;
}) {
  const supabase = React.useMemo(() => createClient(), []);
  const [deleting, setDeleting] = React.useState(false);

  async function handleDelete() {
    if (!post) return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("posts").delete().eq("id", post.id);
      if (error) throw error;
      toast.success("Post deleted");
      onOpenChange(false);
      onDeleted();
    } catch (error) {
      toast.error("Failed to delete post", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>
            {post?.title
              ? `"${post.title}" will be permanently removed.`
              : "This post will be permanently removed."}{" "}
            This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
          >
            {deleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
