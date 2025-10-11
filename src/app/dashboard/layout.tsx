import { DashboardHeader } from "@/components/dashboard/header";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/hooks/use-auth";
import { AiChat } from "@/components/dashboard/ai/ai-chat";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <DashboardSidebar />
        <SidebarInset>
          <DashboardHeader />
          <main className="p-4 md:p-6 lg:p-8">
              {children}
          </main>
          <AiChat />
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
}
