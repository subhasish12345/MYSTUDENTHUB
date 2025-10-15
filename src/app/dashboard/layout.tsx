import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import { SidebarColorProvider } from "@/components/sidebar-color-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <SidebarColorProvider>
          <DashboardSidebar />
          <SidebarInset>
            <DashboardHeader />
            <main className="p-4 md:p-6 lg:p-8 bg-background">
                {children}
            </main>
          </SidebarInset>
        </SidebarColorProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}
