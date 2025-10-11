"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ModeToggle } from "../mode-toggle";

export function DashboardHeader() {
  const { user } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    auth.signOut().then(() => {
      router.replace('/');
    });
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <div className="md:hidden">
        <SidebarTrigger />
      </div>

      <div className="flex-1">
        {/* Placeholder for Breadcrumbs or Title */}
      </div>

      <div className="flex items-center gap-4">
        <ModeToggle />
        <Button variant="ghost" size="icon" className="rounded-full">
            <Bell className="h-5 w-5"/>
            <span className="sr-only">Notifications</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.photoURL || "https://picsum.photos/seed/user-avatar/100/100"} alt="User avatar" data-ai-hint="person face" />
                <AvatarFallback>{user?.displayName?.substring(0, 2).toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile">Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
