import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const FUNNEL_STAGES = [
  { key: "Connected", bg: "bg-stage-connected-bg", text: "text-stage-connected" },
  { key: "Conversing", bg: "bg-stage-conversing-bg", text: "text-stage-conversing" },
  { key: "Nurturing", bg: "bg-stage-nurturing-bg", text: "text-stage-nurturing" },
  { key: "Converted", bg: "bg-stage-converted-bg", text: "text-stage-converted" },
] as const;

export function Funnel({ counts }: { counts: Record<string, number> }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnel</CardTitle>
        <CardDescription>Where every connection stands right now</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {FUNNEL_STAGES.map((stage) => (
            <div
              key={stage.key}
              className={`rounded-lg border border-transparent p-4 ${stage.bg}`}
            >
              <div className={`text-2xl font-semibold tabular-nums ${stage.text}`}>
                {counts[stage.key] ?? 0}
              </div>
              <div className={`text-sm font-medium ${stage.text}`}>{stage.key}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
