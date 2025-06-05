"use client";

declare global {
  interface Window {
    Razorpay: any;
  }
}

import { useState, useEffect } from "react";
import axios from "axios";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// UI Components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  Calendar,
  Clock,
  ExternalLink,
  RefreshCw,
  User,
  VideoIcon,
  Loader2,
  CreditCard,
  Video,
  CheckCircle2,
} from "lucide-react";

// Types
interface ZoomSession {
  id: string;
  title: string;
  teacherName: string;
  startTime: string;
  endTime: string;
  formattedDate: string;
  formattedTime: string;
  thumbnailUrl: string | null;
  duration: number;
  zoomLink: string;
  hasModules: boolean;
  moduleName?: string;
  registrationFee: number;
  courseFee: number;
  currentRange?: string;
  currentOrientation?: string;
  courseFeeEnabled: boolean;
  isOnline?: boolean;
}

interface Subscription {
  id: string;
  startDate: string;
  endDate: string;
  status:
  | "ACTIVE"
  | "EXPIRED"
  | "CANCELLED"
  | "PENDING_APPROVAL"
  | "REGISTERED"
  | "REJECTED";
  isApproved: boolean;
  isRegistered: boolean;
  hasAccessToLinks: boolean;
  canJoinClass?: boolean;
  isOnClassroom?: boolean;
  lastPaymentDate: string;
  nextPaymentDate: string;
  zoomSession: ZoomSession;
  moduleId?: string;
  registrationPaymentId: string | null;
  apiFlags?: {
    canRegister?: boolean;
    showDemo?: boolean;
    showCourseFee?: boolean;
    showWaiting?: boolean;
    showClosed?: boolean;
    registrationEnabled?: boolean;
    isOnline?: boolean;
  };
}

