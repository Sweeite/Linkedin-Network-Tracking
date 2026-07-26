"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/database.types";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";

type Post = Database["public"]["Tables"]["posts"]["Row"];

export type PostFormValues = {
  date_posted: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  notes: string;
};

const EMPTY_VALUES: PostFormValues = {
  date_posted: "",
  title: "",
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  notes: "",
};

function postToFormValues(post: Post): PostFormValues {
  return {
    date_posted: post.date_posted ?? "",
    title: post.title ?? "",
    views: post.views ?? 0,
    likes: post.likes ?? 0,
    comments: post.comments ?? 0,
    shares: post.shares ?? 0,
    notes: post.notes ?? "",
  };
}

export function PostFormDialog({
  open,
  onOpenChange,
  post,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Post being edited, or null/undefined when creating a new post. */
  post?: Post | null;
  onSaved: () => void;
}) {
  const isEditing = !!post;
  const supabase = React.useMemo(() => createClient(), []);
  const [submitting, setSubmitting] = React.useState(false);

  const form = useForm<PostFormValues>({
    defaultValues: EMPTY_VALUES,
  });

  React.useEffect(() => {
    if (!open) return;
    form.reset(post ? postToFormValues(post) : EMPTY_VALUES);
  }, [open, post, form]);

  async function onSubmit(values: PostFormValues) {
    setSubmitting(true);
    try {
      const payload = {
        date_posted: values.date_posted || null,
        title: values.title || null,
        views: Number.isFinite(values.views) ? values.views : 0,
        likes: Number.isFinite(values.likes) ? values.likes : 0,
        comments: Number.isFinite(values.comments) ? values.comments : 0,
        shares: Number.isFinite(values.shares) ? values.shares : 0,
        notes: values.notes || null,
      };

      if (isEditing && post) {
        const { error } = await supabase
          .from("posts")
          .update(payload)
          .eq("id", post.id);
        if (error) throw error;
        toast.success("Post updated");
      } else {
        const { error } = await supabase.from("posts").insert(payload);
        if (error) throw error;
        toast.success("Post created");
      }

      onOpenChange(false);
      onSaved();
    } catch (error) {
      toast.error(
        isEditing ? "Failed to update post" : "Failed to create post",
        {
          description: error instanceof Error ? error.message : undefined,
        }
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit post" : "Add post"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update this post's performance stats."
              : "Log a new LinkedIn post and its performance stats."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_posted"
                rules={{ required: "Date is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date posted</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                rules={{ required: "Title is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Post title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="views"
                rules={{ min: { value: 0, message: "Must be 0 or more" } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Views</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="likes"
                rules={{ min: { value: 0, message: "Must be 0 or more" } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Likes</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="comments"
                rules={{ min: { value: 0, message: "Must be 0 or more" } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="shares"
                rules={{ min: { value: 0, message: "Must be 0 or more" } }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shares</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        {...field}
                        onChange={(e) =>
                          field.onChange(e.target.valueAsNumber || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Optional notes about this post"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : isEditing ? "Save changes" : "Add post"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
