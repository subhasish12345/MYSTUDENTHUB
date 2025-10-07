
"use client";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Timer,
  Settings,
  LogOut,
  GraduationCap,
  ClipboardCheck,
  Megaphone,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

const allMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/notice-board", label: "Notice Board", icon: Megaphone },
  { href: "/dashboard/events", label: "Events", icon: Calendar },
  { href: "/dashboard/assignments", label: "Assignments", icon: Briefcase },
  { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck, teacherOnly: true },
  { href: "/dashboard/circles", label: "Circles", icon: Users },
  { href: "/dashboard/focus", label: "Focus Session", icon: Timer },
  { href: "/dashboard/admin", label: "Admin", icon: Settings, adminOnly: true },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { userRole } = useAuth();

  const menuItems = allMenuItems.filter(item => {
    if (item.adminOnly) return userRole === "admin";
    if (item.teacherOnly) return userRole === "teacher" || userRole === "admin";
    return true;
  });

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/dashboard" className="flex items-center gap-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <h2 className="font-headline text-2xl font-bold text-foreground group-data-[collapsible=icon]:hidden">
                MyStudentHub
            </h2>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton
                asChild
                isActive={pathname === item.href}
                tooltip={{ children: item.label }}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
            <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{ children: "Logout" }}>
                    <Link href="/">
                        <LogOut />
                        <span>Logout</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
