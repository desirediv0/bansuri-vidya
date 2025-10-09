"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/helper/AuthContext";
import UserCertificates from "../UserCertificates";

export default function CertificatesPage() {
    const { checkAuth } = useAuth();
    const router = useRouter();
    const [ready, setReady] = useState(false);

    useEffect(() => {
        (async () => {
            const ok = await checkAuth();
            if (!ok) router.push("/auth");
            else setReady(true);
        })();
    }, [checkAuth, router]);

    if (!ready) return null;
    return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 font-plus-jakarta-sans mt-20 mb-10">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
                <UserCertificates />
            </div>
        </div>
    );
}
