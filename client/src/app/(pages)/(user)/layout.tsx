"use client";

import React from "react";
import Header from "../_components/Header/Header";
import Footer from "../_components/Footer";
import { usePathname } from "next/navigation";
import WhatsappFixdes from "../_components/WhatsappFixdes";

const Layout = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  const hideHeaderPaths = ["/auth"];

  const shouldShowHeader = !hideHeaderPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  const hideFooterPaths = ["/auth"];

  const shouldShowFooter = !hideFooterPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  ); return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">
        {shouldShowHeader && <Header />}
        <div className="pb-10 md:pb-20 lg:pb-0">{children}</div>
        {shouldShowFooter && <Footer />}
        <WhatsappFixdes />
      </div>
    </div>
  );
};

export default Layout;
