
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
import { Bell, BookCheck } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { auth, db } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { ModeToggle } from "../mode-toggle";
import { useNotifications } from "@/hooks/use-notifications";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, writeBatch } from "firebase/firestore";
import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";

export interface AppNotification {
    id: string;
    title: string;
    body: string;
    link: string;
    isRead: boolean;
    createdAt: any;
}


export function DashboardHeader() {
  const { user } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);


  useEffect(() => {
    if (!user) return;

    const notifsRef = collection(db, "users", user.uid, "notifications");
    const q = query(notifsRef, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppNotification));
        setNotifications(notifsData);
        setUnreadCount(notifsData.filter(n => !n.isRead).length);
    });

    return () => unsubscribe();
  }, [user]);

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!user) return;
    if (!notification.isRead) {
        const notifRef = doc(db, "users", user.uid, "notifications", notification.id);
        await updateDoc(notifRef, { isRead: true });
    }
    router.push(notification.link);
  };
  
  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    const batch = writeBatch(db);
    notifications.forEach(notif => {
        if (!notif.isRead) {
            const notifRef = doc(db, "users", user.uid, "notifications", notif.id);
            batch.update(notifRef, { isRead: true });
        }
    });
    await batch.commit();
  };

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

        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full relative">
                    <Bell className="h-5 w-5"/>
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-destructive" />
                    )}
                    <span className="sr-only">Notifications</span>
                </Button>
            </DropdownMenuTrigger>
             <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex justify-between items-center">
                    Notifications
                    {unreadCount > 0 && <Button variant="link" size="sm" className="p-0 h-auto" onClick={markAllAsRead}>Mark all as read</Button>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.slice(0, 5).map(notif => (
                         <DropdownMenuItem key={notif.id} onClick={() => handleNotificationClick(notif)} className="flex flex-col items-start gap-1 cursor-pointer">
                            <div className="flex items-center gap-2 w-full">
                                {!notif.isRead && <span className="h-2 w-2 rounded-full bg-primary" />}
                                <p className="font-semibold text-sm flex-1">{notif.title}</p>
                            </div>
                            <p className="text-xs text-muted-foreground pl-4">{formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true })}</p>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <p className="p-4 text-sm text-center text-muted-foreground">No notifications yet.</p>
                )}
            </DropdownMenuContent>
        </DropdownMenu>

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
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings">Settings</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
