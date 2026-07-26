"use client";

import * as React from "react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostsTable } from "@/components/posts/posts-table";
import { PostFormDialog } from "@/components/posts/post-form-dialog";
import { DeletePostDialog } from "@/components/posts/delete-post-dialog";
import { ViewsChart } from "@/components/posts/views-chart";

type Post = Database["public"]["Tables"]["posts"]["Row"];

export default function PostsPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);

  const [formOpen, setFormOpen] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<Post | null>(null);

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [deletingPost, setDeletingPost] = React.useState<Post | null>(null);

  const loadPosts = React.useCallback(async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .order("date_posted", { ascending: false, nullsFirst: false });

    if (error) {
      toast.error("Failed to load posts", { description: error.message });
    } else {
      setPosts(data ?? []);
    }
    setLoading(false);
  }, [supabase]);

  React.useEffect(() => {
    // Fetching from Supabase on mount is the intended pattern for this
    // client-side page (no server/RSC data loader or query library is
    // wired up in this stack). The setState calls in loadPosts only run
    // after the request resolves, so this doesn't cause a synchronous
    // cascading render — the react-hooks compiler lint can't see that.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPosts();
  }, [loadPosts]);

  function openAddDialog() {
    setEditingPost(null);
    setFormOpen(true);
  }

  function openEditDialog(post: Post) {
    setEditingPost(post);
    setFormOpen(true);
  }

  function openDeleteDialog(post: Post) {
    setDeletingPost(post);
    setDeleteOpen(true);
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Posts</h1>
          <p className="mt-1 text-muted-foreground">
            LinkedIn post performance — track views, engagement, and trends
            over time.
          </p>
        </div>
        <Button onClick={openAddDialog}>Add post</Button>
      </div>

      <ViewsChart posts={posts} />

      {loading ? (
        <div className="grid gap-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <PostsTable
          posts={posts}
          onEdit={openEditDialog}
          onDelete={openDeleteDialog}
        />
      )}

      <PostFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        post={editingPost}
        onSaved={loadPosts}
      />

      <DeletePostDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        post={deletingPost}
        onDeleted={loadPosts}
      />
    </div>
  );
}
