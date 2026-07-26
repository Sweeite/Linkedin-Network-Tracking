import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-muted-foreground">{description}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Not built yet</CardTitle>
          <CardDescription>
            This screen is tracked as a GitHub issue — the app shell, theme,
            auth, and database are wired up and ready for it.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
