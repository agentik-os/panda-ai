"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Home,
  Bot,
  DollarSign,
  Zap,
  Workflow,
  Radio,
  Brain,
  Activity,
  Settings,
  ChevronLeft,
  Moon,
  Clock,
} from "lucide-react";

const navItems = [
  {
    title: "Overview",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Agents",
    href: "/dashboard/agents",
    icon: Bot,
  },
  {
    title: "Cost X-Ray",
    href: "/dashboard/costs",
    icon: DollarSign,
  },
  {
    title: "Skills",
    href: "/dashboard/skills",
    icon: Zap,
  },
  {
    title: "Automations",
    href: "/dashboard/automations",
    icon: Workflow,
  },
  {
    title: "Channels",
    href: "/dashboard/channels",
    icon: Radio,
  },
  {
    title: "Memory",
    href: "/dashboard/memory",
    icon: Brain,
  },
  {
    title: "Agent Dreams",
    href: "/dashboard/dreams",
    icon: Moon,
  },
  {
    title: "Time Travel",
    href: "/dashboard/time-travel",
    icon: Clock,
  },
  {
    title: "Metrics",
    href: "/dashboard/metrics",
    icon: Activity,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
];

interface DashboardSidebarProps {
  className?: string;
  collapsed?: boolean;
  onCollapse?: () => void;
}

export function DashboardSidebar({
  className,
  collapsed = false,
  onCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-300",
        collapsed ? "w-16" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Agentik OS</span>
          </Link>
        )}
        {collapsed && (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
        )}
        {onCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCollapse}
            className={cn("h-8 w-8", collapsed && "rotate-180")}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start gap-3",
                    collapsed ? "justify-center px-2" : "px-3"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* User Profile */}
      <div className="border-t p-4">
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed ? "justify-center" : ""
          )}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback>AO</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium">Agentik User</p>
              <p className="truncate text-xs text-muted-foreground">
                user@agentik-os.com
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
