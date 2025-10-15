import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { NotificationProvider } from "@/hooks/use-notifications";
import { SidebarColorProvider } from "@/components/sidebar-color-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <NotificationProvider>
          <FirebaseErrorListener />
          <SidebarProvider>
              <DashboardSidebar />
              <SidebarInset>
              <DashboardHeader />
              <main className="p-4 md:p-6 lg:p-8 bg-background">
                  {children}
              </main>
              </SidebarInset>
          </SidebarProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
