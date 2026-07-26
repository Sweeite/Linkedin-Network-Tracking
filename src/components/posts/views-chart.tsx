"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { Database } from "@/lib/database.types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type Post = Database["public"]["Tables"]["posts"]["Row"];

const chartConfig = {
  views: {
    label: "Views",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function formatDate(date: string) {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function ViewsChart({ posts }: { posts: Post[] }) {
  const data = React.useMemo(
    () =>
      posts
        .filter((post): post is Post & { date_posted: string } =>
          Boolean(post.date_posted)
        )
        .sort((a, b) => a.date_posted.localeCompare(b.date_posted))
        .map((post) => ({
          date: post.date_posted,
          views: post.views ?? 0,
          title: post.title || "Untitled post",
        })),
    [posts]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Views over time</CardTitle>
        <CardDescription>
          Post views plotted by the date they were posted.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex aspect-video items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            No dated posts yet — add a post with a date to see the trend.
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full">
            <AreaChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={formatDate}
                minTickGap={24}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.title ?? ""
                    }
                    labelKey="date"
                  />
                }
              />
              <Area
                dataKey="views"
                type="monotone"
                fill="var(--color-views)"
                fillOpacity={0.2}
                stroke="var(--color-views)"
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
