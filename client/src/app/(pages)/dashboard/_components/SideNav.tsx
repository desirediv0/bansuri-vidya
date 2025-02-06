"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { GraduationCap } from "lucide-react";
import {
  BookOpen,
  Users,
  FilePlus,
  FileText,
  Puzzle,
  MapPin,
  ShoppingBasket,
} from "lucide-react";
import { NavItem } from "@/type";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navItems: NavItem[] = [
  {
    title: "All Courses",
    href: "/dashboard",
    icon: BookOpen,
  },
  {
    title: "Users",
    href: "/dashboard/users",
    icon: Users,
  },
  {
    title: "Create Course",
    href: "/dashboard/create-course",
    icon: FilePlus,
  },
  {
    title: "Draft Courses",
    href: "/dashboard/draft-courses",
    icon: FileText,
  },
  {
    title: "Coupons",
    href: "/dashboard/coupons",
    icon: Puzzle,
  },
  {
    title: "Address",
    href: "/dashboard/address",
    icon: MapPin,
  },
  {
    title: "Orders",
    href: "/dashboard/purchase",
    icon: ShoppingBasket,
  },
];

export function Sidenav() {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar className="border-r">
        <SidebarHeader className="px-6 py-4">
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        </SidebarHeader>
        <SidebarContent>
          <ScrollArea className="h-[calc(100vh-8rem)] px-4">
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="mr-3 h-5 w-5" />
                      <span className="text-base">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </ScrollArea>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full justify-start"
          >
            <Link href="/courses">
              <GraduationCap className="mr-3 h-5 w-5" />
              <span className="text-base font-medium">View All Courses</span>
            </Link>
          </Button>
        </SidebarFooter>
      </Sidebar>
      <div className="fixed top-4 left-4 z-40 md:hidden">
        <SidebarTrigger />
      </div>
    </SidebarProvider>
  );
}
