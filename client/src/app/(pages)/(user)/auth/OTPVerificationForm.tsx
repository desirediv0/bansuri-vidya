"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";

interface OTPVerificationFormProps {
    email: string;
    courseSlug?: string;
    liveClassId?: string;
    redirect?: string;
    handleLoading: (loading: boolean) => void;
    onBack?: () => void;
}

export default function OTPVerificationForm({
    email,
    courseSlug,
    liveClassId,
    redirect,
    handleLoading,
    onBack,
}: OTPVerificationFormProps) {
    const [otp, setOTP] = useState("");
    const [resendLoading, setResendLoading] = useState(false);
    const router = useRouter();

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!otp || otp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }

        handleLoading(true);
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/user/verify-email`,
                { otp, email },
                { withCredentials: true }
            );

            if (response.data.success) {
                // Set the access token cookie
                if (response.data.data.accessToken) {
                    Cookies.set("accessToken", response.data.data.accessToken, {
                        expires: 7, // 7 days
                        secure: true,
                        sameSite: "strict",
                    });
                }

                toast.success("Email verified and logged in successfully!");

                // Redirect logic
                if (redirect) {
                    router.push(redirect);
                } else if (courseSlug) {
                    router.push(`/courses/${courseSlug}`);
                } else if (liveClassId) {
                    router.push(`/live-class/${liveClassId}`);
                } else {
                    router.push("/user-profile");
                }
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "OTP verification failed";
            toast.error(errorMessage);
        } finally {
            handleLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setResendLoading(true);
        try {
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/user/resend-otp`,
                { email },
                { withCredentials: true }
            );
            toast.success("OTP resent successfully!");
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || "Failed to resend OTP";
            toast.error(errorMessage);
        } finally {
            setResendLoading(false);
        }
    };

    return (
        <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="otp">6-Digit OTP</Label>
                <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => {
                        // Only allow numbers and limit to 6 digits
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setOTP(value);
                    }}
                    maxLength={6}
                    className="text-center text-xl font-mono tracking-wider"
                    autoComplete="one-time-code"
                />
            </div>

            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700">
                Verify & Login
            </Button>

            <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                    Didn't receive the OTP?
                </p>
                <Button
                    type="button"
                    variant="link"
                    onClick={handleResendOTP}
                    disabled={resendLoading}
                    className="text-red-600 hover:text-red-700 p-0 h-auto font-medium"
                >
                    {resendLoading ? "Resending..." : "Resend OTP"}
                </Button>

                {onBack && (
                    <div className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onBack}
                            className="w-full"
                        >
                            Back to Registration
                        </Button>
                    </div>
                )}
            </div>
        </form>
    );
}