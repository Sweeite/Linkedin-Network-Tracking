import type { Database } from "@/lib/database.types";

export type Person = Database["public"]["Tables"]["people"]["Row"];

export const STAGES = [
  "Connected",
  "Conversing",
  "Nurturing",
  "Converted",
] as const;

export type Stage = (typeof STAGES)[number];

export const CONVERSATION_DEPTHS = ["single", "multi"] as const;

export type ConversationDepth = (typeof CONVERSATION_DEPTHS)[number];

export const STAGE_BADGE_CLASSES: Record<Stage, string> = {
  Connected: "bg-stage-connected-bg text-stage-connected",
  Conversing: "bg-stage-conversing-bg text-stage-conversing",
  Nurturing: "bg-stage-nurturing-bg text-stage-nurturing",
  Converted: "bg-stage-converted-bg text-stage-converted",
};

export function isStage(value: string): value is Stage {
  return (STAGES as readonly string[]).includes(value);
}
