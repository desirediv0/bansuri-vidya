import Link from "next/link";
import { Home, BookOpen, User } from "lucide-react";
import { usePathname } from "next/navigation";

const navItems = [
  {
    name: "Home",
    href: "/",
    icon: Home,
  },
  {
    name: "My Learning",
    href: "/user-profile?tab=live-classes",
    icon: BookOpen,
  },
  {
    name: "Account",
    href: "/user-profile",
    icon: User,
  },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white shadow-[0_-2px_8px_rgba(0,0,0,0.04)] flex justify-around items-center h-20 border-t border-gray-200 lg:hidden">
      {navItems.map((item, idx) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href === "/user-profile?tab=live-classes" &&
            pathname.startsWith("/user-profile?tab=live-classes"));
        const isCenter = idx === 1;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center relative ${isCenter ? "-mt-8" : ""}`}
            style={isCenter ? { zIndex: 2 } : {}}
          >
            <div
              className={`flex items-center justify-center rounded-full transition-all duration-200 ${
                isCenter
                  ? isActive
                    ? "bg-white border-4 border-[#ba1c33] w-16 h-16 shadow-lg"
                    : "bg-white border-4 border-gray-200 w-16 h-16 shadow"
                  : "bg-transparent w-10 h-10"
              }`}
            >
              <Icon
                className={`w-7 h-7 ${
                  isCenter
                    ? isActive
                      ? "text-[#ba1c33]"
                      : "text-gray-400"
                    : isActive
                      ? "text-[#ba1c33]"
                      : "text-gray-400"
                }`}
              />
            </div>
            <span
              className={`text-xs mt-1 font-medium ${
                isCenter
                  ? isActive
                    ? "text-[#ba1c33]"
                    : "text-gray-400"
                  : isActive
                    ? "text-[#ba1c33]"
                    : "text-gray-400"
              }`}
              style={isCenter ? { marginTop: 8 } : {}}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
