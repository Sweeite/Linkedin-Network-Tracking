import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const STAGES = [
  { label: "Connected", bg: "bg-stage-connected-bg", text: "text-stage-connected" },
  { label: "Conversing", bg: "bg-stage-conversing-bg", text: "text-stage-conversing" },
  { label: "Nurturing", bg: "bg-stage-nurturing-bg", text: "text-stage-nurturing" },
  { label: "Converted", bg: "bg-stage-converted-bg", text: "text-stage-converted" },
];

export default function DashboardPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Metrics, funnel, and trend chart land here — tracked as a GitHub
          issue.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Funnel stages</CardTitle>
          <CardDescription>Theme check — stage colors from globals.css</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {STAGES.map((stage) => (
            <Badge
              key={stage.label}
              variant="outline"
              className={`${stage.bg} ${stage.text} border-transparent`}
            >
              {stage.label}
            </Badge>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
