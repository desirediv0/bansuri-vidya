"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { CheckCircle2, Loader2, RefreshCw, Mail } from "lucide-react";
import axios, { AxiosError } from "axios";
import Cookies from "js-cookie";

function VerifyEmailContent() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [email, setEmail] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"success" | "error" | null>(null);
  const [showEmailInput, setShowEmailInput] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    } else {
      setShowEmailInput(true);
    }
  }, [searchParams]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const verifyOTP = async () => {
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      toast.error("Please enter complete 6-digit OTP");
      return;
    }

    if (!email) {
      toast.error("Email is required for verification");
      return;
    }

    try {
      setIsVerifying(true);

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user/verify-email`,
        { otp: otpString, email },
        { withCredentials: true }
      );

      if (response.data.success) {
        const { accessToken } = response.data.data;
        Cookies.set("accessToken", accessToken, { expires: 7 });

        setVerificationStatus("success");
        toast.success("Email verified and logged in successfully!");

        const userRole = response.data.data.user.role;
        const redirectPath = userRole === "ADMIN" ? "/dashboard" : "/user-profile/dashboard";

        setTimeout(() => {
          router.push(redirectPath);
        }, 1300);
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      setVerificationStatus("error");
      toast.error(
        axiosError.response?.data?.message ||
        "Invalid OTP or verification failed"
      );
      // Reset OTP on error
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const resendOTP = async () => {
    if (!email) {
      toast.error("Email is required to resend OTP");
      return;
    }

    try {
      setIsResending(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/user/resend-otp`,
        { email }
      );
      toast.success("OTP resent successfully! Check your email.");
      setOtp(["", "", "", "", "", ""]);
      document.getElementById("otp-0")?.focus();
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>;
      toast.error(
        axiosError.response?.data?.message || "Failed to resend OTP"
      );
    } finally {
      setIsResending(false);
    }
  };




  if (verificationStatus === "success") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
        <Card className="w-full max-w-md border border-red-100 shadow-xl">
          <CardContent className="flex flex-col items-center justify-center space-y-6 pt-8 pb-8">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <p className="text-green-600 font-medium text-lg text-center">
              Your email has been verified successfully!
            </p>
            <p className="text-gray-500 text-center">
              Redirecting you to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
      <Card className="w-full max-w-md border border-red-100 shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardHeader className="space-y-2 text-center pb-6 border-b border-red-100">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-gray-600 text-base">
            We've sent a 6-digit OTP to your email address. Please enter it below to complete verification.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {showEmailInput && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Email Address
              </label>
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {email && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Enter 6-Digit OTP
                </label>
                <div className="flex space-x-2 justify-center">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      className="w-12 h-12 text-center text-xl font-bold"
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  onClick={verifyOTP}
                  disabled={isVerifying || otp.join("").length !== 6}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-3 rounded-lg transition-all duration-200 hover:shadow-lg"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying OTP...
                    </>
                  ) : (
                    "Verify OTP"
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={resendOTP}
                  disabled={isResending}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Resend OTP
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center">
                Didn't receive the OTP? Check your spam folder or click resend.
              </p>
            </>
          )}

          <div className="text-center">
            <Button
              variant="ghost"
              onClick={() => router.push("/auth")}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              ← Back to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white">
        <Loader2 className="h-12 w-12 animate-spin text-red-600" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}