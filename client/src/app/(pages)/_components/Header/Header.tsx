"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MobileMenu from "./MobileMenu";
import { ChevronDown, LogIn, User } from "lucide-react";
import Image from "next/image";
import { useScrollEffect } from "./useScrollEffect";
import CustomButton from "../CustomButton";
import { useAuth } from "@/helper/AuthContext";
import axios from "axios"
import Cookies from "js-cookie"
import Cart from "../Cart"

const menuItems = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Courses", href: "/courses" },
  { name: "Instructors", href: "/instructors" },
  { name: "Testimonial", href: "/testimonial" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { headerState } = useScrollEffect();
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false)

  const { isAuthenticated, checkAuth } = useAuth()
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileMenuOpen]);

  const handleLogout = async () => {
    try {
      const accessToken = Cookies.get("accessToken")
      if (!accessToken) return

      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user/logout`,
        {},
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      Cookies.remove("accessToken")
      window.location.href = "/auth"
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerState === "transparent"
        ? "bg-transparent text-white"
        : headerState === "visible"
          ? "bg-white text-black shadow-md"
          : "bg-transparent text-white"
        }`}
      initial={{ y: 0 }}
      animate={{ y: headerState === "hidden" ? -100 : 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="container mx-auto px-10 py-5">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="text-2xl font-bold">
            <Image src={
              headerState === "transparent"
                ? "/logo.png"
                : "/logo-black.png"
            }
              alt="logo" width={200} height={100} />
          </Link>

          <nav className="hidden lg:flex space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="hover:text-gray-300 transition-colors font-semibold text-lg"
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
                    onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
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
                            handleLogout()
                            setIsProfileDropdownOpen(false)
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
                  bgColor={headerState === "transparent" ? "#fff" : "#ba1c33"}
                  hoverBgColor={headerState === "transparent" ? "#fff" : "#ba1c33"}
                  textColor={headerState === "transparent" ? "#000" : "#fff"}
                  hoverTextColor={headerState === "transparent" ? "#000" : "#fff"}
                />
              )}

              {/* Cart only visible in desktop mode when expanded */}
              <Cart headerState={headerState} />
            </div>
          </div>

          <button
            className="lg:hidden text-2xl"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            ☰
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <MobileMenu
            menuItems={menuItems}
            onClose={closeMobileMenu}
            headerState={headerState}
            handleLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </motion.header>
  );
}
