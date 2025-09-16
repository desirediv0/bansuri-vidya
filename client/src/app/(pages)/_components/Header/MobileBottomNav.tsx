"use client";

import Link from "next/link";
import { Home, BookOpen, User, LogIn } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/helper/AuthContext";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuth();

  // Define nav sets based on auth
  const loggedOutNav = [
    { name: "Home", href: "/", icon: Home },
    { name: "Courses", href: "/online-courses", icon: BookOpen },
    { name: "Login", href: "/auth", icon: LogIn },
  ];

  const loggedInNav = [
    { name: "Home", href: "/", icon: Home },
    { name: "My Learning", href: "/user-profile?tab=live-classes", icon: BookOpen },
    { name: "Courses", href: "/online-courses", icon: BookOpen },
    { name: "Account", href: "/user-profile", icon: User },
  ];

  const items = isAuthenticated ? loggedInNav : loggedOutNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)] h-20 border-t border-gray-200 lg:hidden">
      <div className="flex h-full">
        {items.map((item) => {
          const Icon = item.icon;
          // Determine active state. Special-case user-profile and its tab param
          let isActive = pathname === item.href;

          // If the item is My Learning, it should be active only when path is /user-profile and tab=live-classes
          if (item.href === "/user-profile?tab=live-classes") {
            isActive = pathname === "/user-profile" && searchParams?.get("tab") === "live-classes";
          }

          // If the item is Account, it should be active when path is /user-profile and tab is not live-classes (or missing)
          if (item.href === "/user-profile") {
            isActive = pathname === "/user-profile" && searchParams?.get("tab") !== "live-classes";
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              aria-label={item.name}
              className={`flex-1 flex flex-col items-center justify-center transition-colors duration-150 ${isActive ? "text-[#ba1c33]" : "text-gray-400"}`}
            >
              <Icon className={`w-7 h-7 ${isActive ? "text-[#ba1c33]" : "text-gray-400"}`} />
              <span className={`text-xs mt-1 font-medium ${isActive ? "text-[#ba1c33]" : "text-gray-400"}`}>{item.name}</span>
              {/* active indicator dot */}
              <span className={`block mt-1 h-1 w-1 rounded-full ${isActive ? "bg-[#ba1c33]" : "bg-transparent"}`} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
