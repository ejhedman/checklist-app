import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Footer } from "@/components/layout/Footer";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Release Management Checklist",
  description: "Plan, track, and complete software releases with structured checklists",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <ProtectedRoute>
            <div className="min-h-screen bg-background">
              <Header />
              <div className="flex">
                <Sidebar />
                <main className="flex-1 p-6">
                  {children}
                </main>
              </div>
              <Footer />
            </div>
          </ProtectedRoute>
        </AuthProvider>
      </body>
    </html>
  );
} 