import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type ActivityItem = {
  id: string;
  label: string;
  date: string;
  type: "person" | "post";
};

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ActivityFeed({ items }: { items: ActivityItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>Latest connections and posts, newest first</CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No activity yet — add a connection or log a post to get started.
          </p>
        ) : (
          <ul className="grid gap-3">
            {items.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 border-b border-border pb-3 last:border-0 last:pb-0"
              >
                <span className="text-sm">{item.label}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDate(item.date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
