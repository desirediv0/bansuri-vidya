"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Info,
  Share2,
  Loader2,
  CheckCircle2,
  Video,
  CreditCard,
  Book,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/helper/AuthContext";
import PurchaseDialog from "../components/PurchaseDialog";
import RegistrationDialog from "../components/RegistrationDialog";
import CourseAccessDialog from "../components/CourseAccessDialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import ReviewSection from "../components/ReviewSection";

export default function ClassDetails() {
  const params = useParams();

  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const [classData, setClassData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [showRegistrationDialog, setShowRegistrationDialog] = useState(false);
  const [showCourseAccessDialog, setShowCourseAccessDialog] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasAccessToLinks, setHasAccessToLinks] = useState(false);
  const [canJoinClass, setCanJoinClass] = useState(false);
  const [isOnClassroom, setIsOnClassroom] = useState(false);
  const [apiChecksCompleted, setApiChecksCompleted] = useState({
    fetchClassDetails: false,
    checkSubscription: false,
    checkPaymentStatus: false,
  });

  useEffect(() => {
    if (id) {
      setApiChecksCompleted({
        fetchClassDetails: false,
        checkSubscription: false,
        checkPaymentStatus: false,
      });

      fetchClassDetails();

      if (isAuthenticated) {
        checkSubscriptionStatus();
        checkPaymentStatus();
      }
    } else {
      toast({
        title: "Error",
        description: "No class ID found. Redirecting to classes list.",
        variant: "destructive",
      });
      setTimeout(() => router.push("/live-classes"), 3000);
    }
  }, [id, isAuthenticated]);

  const determineUserStatus = () => {
    const userIsRegistered =
      isRegistered || (classData && classData.isRegistered);

    const userHasAccess =
      hasAccessToLinks || (classData && classData.hasAccessToLinks);

    const userIsApproved = classData && classData.isApproved;

    return { userIsRegistered, userHasAccess, userIsApproved };
  };  // Function to determine button state based on registration status
  const getButtonState = () => {
    const { userIsRegistered, userHasAccess, userIsApproved } = determineUserStatus();

    // Use API response flags if available, otherwise fall back to classData
    const apiFlags = classData?.apiFlags || {};
    const showDemo = apiFlags.showDemo || false;
    const canRegister = apiFlags.canRegister !== false; // Default to true if not specified
    const showCourseFee = apiFlags.showCourseFee || false;
    const showWaiting = apiFlags.showWaiting || false;
    const showClosed = apiFlags.showClosed || false;    // HIGHEST PRIORITY: If API says show course fee button (admin approved but course fee not paid)
    if (showCourseFee) {
      return {
        type: "pay",
        text: "Pay Course Fee",
        color: "bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white",
        disabled: false,
        action: () => setShowCourseAccessDialog(true)
      };
    }

    // SECOND PRIORITY: If user can join class (has access AND admin has started the class)
    if (canJoinClass) {
      return {
        type: "join",
        text: isJoining ? "Joining..." : "Join Live Class",
        color: "bg-green-600 hover:bg-green-700 text-white",
        disabled: isJoining,
        action: () => handleJoinClass()
      };
    }// SECOND PRIORITY: If user is registered, check isOnline status immediately (no approval needed for demo)
    if (userIsRegistered && showDemo) {
      const isOnline = classData?.apiFlags?.isOnline || classData?.isOnClassroom || false;

      return {
        type: "demo",
        text: "Join Live Class",
        color: isOnline ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-400 cursor-not-allowed text-gray-600",
        disabled: !isOnline,
        action: isOnline ? () => handleDemoAccess() : null,
        message: isOnline ? undefined : "This button will become active once your class session begins."
      };
    }

    // If user has access but admin hasn't started the class yet
    if (userHasAccess && !isOnClassroom) {
      return {
        type: "waiting-live",
        text: "Waiting for Class to Start",
        color: "bg-gray-500 cursor-not-allowed text-white",
        disabled: true,
        action: null
      };
    }    // If API says show waiting message (for non-registered users or when demo not available)
    if (showWaiting) {
      return {
        type: "waiting-live",
        text: "Waiting for Class to Start",
        color: "bg-gray-500 cursor-not-allowed text-white",
        disabled: true,
        action: null
      };
    }

    // If user is registered but waiting for approval (only if demo is not available)
    if (userIsRegistered && !userIsApproved) {
      return {
        type: "waiting",
        text: "Please wait",
        color: "bg-gray-500 cursor-not-allowed text-white",
        disabled: true,
        action: null
      };
    }    // Check registration status for button display
    const registrationOpen = classData?.registrationEnabled !== false;

    // If user can register (new users when registration is open)
    if (canRegister && registrationOpen) {
      return {
        type: "register",
        text: "Register for Class",
        color: "bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white",
        disabled: false,
        action: () => {
          // Check if user is authenticated before showing registration dialog
          if (!isAuthenticated) {
            // Redirect to auth page with live class ID and redirect URL
            const currentUrl = window.location.pathname;
            const authUrl = `/auth?live-class-id=${id}&redirect=${encodeURIComponent(currentUrl)}`;
            router.push(authUrl);
            return;
          }
          setShowRegistrationDialog(true);
        }
      };
    }

    // If registration is closed, show disabled button to all users (both registered and non-registered)
    if (!registrationOpen || showClosed) {
      return {
        type: "disabled",
        text: "Registration Closed",
        color: "bg-gray-500 cursor-not-allowed text-white",
        disabled: true,
        action: null
      };
    }

    // Default fallback
    return {
      type: "disabled",
      text: "Not Available",
      color: "bg-gray-400 cursor-not-allowed text-gray-600",
      disabled: true,
      action: null
    };
  };

  const fetchClassDetails = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/class/${id}`
      );

      const classData = response.data.data;

      setClassData(classData);

      setApiChecksCompleted((prev) => ({ ...prev, fetchClassDetails: true }));
    } catch (error: any) {
      console.error("Error fetching class details:", error);
      const errorMessage =
        error.response?.status === 404
          ? "The class you're looking for doesn't exist or has been removed."
          : "Failed to load class details. Please try again.";

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (error.response?.status === 404) {
        setTimeout(() => router.push("/live-classes"), 3000);
      }
    } finally {
      setLoading(false);
    }
  }; const checkSubscriptionStatus = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${id}`,
        { withCredentials: true }
      );


      if (response.data.data) {
        const {
          isSubscribed,
          isRegistered,
          isApproved,
          hasAccessToLinks,
          meetingDetails,
          courseFeeEnabled,
          isOnClassroom,
          canJoinClass,
          // New API response flags
          canRegister,
          showDemo,
          showCourseFee,
          showWaiting,
          showClosed,
          registrationEnabled,
          isOnline,
        } = response.data.data;

        setIsRegistered(!!isRegistered);
        setHasAccessToLinks(!!hasAccessToLinks);
        setIsOnClassroom(!!isOnClassroom);
        setCanJoinClass(!!canJoinClass);

        setClassData((prev: any) => {
          if (!prev) return prev;

          return {
            ...prev,
            isSubscribed: !!isSubscribed,
            isRegistered: !!isRegistered,
            isApproved: !!isApproved,
            hasAccessToLinks: !!hasAccessToLinks,
            courseFeeEnabled: courseFeeEnabled,
            isOnClassroom: !!isOnClassroom,
            canJoinClass: !!canJoinClass,
            registrationEnabled: registrationEnabled,
            apiFlags: {
              canRegister,
              showDemo,
              showCourseFee,
              showWaiting,
              showClosed,
              registrationEnabled,
              isOnline,
            },
            ...(canJoinClass && meetingDetails
              ? {
                zoomLink: meetingDetails.link || prev.zoomLink,
                zoomMeetingId: meetingDetails.meetingId || prev.zoomMeetingId,
                zoomPassword: meetingDetails.password || prev.zoomPassword,
              }
              : {}),
          };
        });

        // Show appropriate toast messages based on status
        if (isRegistered && !hasAccessToLinks && courseFeeEnabled) {
          toast({
            title: "Course Fee Required",
            description: "Please pay the course fee to access class links.",
          });
        } else if (isRegistered && !courseFeeEnabled) {
          toast({
            title: "Registration Complete",
            description: "You can now access the class links.",
          });
        }
      }

      setApiChecksCompleted((prev) => ({ ...prev, checkSubscription: true }));
    } catch (error: any) {
      console.error("Error checking subscription status:", error);
      if (error.response?.status !== 404) {
        toast({
          title: "Note",
          description:
            "Could not check subscription status. This won't affect your ability to view the class.",
        });
      }
      setApiChecksCompleted((prev) => ({ ...prev, checkSubscription: true }));
    }
  };

  const checkPaymentStatus = async () => {
    try {

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${id}`,
        { withCredentials: true }
      );

      if (response.data.data) {
        const { isRegistered, hasAccessToLinks } = response.data.data;

        setIsRegistered(!!isRegistered);
        setHasAccessToLinks(!!hasAccessToLinks);

        setClassData((prev: any) => {
          if (!prev) return prev;

          return {
            ...prev,
            isRegistered: !!isRegistered,
            hasAccessToLinks: !!hasAccessToLinks,
          };
        });

        // Removed the redirect to user-profile to avoid interrupting the flow
        if (hasAccessToLinks) {
          toast({
            title: "Access Available",
            description: "You already have full access to this class.",
          });
        }
      }

      setApiChecksCompleted((prev) => ({ ...prev, checkPaymentStatus: true }));
    } catch (error: any) {
      console.error("Error checking payment status:", error);

      // Don't show a toast here to avoid duplicate error messages
      setApiChecksCompleted((prev) => ({ ...prev, checkPaymentStatus: true }));
    }
  };

  const handleJoinClass = async (id?: string, isModule: boolean = false) => {
    if (!isAuthenticated) {
      router.push(
        `/auth?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    try {
      setIsJoining(true);

      let queryParams = "";

      if (isModule && id) {
        queryParams = `?moduleId=${id}`;
      }

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/check-subscription/${classData.id}${queryParams}`,
        { withCredentials: true }
      );

      if (
        response.data.data.hasAccessToLinks &&
        response.data.data.meetingDetails?.link
      ) {
        window.open(response.data.data.meetingDetails.link, "_blank");
      } else {
        toast({
          title: "Access Denied",
          description: "You need to complete registration to join this class.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error checking subscription:", error);
      toast({
        title: "Error",
        description: "Failed to join the class. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };



  const handlePurchaseComplete = () => {
    setShowPurchaseDialog(false);
    fetchClassDetails();
    checkSubscriptionStatus();
    toast({
      title: "Success",
      description: "Class purchased successfully!",
    });
  };

  const handleRegistrationComplete = () => {
    setShowRegistrationDialog(false);
    fetchClassDetails();
    checkSubscriptionStatus();
    toast({
      title: "Success",
      description: "Registration completed successfully!",
    });
  };

  const handleCourseAccessComplete = () => {
    setShowCourseAccessDialog(false);
    fetchClassDetails();
    checkSubscriptionStatus();
    toast({
      title: "Success",
      description: "Course access payment completed successfully!",
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: classData?.title || "Bansuri Live Class",
        text: `Check out this live flute class: ${classData?.title}`,
        url: window.location.href,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const handleDemoAccess = async () => {
    if (!isAuthenticated) {
      router.push(
        `/auth?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/demo-access/${id}`,
        { withCredentials: true }
      );

      if (response.data.data) {
        const { demoLink, classTitle } = response.data.data;

        if (demoLink) {
          // Open demo link in new tab
          window.open(demoLink, "_blank"); toast({
            title: "Live Class Access Granted",
            description: `Welcome to the live class: ${classTitle}`,
          });
        } else {
          toast({
            title: "Demo Not Available",
            description: "Demo access is not configured for this class yet.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("Error accessing demo:", error);

      if (error.response?.status === 403) {
        toast({
          title: "Access Denied",
          description: error.response.data.message || "You need to register first to access demo.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to access demo. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[80vh]">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <Loader2 className="h-12 w-12 text-primary" />
          </motion.div>
          <p className="mt-4 text-gray-600">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classData) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Class Not Found</h1>
        <p className="mb-8">
          The class you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => router.push("/live-classes")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Classes
        </Button>
      </div>
    );
  }

  // Determine user status for all UI elements
  const { userIsRegistered, userHasAccess } = determineUserStatus();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Hero Section with bigger image like courses page */}
      <div className="relative bg-gradient-to-r from-red-800 via-red-700 to-red-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        <div className="container mx-auto px-4 py-12 md:py-20 max-w-7xl relative z-10 mt-20">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
            {/* Hero Image - Left side */}
            <div className="order-1 flex-shrink-0 w-full lg:w-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                <div className="w-full lg:w-[600px] h-56 lg:h-[350px] rounded-2xl overflow-hidden shadow-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                  <Image
                    src={classData.thumbnailUrl}
                    alt={classData.title}
                    fill
                    priority
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />


                </div>
              </motion.div>
            </div>

            {/* Course Info - Right side */}
            <div className="order-1 space-y-6 flex-1 ">


              {/* Badges */}
              <div className="flex flex-wrap gap-2">

                {isAuthenticated && userIsRegistered && (
                  <Badge className="bg-green-600 text-white font-semibold px-4 py-2">
                    ✓ Registered
                  </Badge>
                )}


              </div>              {/* Title and Description */}
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  {classData.title}
                </h1>
                <p className="text-lg md:text-xl text-red-100 leading-relaxed mb-6">
                  {classData.description || "Join our interactive live flute class and learn from expert instructors"}
                </p>
              </div>

              {/* Class Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center text-red-100">
                  <Calendar className="mr-2 h-5 w-5" />
                  <span>{classData.formattedDate}</span>
                </div>

                <div className="flex items-center text-red-100">
                  <User className="mr-2 h-5 w-5" />
                  <span>{classData.teacherName}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Main Content - 60% width */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-3 order-2 lg:order-1 space-y-6 lg:space-y-8"
          >
            {/* About Class Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-8">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                  <Info className="mr-3 h-6 w-6 text-red-600" />
                  About This Class
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed text-lg">
                    {classData.description ||
                      "No description available for this class."}
                  </p>
                </div>
              </div>
            </div>

            {/* Class Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Class Date</h3>
                <p className="text-gray-600">{classData.formattedDate}</p>
              </div>



              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Instructor</h3>
                <p className="text-gray-600">{classData.teacherName}</p>
              </div>
            </div>            {classData.hasModules &&
              classData.modules &&
              classData.modules.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                      <Book className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-800">Class Modules</h2>
                      <p className="text-sm text-gray-600">{classData.modules.length} sessions available</p>
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="space-y-3">
                    {classData.modules.map((module: any, index: number) => (
                      <AccordionItem
                        key={module.id}
                        value={module.id}
                        className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
                      >
                        <AccordionTrigger className="px-6 py-4 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all duration-200">
                          <div className="flex items-center text-left w-full">
                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-red-100 to-red-200 flex items-center justify-center text-red-600 mr-4 font-bold">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-base text-gray-800 mb-1">
                                {module.title}
                              </h3>
                              <div className="flex flex-wrap items-center text-gray-500 text-sm gap-2 md:gap-4">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-1.5" />
                                  <span>
                                    {new Date(module.startTime).toLocaleDateString("en-US", {
                                      month: "short",
                                      day: "numeric",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1.5" />
                                  <span>
                                    {new Date(module.startTime).toLocaleTimeString("en-US", {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                              {module.isFree && (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-green-200">
                                  Free
                                </Badge>
                              )}
                              {module.isOnClassroom && (
                                <Badge className="bg-green-500 text-white animate-pulse">
                                  Live
                                </Badge>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t border-gray-200">
                          <div className="space-y-4">
                            <p className="text-gray-700 leading-relaxed">
                              {module.description ||
                                `Session ${index + 1} of this live class series. Join us for an interactive learning experience.`}
                            </p>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <User className="h-4 w-4 mr-1" />
                                  <span>Instructor: {classData.teacherName}</span>
                                </div>
                              </div>
                              {isAuthenticated && module.isFree && (
                                <Button
                                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                                  size="sm"
                                  onClick={() => handleJoinClass(module.id, true)}
                                >
                                  <Video className="mr-2 h-4 w-4" />
                                  Join Free Session
                                </Button>
                              )}
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </motion.div>
              )}{classData.currentRaga && classData.currentRaga.trim() !== "" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">🎵</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Current Raga</h2>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{classData.currentRaga}</p>
                </motion.div>
              )}

            {classData.currentOrientation &&
              classData.currentOrientation.trim() !== "" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📍</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Current Orientation</h2>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {classData.currentOrientation}
                  </p>
                </motion.div>
              )}

            {classData.sessionDescription &&
              classData.sessionDescription.trim() !== "" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-r from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm font-bold">📝</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800">Session Description</h2>
                  </div>
                  <p className="text-gray-700 whitespace-pre-line leading-relaxed">
                    {classData.sessionDescription}
                  </p>
                </motion.div>
              )}
          </motion.div>          {/* Sidebar - 40% width */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 order-1 lg:order-2"
          >
            <div className="sticky top-28 space-y-6">
              {/* Main Action Card */}
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border-0 overflow-hidden">
                {/* Price Header Section */}
                <div className="relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-red-600/10" />
                  <div className="relative p-6 pb-4">
                    {(() => {
                      const { userHasAccess } = determineUserStatus();

                      if (userHasAccess) {
                        return (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col items-center gap-3"
                          >
                            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle2 className="w-8 h-8 text-green-600" />
                            </div>
                            <Badge className="bg-green-50 text-green-700 text-base px-6 py-2 rounded-full border-green-200">
                              Access Granted
                            </Badge>
                          </motion.div>
                        );
                      }

                      if (classData.registrationFee) {
                        return (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center"
                          >
                            <div className="flex items-center justify-center gap-2 mb-2">
                              <span className="text-4xl font-bold bg-gradient-to-r from-red-600 to-red-500 bg-clip-text text-transparent">
                                ₹{classData.registrationFee}
                              </span>
                              <Badge className="bg-red-100 text-red-700 uppercase text-xs">
                                Registration
                              </Badge>
                            </div>
                            {classData.courseFeeEnabled && classData.courseFee && (
                              <div className="text-sm text-gray-600 mt-2">
                                + ₹{classData.courseFee} course fee after approval
                              </div>
                            )}
                          </motion.div>
                        );
                      }

                      return (
                        <div className="text-center">
                          <span className="text-4xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                            Free
                          </span>
                          <Badge className="bg-green-100 text-green-700 uppercase text-xs ml-2">
                            Demo Class
                          </Badge>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Class Status and Information */}
                <div className="px-6 pb-4">


                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Date
                      </span>
                      <span className="font-semibold text-gray-800">{classData.formattedDate}</span>
                    </div>

                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Instructor
                      </span>
                      <span className="font-semibold text-gray-800">{classData.teacherName}</span>
                    </div>
                  </div>
                </div>


                {/* Action Buttons */}
                <div className="p-6 pt-0 space-y-4">
                  {(() => {
                    const buttonState = getButtonState();

                    return (
                      <div>
                        <Button
                          onClick={buttonState.action || undefined}
                          disabled={buttonState.disabled}
                          className={`w-full py-6 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 ${buttonState.color}`}
                        >
                          {buttonState.type === "join" && isJoining ? (
                            <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          ) : buttonState.type === "join" ? (
                            <Video className="h-5 w-5 mr-2" />
                          ) : buttonState.type === "pay" ? (
                            <CreditCard className="mr-2 h-5 w-5" />
                          ) : buttonState.type === "register" ? (
                            <CreditCard className="mr-2 h-5 w-5" />
                          ) : buttonState.type === "demo" ? (
                            <Video className="mr-2 h-5 w-5" />
                          ) : null}
                          {buttonState.text}
                        </Button>

                        {/* Offline message for demo button */}
                        {buttonState.message && (
                          <div className="text-sm text-gray-600 text-center mt-3 p-3 bg-gray-50 rounded-lg">
                            {buttonState.message}
                          </div>
                        )}

                        {/* Status message below button */}
                        <p className="text-sm text-gray-600 mt-3 text-center leading-relaxed">
                          {buttonState.type === "disabled" && buttonState.text === "Registration Closed" &&
                            "Registration is currently closed for this class. Please check back later or contact support for more information."}
                          {buttonState.type === "disabled" && buttonState.text === "Not Available" &&
                            "This class is not available at the moment"}
                          {buttonState.type === "waiting" &&
                            "Your registration is being reviewed by our admin team"}
                          {buttonState.type === "pay" &&
                            `Complete your payment (₹${classData.courseFee}) to access the live class`}
                          {buttonState.type === "join" &&
                            "You're all set! Click to join the live class"}
                          {buttonState.type === "register" &&
                            `Register now for ₹${classData.registrationFee} to join this live class`}
                          {buttonState.type === "demo" && !buttonState.message &&
                            "Live class content available - click to access"}
                        </p>
                      </div>
                    );
                  })()}
                </div>

                {/* Share Button */}
                <div className="px-6 pb-6">
                  <Button
                    variant="outline"
                    className="w-full border-gray-300 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200"
                    onClick={handleShare}
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share This Class
                  </Button>
                </div>
              </div>

              {/* Information Card */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 shadow-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Info className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-3">Access Information</h4>
                    <p className="text-blue-800 text-sm leading-relaxed">
                      {isAuthenticated ? (
                        (() => {
                          const { userIsRegistered, userHasAccess, userIsApproved } = determineUserStatus();

                          if (userHasAccess) {
                            return "You have full access to this live class. Click the 'Join Live Class' button to participate at the scheduled time.";
                          }

                          if (userIsRegistered && !userIsApproved) {
                            return "Your registration is being reviewed by our admin team. You'll receive an email notification once approved.";
                          }

                          if (userIsRegistered && userIsApproved && classData?.courseFeeEnabled) {
                            return `You're approved! Complete the course fee payment (₹${classData.courseFee}) to join the live class.`;
                          }

                          if (classData?.registrationEnabled === false) {
                            return "Registration is currently closed for this class. Please check back later or contact support for more information.";
                          }

                          return `Register now with a one-time fee of ₹${classData.registrationFee}.${classData?.courseFeeEnabled
                            ? " After approval, you will have to pay the course fee to join the live class."
                            : " After approval, you will get immediate access to join the live class."
                            }`;
                        })()
                      ) : (
                        "Sign in to register for this live class and start your learning journey."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Live Class Access Card - When user has access */}
              {isAuthenticated &&
                (hasAccessToLinks || classData.hasAccessToLinks) &&
                classData.zoomLink && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border border-green-200 shadow-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-800 text-lg flex items-center mb-2">
                          <Video className="h-5 w-5 text-green-600 mr-2" />
                          Live Class Access
                        </h3>
                        <p className="text-green-700 text-sm">
                          Click the button below to join the live class at the scheduled time
                        </p>
                      </div>
                    </div>
                    <Button
                      className="w-full mt-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-600 text-white py-4 rounded-xl font-semibold flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                      onClick={() => handleJoinClass()}
                      disabled={isJoining}
                    >
                      {isJoining ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Video className="h-5 w-5" />
                      )}
                      {isJoining ? "Joining..." : "Join Live Class"}
                    </Button>
                  </div>
                )}
            </div>
          </motion.div>
        </div>
      </div>

      {showPurchaseDialog && (
        <PurchaseDialog
          classData={classData}
          onClose={() => setShowPurchaseDialog(false)}
          onSuccess={handlePurchaseComplete}
        />
      )}

      {showRegistrationDialog && (
        <RegistrationDialog
          classData={classData}
          onClose={() => setShowRegistrationDialog(false)}
          onSuccess={handleRegistrationComplete}
        />
      )}

      {showCourseAccessDialog && (
        <CourseAccessDialog
          classData={classData}
          onClose={() => setShowCourseAccessDialog(false)}
          onSuccess={handleCourseAccessComplete}
        />
      )}

      {classData && (
        <div className="mt-8 lg:col-span-2">
          <ReviewSection
            zoomClassId={classData.id}
            isRegistered={userIsRegistered}
            hasAccess={userHasAccess}
          />
        </div>
      )}
    </div>
  );
}
