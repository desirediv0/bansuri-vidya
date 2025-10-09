"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/helper/AuthContext";

export default function UserProfileRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { checkAuth } = useAuth();

  useEffect(() => {
    (async () => {
      const ok = await checkAuth();
      if (!ok) {
        router.push("/auth");
        return;
      }
      const tab = searchParams.get("tab");
      // Map legacy tab params to new routes
      if (tab === "certificates") router.replace("/user-profile/certificates");
      else if (tab === "my-courses" || tab === "enrolled-courses") router.replace("/user-profile/my-courses");
      else router.replace("/user-profile/dashboard");
    })();
  }, [router, searchParams, checkAuth]);

  return null;
}
