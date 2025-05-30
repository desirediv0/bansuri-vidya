"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  GraduationCap,
  MapPinHouse,
  Menu,
  Puzzle,
  School,
  ShoppingBasket,
  BookOpen,
  FilePlus,
  FileText,
  MessageSquare,
  Award,
  Folder,
  KeyRound,
  Video,
  LogOut,
  ChevronDown,
  LucideIcon,
} from "lucide-react";
import axios from "axios";
import Cookies from "js-cookie";

interface NavItemChild {
  title: string;
  href: string;
}

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  children?: NavItemChild[];
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

interface NavGroups {
  [key: string]: NavGroup;
}

const navItems: NavItem[] = [
  {
    title: "My Courses",
    href: "/dashboard",
    icon: BookOpen,
  },
  {
    title: "Course Access",
    href: "/dashboard/access-course",
    icon: KeyRound,
  },
  {
    title: "Categories",
    href: "/dashboard/categories",
    icon: Folder,
  },
  {
    title: "Student List",
    href: "/dashboard/students",
    icon: School,
  },
  {
    title: "Reviews",
    href: "/dashboard/reviews",
    icon: MessageSquare,
    children: [
      {
        title: "Course Reviews",
        href: "/dashboard/reviews",
      },
      {
        title: "L",
        href: "/dashboard/live-reviews",
      },
    ],
  },
  {
    title: "New Course",
    href: "/dashboard/create-course",
    icon: FilePlus,
  },
  {
    title: "Saved Drafts",
    href: "/dashboard/draft-courses",
    icon: FileText,
  },
  {
    title: "Coupons",
    href: "/dashboard/coupons",
    icon: Puzzle,
  },
  {
    title: "Location",
    href: "/dashboard/address",
    icon: MapPinHouse,
  },
  {
    title: "Sales History",
    href: "/dashboard/purchase",
    icon: ShoppingBasket,
  },
  {
    title: "Certificates",
    href: "/dashboard/certificates",
    icon: Award,
  },
  {
    title: "Live Classes",
    href: "/dashboard/zoom",
    icon: Video,
  },
  {
    title: "Contact Form",
    href: "/dashboard/contacts",
    icon: MessageSquare,
  },
];

// Course links for dropdown
const courseLinks = [
  { name: "Online Courses", href: "/online-courses" },
  { name: "Live Classes", href: "/live-classes" },
  { name: "Offline Batches", href: "/offline-batches" },
];

