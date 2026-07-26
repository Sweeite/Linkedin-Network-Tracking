import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isStage, STAGE_BADGE_CLASSES } from "@/components/people/constants";

export function StageBadge({
  stage,
  className,
}: {
  stage: string;
  className?: string;
}) {
  const styles = isStage(stage)
    ? STAGE_BADGE_CLASSES[stage]
    : "bg-muted text-muted-foreground";

  return (
    <Badge className={cn(styles, className)}>
      {stage}
    </Badge>
  );
}
