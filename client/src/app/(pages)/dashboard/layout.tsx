import type { Metadata } from "next";
import React from "react";
import { Sidenav } from "./_components/SideNav";

export const metadata: Metadata = {
  title: "Dashboard | E-Learning Platform",
  description: "E-Learning Platform for students and teachers",
};
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-background font-space-grotesk">
      <Sidenav />
      <main className="md:pl-56 pt-4 md:pt-0">
        <div className="container mx-auto p-4 md:p-8">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
