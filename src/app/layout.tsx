import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ToastProvider } from "@/components/ui/toast";
import { ProjectRequiredMessage } from "@/components/layout/ProjectRequiredMessage";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Release Management Checklist",
  description: "Plan, track, and deployed software releases with structured checklists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className + " h-screen overflow-hidden"}>
        <AuthProvider>
          <SidebarProvider>
            <ProtectedRoute>
              <ToastProvider>
                <Header />
                <div className="flex h-[calc(100vh-80px)] pb-20">
                  <Sidebar />
                  <main
                    className="flex-1 overflow-y-auto bg-background p-4 sm:p-6 pt-4 transition-all duration-300 ease-in-out lg:ml-64"
                  >
                    <ProjectRequiredMessage>
                      {children}
                    </ProjectRequiredMessage>
                  </main>
                </div>
                <Footer />
              </ToastProvider>
            </ProtectedRoute>
          </SidebarProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 