const MyLiveClasses = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedSubscription, setSelectedSubscription] =
    useState<Subscription | null>(null);
  const [refreshing, setRefreshing] = useState(false); const [coursePaymentInProgress, setCoursePaymentInProgress] = useState<
    string | null
  >(null);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [demoAccessLoading, setDemoAccessLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => {
        setRazorpayLoaded(true);
      };
      script.onerror = () => {
        console.error("Failed to load Razorpay script");
        toast.error("Payment system failed to load. Please refresh the page.");
      };
      document.body.appendChild(script);
    };

    loadRazorpay();

    // Cleanup function
    return () => {
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/my-subscriptions`,
        { withCredentials: true }
      );

      const subscriptionsData = response.data.data;

      // For each subscription, get real-time status flags from check-subscription API
      const enrichedSubscriptions = await Promise.all(
        subscriptionsData.map(async (subscription: Subscription) => {
          try {
            const checkResponse = await axios.get(
              `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${subscription.zoomSession.id}${subscription.moduleId ? `?moduleId=${subscription.moduleId}` : ''
              }`,
              { withCredentials: true }
            );

            const apiFlags = checkResponse.data.data || {};

            return {
              ...subscription,
              // Update with real-time status
              isOnClassroom: apiFlags.isOnClassroom || false,
              canJoinClass: apiFlags.canJoinClass || false,
              hasAccessToLinks: apiFlags.hasAccessToLinks || subscription.hasAccessToLinks,
              isApproved: apiFlags.isApproved !== undefined ? apiFlags.isApproved : subscription.isApproved,              // Store API flags for consistent button logic
              apiFlags: {
                canRegister: apiFlags.canRegister,
                showDemo: apiFlags.showDemo,
                showCourseFee: apiFlags.showCourseFee,
                showWaiting: apiFlags.showWaiting,
                showClosed: apiFlags.showClosed,
                registrationEnabled: apiFlags.registrationEnabled,
                isOnline: apiFlags.isOnline,  // ADD: Include isOnline status
              }
            };
          } catch (error) {
            console.error(`Error fetching real-time status for subscription ${subscription.id}:`, error);
            // Return original subscription if API call fails
            return {
              ...subscription,
              apiFlags: {}
            };
          }
        })
      );

      setSubscriptions(enrichedSubscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to load your live classes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubscriptions();
    setRefreshing(false);
  };

  const handleCancelIntent = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setCancelDialogOpen(true);
  };

  const handleCancelConfirm = async () => {
    if (!selectedSubscription) return;

    try {
      setLoading(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/cancel-subscription/${selectedSubscription?.id}`,
        {},
        { withCredentials: true }
      );

      fetchSubscriptions();
      toast.success("Your subscription has been cancelled successfully.");
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription. Please try again.");
    } finally {
      setCancelDialogOpen(false);
    }
  };

  const handleJoinClass = async (id?: string, moduleId?: string) => {
    try {
      setIsJoining(true);
      let queryParams = moduleId ? `?moduleId=${moduleId}` : "";

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${id}${queryParams}`,
        { withCredentials: true }
      );

      if (
        response.data.data.hasAccessToLinks &&
        response.data.data.meetingDetails?.link
      ) {
        window.open(response.data.data.meetingDetails.link, "_blank");
      } else {
        toast.error(
          "Unable to join class. Please check your registration status."
        );
      }
    } catch (error) {
      console.error("Error joining class:", error);
      toast.error("Failed to join the class. Please try again.");
    } finally {
      setIsJoining(false);
    }
  };

  const handlePayCourseAccess = async (subscription: Subscription) => {
    try {
      setCoursePaymentInProgress(subscription.id);

      // Check if course fee payment is already done
      if (subscription.hasAccessToLinks) {
        toast.info("You have already paid the course fee");
        return;
      }

      // Ensure Razorpay is loaded
      if (!razorpayLoaded || typeof window.Razorpay === "undefined") {
        toast.error(
          "Payment gateway not loaded. Please refresh the page and try again."
        );
        return;
      }


      // Create course access payment
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/pay-course-access`,
        {
          zoomLiveClassId: subscription.zoomSession.id,
        },
        { withCredentials: true }
      );

      // If user already has access
      if (response.data.data.alreadyHasAccess) {
        toast.success("You already have access to this class");
        fetchSubscriptions();
        return;
      }

      // Get Razorpay Key from server
      const keyResponse = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/getpublickey`
      );
      const key = keyResponse.data.key;

      // Initialize Razorpay
      const options = {
        key: key,
        amount: response.data.data.order.amount,
        currency: response.data.data.order.currency,
        name: "Bansuri Vidya Mandir | Indian Classical Music Institute",
        description: `Course Access for: ${subscription.zoomSession.title}`,
        order_id: response.data.data.order.id,
        image: "/logo-black.png",
        handler: async function (response: any) {
          try {
            // Verify payment
            const verifyResponse = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/verify-course-access`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                zoomLiveClassId: subscription.zoomSession.id,
              },
              { withCredentials: true }
            );

            toast.success("Course access payment successful!");
            fetchSubscriptions(); // Refresh the list
          } catch (error) {
            console.error("Payment verification failed:", error);
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#af1d33",
        },
      };

      // Create and open Razorpay
      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response: any) {
        console.error("Payment failed:", response.error);
        toast.error(`Payment failed: ${response.error.description}`);
      });
      razorpay.open();
    } catch (error: any) {
      console.error("Error initiating course access payment:", error);
      toast.error(
        error.response?.data?.message ||
        "Failed to initiate payment. Please try again."
      );
    } finally {
      setCoursePaymentInProgress(null);
    }
  }; const handleReRegister = async (subscription: Subscription) => {
    try {
      router.push(`/live-classes/${subscription.zoomSession.id}?reregister=true`);
    } catch (error) {
      console.error("Error redirecting to re-registration:", error);
      toast.error("Failed to redirect to registration page.");
    }
  };
  const handleDemoAccess = async (subscription: Subscription) => {
    try {
      setDemoAccessLoading(subscription.id);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/demo-access/${subscription.zoomSession.id}`,
        { withCredentials: true }
      );

      if (response.data.data) {
        const demoData = response.data.data;        // Check if demo is configured and available
        if (demoData.isDemoConfigured && demoData.demoLink) {
          // Show demo access details in toast and open demo link
          toast.success(`Live class access granted! Meeting ID: ${demoData.demoMeetingId}`);

          // Open demo link in new tab
          window.open(demoData.demoLink, '_blank');

          // Also redirect to class page with demo flag for additional demo content
          router.push(`/live-classes/${subscription.zoomSession.id}?demo=true`);
        } else {
          toast.info("Live class content will be available soon for this class.");
        }
      }
    } catch (error: any) {
      console.error("Error accessing live class:", error);

      if (error.response?.status === 403) {
        toast.error("You need to register for this class to access live class content.");
      } else {
        toast.error("Failed to access live class content. Please try again.");
      }
    } finally {
      setDemoAccessLoading(null);
    }
  };

  const isUpcoming = (startTime: string) => {
    return new Date(startTime) > new Date();
  }; const getStatusBadge = (subscription: any) => {
    // Use the same logic as button state for consistency with API flags
    const apiFlags = subscription.apiFlags || {};
    const showDemo = apiFlags.showDemo || false;
    const showCourseFee = apiFlags.showCourseFee || false;
    const showWaiting = apiFlags.showWaiting || false;
    const showClosed = apiFlags.showClosed || false;

    if (subscription.status === "CANCELLED") {
      return {
        text: "Cancelled",
        className: "bg-gray-500 text-white",
      };
    }

    if (subscription.status === "REJECTED") {
      return {
        text: "Rejected",
        className: "bg-red-500 text-white",
      };
    }

    // If can join class (highest priority)
    if (subscription.canJoinClass) {
      return {
        text: "🔴 LIVE - Ready to Join",
        className: "bg-green-500 text-white animate-pulse",
      };
    }

    // If has access but waiting for class to start
    if (subscription.hasAccessToLinks && !subscription.isOnClassroom) {
      return {
        text: "Full Access",
        className: "bg-green-500 text-white",
      };
    }

    // If API says show course fee
    if (showCourseFee) {
      return {
        text: "Approved - Pay Course Fee",
        className: "bg-blue-500 text-white",
      };
    }

    // If API says show waiting
    if (showWaiting) {
      return {
        text: "Waiting for Class",
        className: "bg-gray-500 text-white",
      };
    }    // If registered and demo available
    if (subscription.isRegistered && showDemo) {
      return {
        text: "Live Class Available",
        className: "bg-purple-500 text-white",
      };
    }    // If registered but waiting for approval
    if (subscription.isRegistered && !subscription.isApproved) {
      return {
        text: "Processing",
        className: "bg-yellow-500 text-white",
      };
    }

    // If registration is closed
    if (showClosed) {
      return {
        text: "Registration Closed",
        className: "bg-gray-500 text-white",
      };
    }

    // Fallback to old logic for edge cases
    if (subscription.hasAccessToLinks) {
      return {
        text: "Full Access",
        className: "bg-green-500 text-white",
      };
    }

    if (subscription.isRegistered && subscription.isApproved && subscription.zoomSession.courseFeeEnabled) {
      return {
        text: "Approved - Pay Course Fee",
        className: "bg-blue-500 text-white",
      };
    }

    if (subscription.isRegistered && subscription.isApproved && !subscription.zoomSession.courseFeeEnabled) {
      return {
        text: "Ready to Join",
        className: "bg-green-500 text-white",
      };
    }

    return {
      text: "Unknown Status",
      className: "bg-gray-400 text-white",
    };
  };

  const getStatusText = (
    status: string,
    isApproved: boolean,
    isRegistered: boolean,
    hasAccessToLinks: boolean
  ) => {
    if (status === "ACTIVE" && isApproved && hasAccessToLinks)
      return "Full Access";
    if (status === "ACTIVE" && isApproved) return "Approved (Need Course Fee)";
    if (status === "PENDING_APPROVAL") return "Pending Approval";
    if (status === "REJECTED") return "Rejected";
    if (status === "CANCELLED") return "Cancelled";
    return status;
  };  // Function to determine button state based on subscription status
  const getButtonState = (subscription: Subscription) => {
    // Use API response flags if available, otherwise fall back to subscription data
    const apiFlags = subscription.apiFlags || {};
    const showDemo = apiFlags.showDemo || false;
    const canRegister = apiFlags.canRegister !== false; // Default to true if not specified
    const showCourseFee = apiFlags.showCourseFee || false;
    const showWaiting = apiFlags.showWaiting || false;
    const showClosed = apiFlags.showClosed || false; console.log("Button state debug for subscription:", {
      id: subscription.id,
      title: subscription.zoomSession.title,
      apiFlags,
      showDemo,
      showCourseFee,
      showWaiting,
      canJoinClass: subscription.canJoinClass,
      isOnClassroom: subscription.isOnClassroom,
      hasAccessToLinks: subscription.hasAccessToLinks,
      isApproved: subscription.isApproved,
      status: subscription.status
    }); // Debug log

    // HIGHEST PRIORITY: If user can join class (has access AND admin has started the class)
    if (subscription.canJoinClass) {
      return {
        type: "join",
        text: isJoining ? "Joining..." : "Join Live Class",
        color: "bg-green-600 hover:bg-green-700 text-white",
        disabled: isJoining,
        action: () => handleJoinClass(subscription.zoomSession.id, subscription.moduleId),
        showDemo: false // Hide demo when can join
      };
    }    // SECOND PRIORITY: If user is registered, check isOnline status immediately (no approval needed)
    if (showDemo && subscription.isRegistered && subscription.status !== "REJECTED") {
      const isOnline = subscription.zoomSession.isOnline || subscription.apiFlags?.isOnline || subscription.isOnClassroom || false;

      // Debug logging
      console.log("MyLiveClasses demo button debug:", {
        showDemo,
        isRegistered: subscription.isRegistered,
        status: subscription.status,
        isOnline,
        "zoomSession.isOnline": subscription.zoomSession.isOnline,
        "apiFlags.isOnline": subscription.apiFlags?.isOnline,
        "isOnClassroom": subscription.isOnClassroom
      });

      return {
        type: "demo",
        text: "Join Live Class",
        color: isOnline ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-400 cursor-not-allowed text-gray-600",
        disabled: !isOnline,
        action: isOnline ? () => handleDemoAccess(subscription) : null,
        showDemo: true,
        message: isOnline ? undefined : "This button will become active once your class session begins."
      };
    }

    // If user has access but admin hasn't started the class yet
    if (subscription.hasAccessToLinks && !subscription.isOnClassroom) {
      return {
        type: "waiting-live",
        text: "Waiting for Class to Start",
        color: "bg-gray-500 cursor-not-allowed text-white",
        disabled: true,
        action: null,
        showDemo: false // Hide demo when waiting for live class
      };
    }

    // If API says show course fee button
    if (showCourseFee) {
      return {
        type: "pay",
        text: coursePaymentInProgress === subscription.id ? "Processing..." : "Pay Course Fee",
        color: "bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white",
        disabled: coursePaymentInProgress === subscription.id,
        action: () => handlePayCourseAccess(subscription),
        showDemo: false // Hide demo when course fee is pending
      };
    }

    // If API says show waiting message
    if (showWaiting) {
      return {
        type: "waiting-live",
        text: "Waiting for Class to Start",
        color: "bg-gray-500 cursor-not-allowed text-white",
        disabled: true,
        action: null,
        showDemo: false
      };
    }

    // If subscription is cancelled
    if (subscription.status === "CANCELLED") {
      return {
        type: "cancelled",
        text: "Re-Register",
        color: "bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white",
        disabled: false,
        action: () => handleReRegister(subscription),
        showDemo: false
      };
    }

    // If subscription is rejected
    if (subscription.status === "REJECTED") {
      return {
        type: "rejected",
        text: "Re-Register",
        color: "bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white",
        disabled: false,
        action: () => handleReRegister(subscription),
        showDemo: false
      };
    }    // If user is registered but waiting for approval (only if demo is not available)
    if (subscription.isRegistered && !subscription.isApproved && !showDemo) {
      return {
        type: "waiting",
        text: "Please wait",
        color: "bg-gray-500 cursor-not-allowed text-white",
        disabled: true,
        action: null,
        showDemo: false
      };
    }

    // If API says show closed message (registration disabled and user not registered)
    if (showClosed) {
      return {
        type: "disabled",
        text: "Registration Closed",
        color: "bg-gray-500 cursor-not-allowed text-white",
        disabled: true,
        action: null,
        showDemo: false
      };
    }

    // If user can register (new users when registration is open)
    if (canRegister && !subscription.isRegistered) {
      return {
        type: "register",
        text: "Register for Class",
        color: "bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white",
        disabled: false,
        action: () => handleReRegister(subscription),
        showDemo: false
      };
    }

    // Default case - subscription exists but something is wrong
    return {
      type: "error",
      text: "Contact Support",
      color: "bg-gray-400 cursor-not-allowed text-gray-600",
      disabled: true,
      action: null,
      showDemo: false
    };
  };

  const defaultThumbnail = "/images/default-class-thumbnail.jpg";

  // Filter upcoming classes
  const upcomingClasses = subscriptions.filter((sub) =>
    isUpcoming(sub.zoomSession.startTime)
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <VideoIcon className="h-5 w-5 text-red-600" />
            My Live Classes
          </h2>
          <Skeleton className="h-9 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <VideoIcon className="h-6 w-6 text-[#af1d33]" />
          My Live Classes
        </h2>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 hover:bg-gray-100 transition-colors"
        >
          <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          Refresh
        </Button>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="col-span-full p-8 text-center border-dashed border-2 border-red-200 bg-red-50/50">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Live Classes Yet
            </h3>
            <p className="text-gray-600 mb-6">
              You haven't subscribed to any live classes. Join a class to start
              learning from our expert instructors.
            </p>
            <Button
              className="bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={() => router.push("/live-classes")}
            >
              Browse Live Classes
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {subscriptions.map((subscription) => (
            <Card
              key={subscription.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="relative h-48 w-full">
                <Image
                  src={
                    subscription.zoomSession.thumbnailUrl || defaultThumbnail
                  }
                  alt={subscription.zoomSession.title}
                  fill
                  style={{ objectFit: "cover" }}
                  className="transition-transform duration-300 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />                <div className="absolute top-4 right-4 flex flex-col items-end space-y-2">
                  {subscription.isOnClassroom && (
                    <Badge className="bg-red-600 text-white px-2 py-1 text-xs font-medium animate-pulse shadow-lg">
                      🔴 LIVE
                    </Badge>
                  )}
                  {(() => {
                    const status = getStatusBadge(subscription);
                    return (
                      <Badge
                        className={`px-3 py-1.5 text-sm font-medium shadow-sm ${status.className}`}
                      >
                        {status.text}
                      </Badge>
                    );
                  })()}
                </div>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg line-clamp-2">
                  {subscription.zoomSession.title}
                  {subscription.zoomSession.moduleName && (
                    <span className="text-sm text-gray-600 block mt-1">
                      Module: {subscription.zoomSession.moduleName}
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <User className="mr-2 h-4 w-4 text-[#af1d33]" />
                  <span>{subscription.zoomSession.teacherName}</span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="mr-2 h-4 w-4 text-[#af1d33]" />
                  <span>{subscription.zoomSession.formattedDate}</span>
                </div>                {/* Status Messages */}
                {subscription.isRegistered &&
                  subscription.isApproved &&
                  subscription.zoomSession.courseFeeEnabled &&
                  !subscription.hasAccessToLinks && (
                    <div className="text-sm font-medium flex items-center bg-blue-50 p-2 rounded-lg">
                      <CreditCard className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-blue-800">
                        Admin approved! Pay course fee to access class links
                      </span>
                    </div>
                  )}
                {subscription.isRegistered &&
                  subscription.isApproved &&
                  !subscription.zoomSession.courseFeeEnabled &&
                  subscription.hasAccessToLinks &&
                  !subscription.isOnClassroom && (
                    <div className="text-sm font-medium flex items-center bg-green-50 p-2 rounded-lg">
                      <CheckCircle2 className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-green-800">
                        Approved! Waiting for admin to start the live class
                      </span>
                    </div>
                  )}
                {subscription.status === "REJECTED" && (
                  <div className="text-sm font-medium flex items-center bg-red-50 p-2 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-red-800">
                      Registration was rejected. You can re-register for this class.
                    </span>
                  </div>
                )}
                {subscription.status === "CANCELLED" && (
                  <div className="text-sm font-medium flex items-center bg-gray-50 p-2 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-gray-600 mr-2" />
                    <span className="text-gray-800">
                      Subscription was cancelled. You can re-register if needed.
                    </span>
                  </div>
                )}
                {subscription.zoomSession.currentRange && (
                  <div className="flex items-center text-sm bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-700">Range:</span>
                    <span className="ml-2 text-gray-600">
                      {subscription.zoomSession.currentRange}
                    </span>
                  </div>
                )}
                {subscription.zoomSession.currentOrientation && (
                  <div className="flex items-center text-sm bg-gray-50 p-2 rounded-lg">
                    <span className="font-medium text-gray-700">
                      Orientation:
                    </span>
                    <span className="ml-2 text-gray-600">
                      {subscription.zoomSession.currentOrientation}
                    </span>
                  </div>
                )}
              </CardContent>              <CardFooter className="flex flex-col gap-3 pt-4 pb-6">
                {(() => {
                  const buttonState = getButtonState(subscription);

                  return (
                    <div className="w-full space-y-3">                      {/* Main Action Button Row */}
                      <div className="flex gap-2 w-full">
                        <Button
                          onClick={buttonState.action || undefined}
                          disabled={buttonState.disabled}
                          className={`flex-1 py-3 transition-all duration-300 ${buttonState.color}`}
                        >
                          {buttonState.type === "join" && isJoining ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : buttonState.type === "join" || buttonState.type === "demo" ? (
                            <Video className="h-4 w-4 mr-2" />
                          ) : buttonState.type === "pay" ? (
                            <CreditCard className="h-4 w-4 mr-2" />
                          ) : null}
                          {buttonState.text}
                        </Button>

                        {/* Cancel button - proper size to prevent hiding */}
                        {subscription.status !== "CANCELLED" && subscription.status !== "REJECTED" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-4 py-3 text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors flex-shrink-0"
                            onClick={() => handleCancelIntent(subscription)}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>

                      {/* Offline Message for Demo Button */}
                      {buttonState.message && (
                        <div className="text-sm text-gray-600 text-center px-2 py-1 bg-gray-50 rounded">
                          {buttonState.message}
                        </div>
                      )}

                      {/* View Class Details Button */}
                      <Button
                        variant="ghost"
                        onClick={() => router.push(`/live-classes/${subscription.zoomSession.id}`)}
                        className="w-full py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-all duration-300"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View Class Details
                      </Button>
                    </div>
                  );
                })()}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="bg-white rounded-xl p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">
              Cancel Subscription
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 mt-2">
              Are you sure you want to cancel your subscription to this class?
              You will no longer have access to join it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogCancel className="hover:bg-gray-100 transition-colors">
              Keep Subscription
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelConfirm}
              className="bg-red-600 hover:bg-red-700 text-white transition-colors"
            >
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>        </AlertDialogContent>      </AlertDialog>
    </section>
  );
};

export default MyLiveClasses;
