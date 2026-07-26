"use client";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

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

export type WeeklyConnections = {
  week: string;
  connections: number;
};

const chartConfig = {
  connections: {
    label: "Connections",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ConnectionsTrendChart({ data }: { data: WeeklyConnections[] }) {
  const hasData = data.some((week) => week.connections > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connections trend</CardTitle>
        <CardDescription>New connections per week, last 8 weeks</CardDescription>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ChartContainer config={chartConfig} className="aspect-auto h-64 w-full">
            <BarChart data={data} margin={{ left: 0, right: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="week"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="connections" fill="var(--color-connections)" radius={4} />
            </BarChart>
          </ChartContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            No connections logged in the last 8 weeks yet.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
