"use client";

import { Suspense } from "react";
import { GoogleAuthProvider } from "./GoogleAuthProvider";
import { AuthProvider } from "./AuthContext";
import { Toaster } from "@/components/ui/sonner";
import TrackingScripts from "@/components/TrackingScripts";
import Loader from "@/components/Loader";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div><Loader /></div>}>
      <GoogleAuthProvider>
        <Suspense fallback={<div><Loader /></div>}>
          <AuthProvider>
            {children}
            <TrackingScripts />
            <Toaster />
          </AuthProvider>
        </Suspense>
      </GoogleAuthProvider>
    </Suspense>
  );
}
