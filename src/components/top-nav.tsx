"use client";

import { useRouter, usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/people", label: "People" },
  { href: "/posts", label: "Posts" },
  { href: "/learning", label: "Learning" },
  { href: "/ideas", label: "Ideas" },
];

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();

  const active =
    NAV_ITEMS.find(
      (item) => item.href !== "/" && pathname.startsWith(item.href)
    )?.href ?? "/";

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-4">
        <span className="font-heading text-lg font-semibold">Signal Log</span>
        <Tabs value={active} onValueChange={(value) => router.push(value)}>
          <TabsList>
            {NAV_ITEMS.map((item) => (
              <TabsTrigger key={item.href} value={item.href}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </header>
  );
}
