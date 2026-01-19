"use client";

import React from "react";
import { motion } from "framer-motion";
import { NavBar } from "./navbar";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import { Footer } from "./footer";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";

interface MainLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerDescription?: string;
}

export function MainLayout({
  children,
  headerTitle,
  headerDescription,
}: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <NavBar />

      <SidebarProvider>
        <div className="flex flex-1 min-h-[calc(100vh-4rem)]">
          <Sidebar />

          <SidebarInset className="flex flex-col min-h-[calc(100vh-4rem)]">
            <Header title={headerTitle} description={headerDescription} />

            <motion.main
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                type: "spring",
                stiffness: 100,
              }}
              className="flex-1 p-4 md:p-6 lg:p-8"
            >
              <div className="max-w-7xl mx-auto w-full">{children}</div>
            </motion.main>

            <Footer />
          </SidebarInset>
        </div>
      </SidebarProvider>
    </div>
  );
}
