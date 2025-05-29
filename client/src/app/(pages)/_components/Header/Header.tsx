"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown,
  LogIn,
  User,
  Home,
  BookOpen,
  Video,
  School,
  Info,
  MessageSquare,
} from "lucide-react";
import Image from "next/image";
import { useScrollEffect } from "./useScrollEffect";
import CustomButton from "../CustomButton";
import { useAuth } from "@/helper/AuthContext";
import axios from "axios";
import Cookies from "js-cookie";
import Cart from "../Cart";
import { usePathname } from "next/navigation";

const menuItems = [
  { name: "Home", mobileText: "Home", href: "/", icon: Home },
  {
    name: "Online Courses",
    mobileText: "Online",
    href: "/online-courses",
    icon: BookOpen,
  },
  {
    name: "Live Classes",
    mobileText: "Live",
    href: "/live-classes",
    icon: Video,
  },
  {
    name: "Offline Batches",
    mobileText: "Offline",
    href: "/offline-batches",
    icon: School,
  },
  { name: "About", mobileText: "About", href: "/about", icon: Info },
  {
    name: "Contact",
    mobileText: "Contact",
    href: "/contact",
    icon: MessageSquare,
  },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { headerState } = useScrollEffect();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const pathname = usePathname();

  const isUserProfilePage =
    pathname === "/user-profile" ||
    pathname === "/buy" ||
    (pathname.startsWith("/courses/") && pathname.split("/").length > 3) ||
    pathname === "/reset-password" ||
    pathname === "/verify-email";

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isProfileDropdownOpen) {
        setIsProfileDropdownOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isProfileDropdownOpen]);

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

  // Close dropdown when navigating to a new page
  const handleMenuClick = (href: string) => {
    if (isProfileDropdownOpen) {
      setIsProfileDropdownOpen(false);
    }

    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }

    // If we're already on the same page, just close the menus
    if (pathname === href) {
      return;
    }
  };

  // Apply different styles for user profile page
  const headerStyles = isUserProfilePage
    ? "bg-[#f5f5f5] text-black shadow-sm"
    : `${
        headerState === "transparent"
          ? "bg-transparent text-white"
          : headerState === "visible"
            ? "bg-white text-black shadow-md"
            : "bg-transparent text-white"
      }`;

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-[999] transition-all duration-300 ${headerStyles}`}
        initial={{ y: 0 }}
        animate={{ y: headerState === "hidden" ? -100 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className={`container mx-auto px-10 py-5 ${isUserProfilePage ? "flex items-center" : ""}`}
        >
          <div
            className={`flex items-center justify-between ${isUserProfilePage ? "w-full" : "h-20"}`}
          >
            <Link
              href="/"
              className="text-2xl font-bold"
              onClick={() => {
                handleMenuClick("/");
                if (isMobileMenuOpen) setIsMobileMenuOpen(false);
              }}
            >
              <Image
                src={
                  isUserProfilePage
                    ? "/logo-black.png"
                    : headerState === "transparent"
                      ? "/logo.png"
                      : "/logo-black.png"
                }
                alt="logo"
                width={isUserProfilePage ? 150 : 200}
                height={isUserProfilePage ? 75 : 100}
                priority
              />
            </Link>
            {isUserProfilePage ? (
              <>
                <nav className="hidden lg:flex space-x-6">
                  {menuItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-gray-700 hover:text-red-500 transition-colors font-medium text-base"
                      onClick={() => handleMenuClick(item.href)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="flex items-center space-x-6">
                  <div className="relative hidden lg:block">
                    <button
                      onClick={() =>
                        setIsProfileDropdownOpen(!isProfileDropdownOpen)
                      }
                      className="flex items-center space-x-2 text-gray-700 hover:text-red-500"
                    >
                      <User className="h-6 w-6" />
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {isProfileDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-[1000]"
                        >
                          <Link
                            href="/user-profile"
                            className="block px-4 py-2 text-gray-800 hover:bg-red-50"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            Profile
                          </Link>
                          <button
                            onClick={() => {
                              handleLogout();
                              setIsProfileDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-gray-800 hover:bg-red-50"
                          >
                            Logout
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="flex items-center lg:hidden gap-3">
                    <Cart headerState="visible" />
                    {isAuthenticated ? (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setIsProfileDropdownOpen(!isProfileDropdownOpen)
                          }
                          className="p-2 rounded-full text-gray-700 hover:bg-gray-100"
                        >
                          <User className="h-5 w-5" />
                        </button>
                        <AnimatePresence>
                          {isProfileDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-[1000]"
                            >
                              <Link
                                href="/user-profile"
                                className="block px-4 py-2 text-gray-800 hover:bg-red-50"
                                onClick={() => setIsProfileDropdownOpen(false)}
                              >
                                Profile
                              </Link>
                              <button
                                onClick={() => {
                                  handleLogout();
                                  setIsProfileDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-red-50"
                              >
                                Logout
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <Link
                        href="/auth"
                        className="p-2 rounded-full text-gray-700 hover:bg-gray-100"
                      >
                        <LogIn className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <>
                <nav className="hidden lg:flex space-x-8">
                  {menuItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="hover:text-gray-300 transition-colors font-semibold text-lg"
                      onClick={() => handleMenuClick(item.href)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
                <div className="hidden lg:block">
                  <div className="hidden md:flex items-center space-x-4">
                    {isAuthenticated ? (
                      <div className="relative">
                        <button
                          onClick={() =>
                            setIsProfileDropdownOpen(!isProfileDropdownOpen)
                          }
                          className={`flex items-center space-x-2  ${headerState === "transparent" ? "text-white hover:text-red-500" : "text-black hover:text-red-500"}`}
                        >
                          <User className="h-5 w-5" />
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        <AnimatePresence>
                          {isProfileDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2"
                            >
                              <Link
                                href="/user-profile"
                                className="block px-4 py-2 text-gray-800 hover:bg-red-50"
                                onClick={() => setIsProfileDropdownOpen(false)}
                              >
                                Profile
                              </Link>
                              <button
                                onClick={() => {
                                  handleLogout();
                                  setIsProfileDropdownOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-gray-800 hover:bg-red-50"
                              >
                                Logout
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <CustomButton
                        primaryText="Login"
                        secondaryText="Login"
                        icon={<LogIn className="h-5 w-5" />}
                        href="/auth"
                        bgColor={
                          headerState === "transparent" ? "#fff" : "#ba1c33"
                        }
                        hoverBgColor={
                          headerState === "transparent" ? "#fff" : "#ba1c33"
                        }
                        textColor={
                          headerState === "transparent" ? "#000" : "#fff"
                        }
                        hoverTextColor={
                          headerState === "transparent" ? "#000" : "#fff"
                        }
                      />
                    )}

                    <Cart headerState={headerState} />
                  </div>
                </div>
                <div className="flex items-center lg:hidden gap-3 justify-center">
                  <Cart headerState={headerState} />
                  {isAuthenticated ? (
                    <div className="relative">
                      <button
                        onClick={() =>
                          setIsProfileDropdownOpen(!isProfileDropdownOpen)
                        }
                        className={`p-2 rounded-full ${
                          headerState === "transparent"
                            ? "text-white hover:bg-white/10"
                            : "text-black hover:bg-gray-100"
                        }`}
                      >
                        <User className="h-5 w-5" />
                      </button>
                      <AnimatePresence>
                        {isProfileDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2"
                          >
                            <Link
                              href="/user-profile"
                              className="block px-4 py-2 text-gray-800 hover:bg-red-50"
                              onClick={() => setIsProfileDropdownOpen(false)}
                            >
                              Profile
                            </Link>
                            <button
                              onClick={() => {
                                handleLogout();
                                setIsProfileDropdownOpen(false);
                              }}
                              className="w-full text-left px-4 py-2 text-gray-800 hover:bg-red-50"
                            >
                              Logout
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <Link
                      href="/auth"
                      className={`p-2 rounded-full ${
                        headerState === "transparent"
                          ? "text-white hover:bg-white/10"
                          : "text-black hover:bg-gray-100"
                      }`}
                    >
                      <LogIn className="h-5 w-5" />
                    </Link>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </motion.header>

      {/* Mobile Bottom Navigation - Now with scroll handling */}
      <motion.nav
        style={{
          boxShadow: "0 -8px 15px -3px rgba(0, 0, 0, 0.1)",
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          transform: `translateY(${headerState === "hidden" ? "0" : "0"}px)`,
          transition: "transform 0.3s ease-in-out",
        }}
        className="bg-white/90 backdrop-blur-lg border-t border-gray-100 lg:hidden"
      >
        <div className="max-w-screen-xl mx-auto">
          <div className="grid grid-cols-5 gap-0.5 px-1">
            {menuItems.slice(0, 5).map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1.5 relative group ${
                  pathname === item.href ? "text-[#ba1c33]" : "text-gray-500"
                }`}
                onClick={() => handleMenuClick(item.href)}
              >
                {/* Active Indicator */}
                {pathname === item.href && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute -top-[1px] left-0 right-0 h-[2px] bg-[#ba1c33]"
                    initial={false}
                    transition={{
                      type: "spring",
                      stiffness: 500,
                      damping: 30,
                    }}
                  />
                )}

                {/* Icon Container */}
                <div className="relative">
                  <item.icon
                    className={`w-5 h-5 transition-all duration-300 ${
                      pathname === item.href
                        ? "text-[#ba1c33] scale-105"
                        : "text-gray-500 group-hover:text-[#ba1c33] group-hover:scale-105"
                    }`}
                  />
                </div>

                {/* Text */}
                <span
                  className={`text-[10px] mt-0.5 transition-all duration-300 ${
                    pathname === item.href
                      ? "text-[#ba1c33] font-medium"
                      : "text-gray-500 group-hover:text-[#ba1c33]"
                  }`}
                >
                  {item.mobileText}
                </span>

                {/* Hover Effect */}
                <motion.div
                  className="absolute inset-0 bg-[#ba1c33]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 25,
                  }}
                />
              </Link>
            ))}
          </div>
        </div>
      </motion.nav>
    </>
  );
}
