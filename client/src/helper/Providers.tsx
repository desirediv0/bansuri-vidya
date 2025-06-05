"use client";

import { Suspense } from "react";
import { GoogleAuthProvider } from "./GoogleAuthProvider";
import { AuthProvider } from "./AuthContext";
import { Toaster } from "@/components/ui/sonner";
import TrackingScripts from "@/components/TrackingScripts";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GoogleAuthProvider>
        <Suspense fallback={<div>Loading auth...</div>}>
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
