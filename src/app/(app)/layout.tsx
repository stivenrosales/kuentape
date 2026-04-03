import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Topbar } from "@/components/layout/topbar";
import {
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userName = session.user.name ?? "Usuario";
  const userRole = (session.user as any).role ?? "CONTADOR";
  const userEmail = session.user.email ?? "";

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        userName={userName}
        userEmail={userEmail}
        userRole={userRole}
      />
      <SidebarInset>
        <Topbar userName={userName} userRole={userRole} />
        <main className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
