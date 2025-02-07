import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Handshake,
  Phone,
  Send,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
} from "lucide-react";
import CustomButton from "./CustomButton";
import Link from "next/link";
import { AnimatedText } from "./AnimatedText";
import Image from "next/image";

const socialLinks = [
  { icon: Facebook, href: "/facebook" },
  { icon: Instagram, href: "/instagram" },
  { icon: Twitter, href: "/twitter" },
  { icon: Youtube, href: "/youtube" },
];

const navLinks = [
  { name: "Home", href: "/" },
  { name: "About", href: "/about" },
  { name: "Courses", href: "/courses" },
  { name: "Instructors", href: "/instructors" },
  { name: "Testimonial", href: "/testimonial" },
];

const popularCourses = [
  { name: "Refund", href: "/refund" },
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Support", href: "/support" },
  { name: "Contact", href: "/contact" },
];

function Footer() {
  return (
    <div className="relative">
      {/* Top Banner Section */}
      <div className="md:absolute md:inset-x-0 md:-top-24 z-10">
        <div className="mx-auto md:max-w-6xl md:px-4 ">
          <div className="md:rounded-lg bg-[#ba1c32] shadow-lg">
            <div className="flex flex-col items-center justify-between gap-4 px-6 py-8 md:flex-row">
              {/* <AnimatedText
                text="Still Confused ? "
                className="text-xl font-semibold text-[#fff]"
              /> */}
              {/* <div> */}
              {/* <p className="text-2xl font-semibold text-[#fff] block pb-3">Still Confused ?</p> */}
              <p className="text-xl font-semibold text-[#fff] block">Still Confused ? Contact us today to know more about us </p>
              {/* </div> */}

              <div className="flex flex-col items-center gap-4 sm:flex-row">
                <CustomButton
                  primaryText="Contact Us"
                  secondaryText="Contact Us"
                  bgColor="#fff"
                  hoverBgColor="#2A3342"
                  hoverTextColor="#fff"
                  textColor="#ba1c32"
                  className="w-48"
                />
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-[#fff]" />
                  <span className="text-base font-medium text-[#fff]">
                    +1234 567 8910
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <footer className="md:mt-32 bg-[#000] pt-16">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3">

                <Link href="/">
                  <Image src="/logo.png" alt="logo" width={200} height={100} />
                </Link>
              </div>
              <p className="text-gray-400">
                We are providing high-quality courses for about ten years.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <Link
                      key={social.href}
                      href={social.href}
                      className="text-white hover:text-[#ba1c32] transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Popular Courses */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">
                Popular courses
              </h3>
              <ul className="space-y-4">
                {popularCourses.map((course) => (
                  <li key={course.name}>
                    <Link
                      href={course.href}
                      className="text-gray-400 hover:text-[#ba1c32] transition-colors"
                    >
                      {course.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Need Help Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">Need help?</h3>
              <div className="space-y-2">
                <p className="text-gray-400">Call us directly?</p>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">
                    +1 234 567 8910
                  </span>
                  <span className="rounded-full bg-[#ba1c32] px-2 py-0.5 text-xs font-medium text-[#fff]">
                    FREE
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-gray-400">Need support?</p>
                <Link
                  href="mailto:help@domain.com"
                  className="text-white underline hover:text-[#ba1c32] transition-colors"
                >
                  help@domain.com
                </Link>
              </div>
            </div>

            {/* Newsletter Section */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-white">
                Subscribe our newsletter
              </h3>
              <div className="relative w-full">
                <Input
                  type="email"
                  placeholder="Enter your email..."
                  className="w-full bg-transparent text-white placeholder:text-gray-400 border-gray-700 focus:border-[#ba1c32] pr-12"
                />
                <Button
                  size="icon"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#fff] text-[#2A3342] hover:text-[#fff] hover:bg-[#ba1c32]/90 h-7 w-7"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <Handshake className="h-5 w-5" />
                <span>Protecting your privacy</span>
              </div>
            </div>
          </div>

          {/* Bottom Navigation */}
          <div className="mt-16 border-t border-gray-700 py-8">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <nav>
                <ul className="flex flex-wrap justify-center gap-6">
                  {navLinks.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-[#ba1c32] transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              <p className="text-gray-400 text-center md:text-left">
                © 2025 – Bansuri Vidya Mandir™  . All Rights Reserved. Designed with ❤ by {" "}
                <a
                  href="https://desirediv.com"
                  target="_blank"
                  className="text-white hover:text-[#ba1c32] transition-colors"
                >
                  Desire Div
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Footer;
