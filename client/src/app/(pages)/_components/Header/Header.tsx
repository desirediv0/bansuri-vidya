"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import MobileMenu from "./MobileMenu";
import { LogIn } from "lucide-react";
import Image from "next/image";
import { useScrollEffect } from "./useScrollEffect";
import CustomButton from "../CustomButton";

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

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        headerState === "transparent"
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
            <CustomButton
              primaryText="Login"
              secondaryText="Login"
              icon={<LogIn className="h-5 w-5" />}
              href="/login"
              bgColor={headerState === "transparent" ? "#fff" : "#ba1c33"}
              hoverBgColor={headerState === "transparent" ? "#fff" : "#ba1c33"}
              textColor={headerState === "transparent" ? "#000" : "#fff"}
              hoverTextColor={headerState === "transparent" ? "#000" : "#fff"}
            />
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
          <MobileMenu menuItems={menuItems} onClose={closeMobileMenu} />
        )}
      </AnimatePresence>
    </motion.header>
  );
}
