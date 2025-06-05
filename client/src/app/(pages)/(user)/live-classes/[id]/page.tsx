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
  Copy,
  CreditCard,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/helper/AuthContext";
import PurchaseDialog from "../components/PurchaseDialog";
import RegistrationDialog from "../components/RegistrationDialog";
import CourseAccessDialog from "../components/CourseAccessDialog";
import { HeroSection } from "@/app/(pages)/_components/HeroSectionProps";
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
    const showClosed = apiFlags.showClosed || false;

    // HIGHEST PRIORITY: If user can join class (has access AND admin has started the class)
    if (canJoinClass) {
      return {
        type: "join",
        text: isJoining ? "Joining..." : "Join Live Class",
        color: "bg-green-600 hover:bg-green-700 text-white",
        disabled: isJoining,
        action: () => handleJoinClass()
      };
    }    // SECOND PRIORITY: If user is registered, check isOnline status immediately (no approval needed for demo)
    if (userIsRegistered && showDemo) {
      const isOnline = classData?.apiFlags?.isOnline || classData?.isOnClassroom || false;

      // Debug logging
      console.log("Demo button state debug:", {
        userIsRegistered,
        showDemo,
        isOnline,
        "classData.apiFlags.isOnline": classData?.apiFlags?.isOnline,
        "classData.isOnClassroom": classData?.isOnClassroom,
        "classData.apiFlags": classData?.apiFlags
      });

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
    }

    // If API says show course fee button
    if (showCourseFee) {
      return {
        type: "pay",
        text: "Pay Course Fee",
        color: "bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white",
        disabled: false,
        action: () => setShowCourseAccessDialog(true)
      };
    }

    // If API says show waiting message (for non-registered users or when demo not available)
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
    }

    // If API says show closed message (registration disabled and user not registered)
    if (showClosed) {
      return {
        type: "disabled",
        text: "Registration Closed",
        color: "bg-gray-500 cursor-not-allowed text-white",
        disabled: true,
        action: null
      };
    }

    // If user can register (new users when registration is open)
    if (canRegister) {
      return {
        type: "register",
        text: "Register for Class",
        color: "bg-gradient-to-r from-[#af1d33] to-[#8f1729] hover:from-[#8f1729] hover:to-[#af1d33] text-white",
        disabled: false,
        action: () => {
          setShowRegistrationDialog(true);
        }
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
        const { demoLink, demoPassword, demoMeetingId, classTitle, approvalStatus } = response.data.data;

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
    <div className="min-h-screen bg-gradient-to-b from-[#F8F9FA] to-[#F3F8F8]">
      <HeroSection
        smallText="Live Classes"
        title="Learn from expert instructors in real-time"
        variant="page"
        image={{
          src: "/rupak-sir.webp",
          alt: "Live flute classes",
        }}
      />
      <div className="container mx-auto px-4 py-12">
        <Button
          variant="ghost"
          onClick={() => router.push("/live-classes")}
          className="mb-6 hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all classes
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2"
          >
            <div className="relative h-64 md:h-96 w-full rounded-xl overflow-hidden mb-6">
              <Image
                src={
                  classData.thumbnailUrl ||
                  "/images/default-class-thumbnail.jpg"
                }
                alt={classData.title}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

              {isAuthenticated && userIsRegistered && (
                <div className="absolute top-4 right-4">
                  <Badge
                    variant="secondary"
                    className="px-3 py-1.5 bg-green-600 text-white font-medium"
                  >
                    Registered
                  </Badge>
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4">
                <h1 className="text-white text-2xl md:text-4xl font-bold mb-2">
                  {classData.title}
                </h1>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge
                    variant="outline"
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                  >
                    {classData.category || "Flute"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-white/20 backdrop-blur-sm text-white border-white/30"
                  >
                    {classData.level || "All Levels"}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <h2 className="text-xl font-bold mb-4 text-gray-800">
                About This Class
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {classData.description ||
                  "No description available for this class."}
              </p>
            </div>

            {classData.hasModules &&
              classData.modules &&
              classData.modules.length > 0 && (
                <div className="bg-white rounded-xl shadow-md p-6 mb-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    Class Modules
                  </h2>
                  <Accordion type="single" collapsible className="space-y-3">
                    {classData.modules.map((module: any, index: number) => (
                      <AccordionItem
                        key={module.id}
                        value={module.id}
                        className="border rounded-lg overflow-hidden"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50">
                          <div className="flex items-center text-left">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-600 mr-3">
                              {index + 1}
                            </div>
                            <div>
                              <h3 className="font-semibold text-base">
                                {module.title}
                              </h3>
                              <div className="flex items-center text-gray-500 text-sm mt-1">
                                <Calendar className="h-3.5 w-3.5 mr-1.5" />
                                <span>
                                  {new Date(
                                    module.startTime
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                                <Clock className="h-3.5 w-3.5 ml-3 mr-1.5" />
                                <span>
                                  {new Date(
                                    module.startTime
                                  ).toLocaleTimeString("en-US", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    hour12: true,
                                  })}
                                </span>
                              </div>
                            </div>
                            {module.isFree && (
                              <span className="ml-auto mr-4 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                                Free
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 py-3 bg-gray-50 border-t">
                          <p className="text-gray-700 mb-3">
                            {module.description ||
                              `Session ${index + 1} of this live class series.`}
                          </p>
                          {isAuthenticated && module.isFree && (
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white mt-2"
                              size="sm"
                              onClick={() => handleJoinClass(module.id, true)}
                            >
                              <CheckCircle2 className="mr-2 h-4 w-4" />
                              Join Free Module
                            </Button>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              )}

            {classData.currentRaga && classData.currentRaga.trim() !== "" && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800">
                  Current Raga
                </h2>
                <p className="text-gray-700">{classData.currentRaga}</p>
              </div>
            )}

            {classData.currentOrientation &&
              classData.currentOrientation.trim() !== "" && (
                <div className="bg-white rounded-xl shadow-md p-6 mt-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    Current Orientation
                  </h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {classData.currentOrientation}
                  </p>
                </div>
              )}

            {classData.sessionDescription &&
              classData.sessionDescription.trim() !== "" && (
                <div className="bg-white rounded-xl shadow-md p-6 mt-8">
                  <h2 className="text-xl font-bold mb-4 text-gray-800">
                    Session Description
                  </h2>
                  <p className="text-gray-700 whitespace-pre-line">
                    {classData.sessionDescription}
                  </p>
                </div>
              )}
          </motion.div>

          {/* Right Column - Class Details & CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
              <div className="mb-6">
                <div className="flex flex-col gap-2">
                  {isAuthenticated &&
                    (isRegistered || classData.isRegistered) ? (
                    hasAccessToLinks || classData.hasAccessToLinks ? (
                      <div className="text-center py-2">
                        <span className="text-green-600 font-semibold text-lg flex items-center justify-center">
                          <CheckCircle2 className="mr-2 h-5 w-5" />
                          You have full access to this class
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Course Fee:</span>
                        <span className="text-xl font-bold text-[#af1d33]">
                          ₹{classData.courseFee}
                        </span>
                      </div>
                    )
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Registration Fee:</span>
                        <span className="text-xl font-bold text-[#af1d33]">
                          ₹{classData.registrationFee}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">Course Fee:</span>
                        <span className="text-xl font-bold text-[#af1d33]">
                          ₹{classData.courseFee}
                        </span>
                      </div>
                      <div className="h-px bg-gray-200 my-2"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-medium">
                          Total:
                        </span>
                        <span className="text-2xl font-bold text-[#af1d33]">
                          ₹
                          {(
                            (classData.registrationFee || 0) +
                            (classData.courseFee || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center text-gray-700">
                  <Calendar className="mr-3 h-5 w-5 text-[#af1d33]" />
                  <div>
                    <div className="font-medium">Date</div>
                    <div>{classData.formattedDate}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <Clock className="mr-3 h-5 w-5 text-[#af1d33]" />
                  <div>
                    <div className="font-medium">Time</div>
                    <div>{classData.formattedTime}</div>
                  </div>
                </div>
                <div className="flex items-center text-gray-700">
                  <User className="mr-3 h-5 w-5 text-[#af1d33]" />
                  <div>
                    <div className="font-medium">Instructor</div>
                    <div>{classData.teacherName}</div>
                  </div>
                </div>
                {(() => {
                  const { userIsRegistered, userHasAccess, userIsApproved } = determineUserStatus();

                  // Only show status badge if user is registered but doesn't have full access
                  if (userIsRegistered && !userHasAccess) {
                    return (
                      <div className="mt-2 pt-2 border-t border-gray-100">
                        {/* <div className="text-sm font-medium text-gray-500">
                          Registration Status:
                        </div>
                        <div
                          className={`mt-1 px-3 py-1.5 rounded-md text-sm font-medium inline-flex items-center ${!userIsApproved
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                            }`}
                        >
                          {!userIsApproved
                            ? "Pending Admin Approval"
                            : classData?.courseFeeEnabled
                              ? "Approved - Ready for Payment"
                              : "Approved - Ready to Join"}
                        </div> */}
                      </div>
                    );
                  }

                  return null;
                })()}
              </div>              <div className="space-y-4">
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
                        <div className="text-sm text-gray-600 text-center mt-2 px-3 py-2 bg-gray-50 rounded-lg">
                          {buttonState.message}
                        </div>
                      )}

                      {/* Status message below button */}
                      <p className="text-sm text-gray-600 mt-3 text-center">
                        {buttonState.type === "disabled" && "Registration is currently closed for this class"}
                        {buttonState.type === "waiting" && "Your registration is being reviewed by our admin team"}
                        {buttonState.type === "pay" && `Complete your payment (₹${classData.courseFee}) to access the live class`}
                        {buttonState.type === "join" && "You're all set! Click to join the live class"}
                        {buttonState.type === "register" && `Register now for ₹${classData.registrationFee} to join this live class`}
                        {buttonState.type === "demo" && !buttonState.message && "Live class content available - click to access"}
                      </p>
                    </div>
                  );
                })()}
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 py-6 rounded-full font-medium"
                  onClick={handleShare}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Share This Class
                </Button>
              </div>

              <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">
                      Access Information
                    </h4>
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
                            ? " After approval, you'll need to pay the course fee to join the live class."
                            : " After approval, you'll get immediate access to join the live class."
                            }`;
                        })()
                      ) : (
                        "Sign in to register for this live class and start your learning journey."
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Zoom meeting details when user has access */}
              {isAuthenticated &&
                (hasAccessToLinks || classData.hasAccessToLinks) &&
                classData.zoomLink && (
                  <div className="mt-4 p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-green-800 text-lg flex items-center">
                          <Video className="h-5 w-5 text-green-600 mr-2" />
                          Live Class Access
                        </h3>
                        <p className="text-green-700 mt-1 text-sm">
                          Click the button below to join the live class at the
                          scheduled time
                        </p>
                      </div>
                      <Button
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-600 text-white py-6 px-8 rounded-xl font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
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
