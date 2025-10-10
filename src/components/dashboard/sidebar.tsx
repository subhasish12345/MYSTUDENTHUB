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
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";

const allMenuItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/notice-board", label: "Notice Board", icon: Megaphone },
  { href: "/dashboard/assignments", label: "Assignments", icon: Briefcase },
  { href: "/dashboard/attendance", label: "Attendance", icon: ClipboardCheck, teacherOnly: true },
  { href: "/dashboard/circles", label: "Circles", icon: Users },
  { href: "/dashboard/focus", label: "Focus Session", icon: Timer },
  { href: "/dashboard/admin", label: "Admin", icon: Settings, adminOnly: true },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { userRole } = useAuth();

  const menuItems = allMenuItems.filter(item => {
    if (item.adminOnly) return userRole === "admin";
    if (item.teacherOnly) return userRole === "teacher" || userRole === "admin";
    return true;
  });

  const handleLogout = async () => {
    await auth.signOut();
    router.replace('/'); // Force a clean redirect to the login page.
  };


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
                isActive={pathname.startsWith(item.href)}
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
                <SidebarMenuButton onClick={handleLogout} tooltip={{ children: "Logout" }}>
                    <LogOut />
                    <span>Logout</span>
                </SidebarMenuButton>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
