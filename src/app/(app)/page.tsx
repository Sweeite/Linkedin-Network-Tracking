import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Funnel, FUNNEL_STAGES } from "@/components/dashboard/funnel";
import {
  ConnectionsTrendChart,
  type WeeklyConnections,
} from "@/components/dashboard/connections-trend-chart";
import { ActivityFeed, type ActivityItem } from "@/components/dashboard/activity-feed";

type Person = Pick<
  Tables<"people">,
  | "id"
  | "name"
  | "stage"
  | "connected_date"
  | "conversation_depth"
  | "asked_what_i_do"
  | "created_at"
>;

type Post = Pick<Tables<"posts">, "id" | "title" | "date_posted" | "created_at">;

const WEEK_COUNT = 8;
const DAY_MS = 1000 * 60 * 60 * 24;

/** Parses a Postgres `date` string ("YYYY-MM-DD") as a local-midnight Date, avoiding UTC shift. */
function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function startOfToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function daysAgo(dateStr: string, today: Date): number {
  const date = parseDateOnly(dateStr);
  date.setHours(0, 0, 0, 0);
  return Math.floor((today.getTime() - date.getTime()) / DAY_MS);
}

function buildWeeklyTrend(people: Person[], today: Date): WeeklyConnections[] {
  const weeks: { label: string; start: Date; end: Date; connections: number }[] = [];

  for (let i = WEEK_COUNT - 1; i >= 0; i--) {
    const end = new Date(today);
    end.setDate(today.getDate() - i * 7);
    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    weeks.push({
      label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      start,
      end,
      connections: 0,
    });
  }

  for (const person of people) {
    if (!person.connected_date) continue;
    const date = parseDateOnly(person.connected_date);
    date.setHours(0, 0, 0, 0);
    const week = weeks.find((w) => date >= w.start && date <= w.end);
    if (week) week.connections += 1;
  }

  return weeks.map((w) => ({ week: w.label, connections: w.connections }));
}

function buildActivityFeed(people: Person[], posts: Post[]): ActivityItem[] {
  const personItems: ActivityItem[] = people
    .filter((p): p is Person & { created_at: string } => !!p.created_at)
    .map((p) => ({
      id: `person-${p.id}`,
      label: `Connected with ${p.name}`,
      date: p.created_at,
      type: "person",
    }));

  const postItems: ActivityItem[] = posts
    .map((p) => ({ ...p, effectiveDate: p.date_posted ?? p.created_at }))
    .filter((p): p is Post & { effectiveDate: string } => !!p.effectiveDate)
    .map((p) => ({
      id: `post-${p.id}`,
      label: `Posted: ${p.title ?? "Untitled post"}`,
      date: p.effectiveDate,
      type: "post",
    }));

  return [...personItems, ...postItems]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [{ data: peopleData, error: peopleError }, { data: postsData, error: postsError }] =
    await Promise.all([
      supabase
        .from("people")
        .select("id, name, stage, connected_date, conversation_depth, asked_what_i_do, created_at")
        .order("created_at", { ascending: false }),
      supabase
        .from("posts")
        .select("id, title, date_posted, created_at")
        .order("created_at", { ascending: false }),
    ]);

  if (peopleError) console.error("Failed to load people for dashboard:", peopleError);
  if (postsError) console.error("Failed to load posts for dashboard:", postsError);

  const people: Person[] = peopleData ?? [];
  const posts: Post[] = postsData ?? [];

  const today = startOfToday();

  const newConnectionsThisWeek = people.filter(
    (p) => p.connected_date && daysAgo(p.connected_date, today) >= 0 && daysAgo(p.connected_date, today) < 7
  ).length;

  const conversationsPastOneExchange = people.filter(
    (p) => p.conversation_depth === "multi"
  ).length;

  const askedWhatIDoSignals = people.filter((p) => p.asked_what_i_do === true).length;

  const funnelCounts = FUNNEL_STAGES.reduce<Record<string, number>>((acc, stage) => {
    acc[stage.key] = people.filter((p) => p.stage === stage.key).length;
    return acc;
  }, {});

  const weeklyTrend = buildWeeklyTrend(people, today);
  const activity = buildActivityFeed(people, posts);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Your networking activity at a glance.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="New connections this week"
          value={newConnectionsThisWeek}
          description="People connected in the last 7 days"
        />
        <MetricCard
          label="Conversations past one exchange"
          value={conversationsPastOneExchange}
          description="Connections with more than a single back-and-forth"
        />
        <MetricCard
          label='"So, what do you do?" signals'
          value={askedWhatIDoSignals}
          description="Times someone asked unprompted"
        />
      </div>

      <Funnel counts={funnelCounts} />

      <ConnectionsTrendChart data={weeklyTrend} />

      <ActivityFeed items={activity} />
    </div>
  );
}