// Logout handler function
const handleLogout = async () => {
  try {
    const accessToken = Cookies.get("accessToken");
    if (!accessToken) return;

    await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/user/logout`,
      {},
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    Cookies.remove("accessToken");
    window.location.href = "/auth";
  } catch (error) {
    console.error("Logout error:", error);
  }
};

// Group navigation items by category
const navGroups: NavGroups = {
  courses: {
    title: "Courses",
    items: [
      {
        title: "Courses",
        href: "/dashboard",
        icon: BookOpen,
      },
    ],
  },
  management: {
    title: "Management",
    items: [
      {
        title: "Categories",
        href: "/dashboard/categories",
        icon: Folder,
      },
      {
        title: "Student List",
        href: "/dashboard/students",
        icon: School,
      },
      {
        title: "Live Classes",
        href: "/dashboard/zoom",
        icon: Video,
      },
    ],
  },
  marketing: {
    title: "Marketing & Sales",
    items: [
      {
        title: "Coupons",
        href: "/dashboard/coupons",
        icon: Puzzle,
      },
      {
        title: "Sales History",
        href: "/dashboard/purchase",
        icon: ShoppingBasket,
      },
      {
        title: "Location",
        href: "/dashboard/address",
        icon: MapPinHouse,
      },
    ],
  },
  feedback: {
    title: "Feedback & Support",
    items: [
      {
        title: "Reviews",
        href: "/dashboard/reviews",
        icon: MessageSquare,
        children: [
          {
            title: "Course Reviews",
            href: "/dashboard/reviews",
          },
          {
            title: "Live Reviews",
            href: "/dashboard/live-reviews",
          },
        ],
      },
      {
        title: "Contact Form",
        href: "/dashboard/contacts",
        icon: MessageSquare,
      },
      {
        title: "Certificates",
        href: "/dashboard/certificates",
        icon: Award,
      },
    ],
  },
};

export function Sidenav() {
  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-40 md:hidden hover:bg-red-500/10"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="w-60 p-0 bg-gradient-to-b from-red-50 to-white"
        >
          <MobileNav />
        </SheetContent>
      </Sheet>
      <nav className="hidden md:block fixed top-0 left-0 h-full w-60 bg-gradient-to-b from-red-50 to-white border-r border-red-100/40 shadow-sm">
        <ScrollArea className="h-full">
          <div className="px-6 py-8">
            <div className="flex items-center gap-2 mb-8">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                  Admin Portal
                </h1>
                <p className="text-xs text-red-600/80">Manage your courses</p>
              </div>
            </div>
            <SidenavItems />
          </div>
        </ScrollArea>
      </nav>
    </>
  );
}

function SidenavItems() {
  const pathname = usePathname();
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false);
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);

  const toggleSubMenu = (href: string) => {
    setOpenSubMenus((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="space-y-6">
        {Object.entries(navGroups).map(([key, group]) => (
          <div key={key} className="space-y-2">
            <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {group.title}
            </h3>
            <div className="space-y-1">
              {group.items.map((item) => (
                <div key={item.href}>
                  {item.children ? (
                    <>
                      <button
                        onClick={() => toggleSubMenu(item.href)}
                        className={cn(
                          "group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out w-full",
                          pathname.startsWith(item.href)
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200"
                            : "text-gray-600 hover:bg-red-100/50 hover:text-red-600 hover:shadow-sm"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:scale-110",
                            pathname.startsWith(item.href)
                              ? "text-white"
                              : "text-gray-400 group-hover:text-red-500"
                          )}
                        />
                        <span>{item.title}</span>
                        <ChevronDown
                          className={cn(
                            "ml-auto h-4 w-4 transition-transform",
                            openSubMenus.includes(item.href) && "rotate-180"
                          )}
                        />
                      </button>
                      {openSubMenus.includes(item.href) && (
                        <div className="ml-6 mt-1 space-y-1">
                          {item.children.map((child) => (
                            <Link key={child.href} href={child.href}>
                              <span
                                className={cn(
                                  "group flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
                                  pathname === child.href
                                    ? "bg-red-100 text-red-600"
                                    : "text-gray-600 hover:bg-red-50 hover:text-red-600"
                                )}
                              >
                                {child.title}
                              </span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={item.href}>
                      <span
                        className={cn(
                          "group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                          pathname === item.href
                            ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200"
                            : "text-gray-600 hover:bg-red-100/50 hover:text-red-600 hover:shadow-sm"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "mr-3 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:scale-110",
                            pathname === item.href
                              ? "text-white"
                              : "text-gray-400 group-hover:text-red-500"
                          )}
                        />
                        <span>{item.title}</span>
                      </span>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto space-y-4">
        <Separator />

        <div className="relative">
          <button
            onClick={() => setIsCoursesDropdownOpen(!isCoursesDropdownOpen)}
            className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium bg-gradient-to-r from-red-50 to-red-100/50 text-red-600 hover:from-red-100 hover:to-red-200/50 transition-colors shadow-sm"
          >
            <div className="flex items-center">
              <GraduationCap className="mr-3 h-5 w-5" />
              <span>View All Courses</span>
            </div>
            <ChevronDown
              className={`h-4 w-4 transform transition-transform duration-200 ${
                isCoursesDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isCoursesDropdownOpen && (
            <div className="mt-2 rounded-xl overflow-hidden bg-white shadow-md border border-red-100/50">
              {courseLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <div className="px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                    {link.name}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center rounded-xl px-4 py-3 text-sm font-medium bg-gradient-to-r from-red-100 to-red-200/70 text-red-600 hover:from-red-200 hover:to-red-300/70 transition-colors shadow-sm"
        >
          <LogOut className="mr-3 h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const [openSubMenus, setOpenSubMenus] = useState<string[]>([]);
  const [isCoursesDropdownOpen, setIsCoursesDropdownOpen] = useState(false);

  const toggleSubMenu = (href: string) => {
    setOpenSubMenus((prev) =>
      prev.includes(href)
        ? prev.filter((item) => item !== href)
        : [...prev, href]
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="px-6 py-8">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-200">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
              Admin Portal
            </h1>
            <p className="text-xs text-red-600/80">Manage your courses</p>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(navGroups).map(([key, group]) => (
            <div key={key} className="space-y-2">
              <h3 className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <div key={item.href}>
                    {item.children ? (
                      <>
                        <button
                          onClick={() => toggleSubMenu(item.href)}
                          className={cn(
                            "group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out w-full",
                            pathname.startsWith(item.href)
                              ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200"
                              : "text-gray-600 hover:bg-red-100/50 hover:text-red-600 hover:shadow-sm"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "mr-3 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:scale-110",
                              pathname.startsWith(item.href)
                                ? "text-white"
                                : "text-gray-400 group-hover:text-red-500"
                            )}
                          />
                          <span>{item.title}</span>
                          <ChevronDown
                            className={cn(
                              "ml-auto h-4 w-4 transition-transform",
                              openSubMenus.includes(item.href) && "rotate-180"
                            )}
                          />
                        </button>
                        {openSubMenus.includes(item.href) && (
                          <div className="ml-6 mt-1 space-y-1">
                            {item.children.map((child) => (
                              <Link key={child.href} href={child.href}>
                                <span
                                  className={cn(
                                    "group flex items-center rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ease-in-out",
                                    pathname === child.href
                                      ? "bg-red-100 text-red-600"
                                      : "text-gray-600 hover:bg-red-50 hover:text-red-600"
                                  )}
                                >
                                  {child.title}
                                </span>
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link href={item.href}>
                        <span
                          className={cn(
                            "group flex items-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out",
                            pathname === item.href
                              ? "bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-200"
                              : "text-gray-600 hover:bg-red-100/50 hover:text-red-600 hover:shadow-sm"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "mr-3 h-4 w-4 transition-transform duration-200 ease-in-out group-hover:scale-110",
                              pathname === item.href
                                ? "text-white"
                                : "text-gray-400 group-hover:text-red-500"
                            )}
                          />
                          <span>{item.title}</span>
                        </span>
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-4">
          <Separator />

          <div className="relative">
            <button
              onClick={() => setIsCoursesDropdownOpen(!isCoursesDropdownOpen)}
              className="w-full flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium bg-gradient-to-r from-red-50 to-red-100/50 text-red-600 hover:from-red-100 hover:to-red-200/50 transition-colors shadow-sm"
            >
              <div className="flex items-center">
                <GraduationCap className="mr-3 h-5 w-5" />
                <span>View All Courses</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transform transition-transform duration-200 ${
                  isCoursesDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isCoursesDropdownOpen && (
              <div className="mt-2 rounded-xl overflow-hidden bg-white shadow-md border border-red-100/50">
                {courseLinks.map((link) => (
                  <Link key={link.href} href={link.href}>
                    <div className="px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors">
                      {link.name}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center rounded-xl px-4 py-3 text-sm font-medium bg-gradient-to-r from-red-100 to-red-200/70 text-red-600 hover:from-red-200 hover:to-red-300/70 transition-colors shadow-sm"
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </ScrollArea>
  );
}

function Separator() {
  return (
    <div className="h-px bg-gradient-to-r from-red-100/50 via-red-200/50 to-red-100/50 my-4" />
  );
}
