"use client";

import { useState } from "react";
import React from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Edit,
  Trash2,
  Users,
  ChevronDown,
  ChevronUp,
  Layers,
  Video,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Type definitions
interface User {
  id: string;
  name: string;
  email: string;
}

interface Module {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  position: number;
  isFree: boolean;
}

interface Registration {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  isRegistered: boolean;
  hasAccessToLinks: boolean;
  status: string;
  createdAt: string;
}

interface ZoomLiveClass {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  price: number;
  registrationFee: number;
  courseFee: number;
  courseFeeEnabled: boolean;
  registrationEnabled: boolean;
  isActive: boolean;
  hasModules: boolean;
  isFirstModuleFree: boolean;
  currentRaga?: string;
  currentOrientation?: string;
  thumbnailUrl?: string | null;
  subscriptions?: User[];
  modules?: Module[];
  slug: string;
  isOnClassroom?: boolean; // Add this field
}

interface ZoomLiveClassTableProps {
  classes: ZoomLiveClass[];
  refreshData: () => void;
}

export default function ZoomSessionsTable({
  classes,
  refreshData,
}: ZoomLiveClassTableProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [expandedSessions, setExpandedSessions] = useState<{
    [key: string]: boolean;
  }>({});
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<ZoomLiveClass | null>(
    null
  );
  const [showRegistrationsDialog, setShowRegistrationsDialog] = useState(false);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [updatingRegistration, setUpdatingRegistration] = useState(false);
  const [joiningClass, setJoiningClass] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: "approve" | "remove" | "delete";
    title: string;
    message: string;
    action: () => Promise<void>;
  } | null>(null);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };


  const toggleExpand = (classId: string) => {
    setExpandedSessions((prev) => ({
      ...prev,
      [classId]: !prev[classId],
    }));
  };


  const handleToggleRegistration = async (classId: string, enabled: boolean) => {
    try {
      setUpdatingRegistration(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${classId}/toggle-registration`,
        { registrationEnabled: enabled },
        { withCredentials: true }
      );
      refreshData();
      toast({
        title: "Success",
        description: `Registration ${enabled ? "enabled" : "disabled"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling registration:", error);
      toast({
        title: "Error",
        description: "Failed to update registration setting",
        variant: "destructive",
      });
    } finally {
      setUpdatingRegistration(false);
    }
  };
  const handleViewRegistrations = async (liveClass: ZoomLiveClass) => {
    try {
      setSelectedClass(liveClass);
      setShowRegistrationsDialog(true);
      setLoadingRegistrations(true);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${liveClass.id}/registrations`,
        { withCredentials: true }
      );

      setRegistrations(response.data.data.registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      toast({
        title: "Error",
        description: "Failed to load registrations",
        variant: "destructive",
      });
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const handleBulkApprove = async () => {
    if (!selectedClass || selectedUsers.length === 0) return;

    setConfirmAction({
      type: "approve",
      title: "Confirm Approval",
      message: `Are you sure you want to approve ${selectedUsers.length} selected user(s)? ${selectedClass.courseFeeEnabled
        ? "They will still need to pay the course fee to access the class."
        : "They will get immediate access to the class."
        }`,
      action: async () => {
        try {
          setProcessingAction(true);
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${selectedClass.id}/approve-registrations`,
            { userIds: selectedUsers },
            { withCredentials: true }
          );

          toast({
            title: "Success",
            description: "Selected registrations approved successfully",
          });

          await handleViewRegistrations(selectedClass);
          setSelectedUsers([]);
        } catch (error) {
          console.error("Error approving registrations:", error);
          toast({
            title: "Error",
            description: "Failed to approve registrations",
            variant: "destructive",
          });
        } finally {
          setProcessingAction(false);
          setShowConfirmDialog(false);
        }
      },
    });
    setShowConfirmDialog(true);
  };

  const handleRemoveAccess = async () => {
    if (!selectedClass || selectedUsers.length === 0) return;

    setConfirmAction({
      type: "remove",
      title: "Confirm Access Removal",
      message: `Are you sure you want to remove access for ${selectedUsers.length} selected user(s)? They will need to be approved again to regain access.`,
      action: async () => {
        try {
          setProcessingAction(true);
          await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${selectedClass.id}/remove-access`,
            { userIds: selectedUsers },
            { withCredentials: true }
          );

          toast({
            title: "Success",
            description: "Access removed for selected users",
          });

          await handleViewRegistrations(selectedClass);
          setSelectedUsers([]);
        } catch (error) {
          console.error("Error removing access:", error);
          toast({
            title: "Error",
            description: "Failed to remove access",
            variant: "destructive",
          });
        } finally {
          setProcessingAction(false);
          setShowConfirmDialog(false);
        }
      },
    });
    setShowConfirmDialog(true);
  };

  const handleDeleteClass = async (liveClass: ZoomLiveClass) => {
    setConfirmAction({
      type: "delete",
      title: "Confirm Delete",
      message: `Are you sure you want to delete "${liveClass.title}"? This action cannot be undone.`,
      action: async () => {
        try {
          setIsLoading(true);
          await axios.delete(
            `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${liveClass.id}`,
            { withCredentials: true }
          );
          toast({
            title: "Success",
            description: "Class deleted successfully",
          });
          refreshData();
        } catch (error) {
          console.error("Error deleting class:", error);
          toast({
            title: "Error",
            description: "Failed to delete class. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
          setShowConfirmDialog(false);
        }
      },
    });
    setShowConfirmDialog(true);
  };

  const handleToggleClassroom = async (classId: string, enabled: boolean) => {
    try {
      setUpdatingRegistration(true);
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${classId}/toggle-classroom`,
        { isOnClassroom: enabled },
        { withCredentials: true }
      );
      refreshData();
      toast({
        title: "Success",
        description: `Live class ${enabled ? "started" : "stopped"} successfully`,
      });
    } catch (error) {
      console.error("Error toggling classroom:", error);
      toast({
        title: "Error",
        description: "Failed to update live class status",
        variant: "destructive",
      });
    } finally {
      setUpdatingRegistration(false);
    }
  };

  const handleAdminJoinClass = async (classId: string) => {
    try {
      setJoiningClass(classId);

      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${classId}/join`,
        { withCredentials: true }
      );

      if (response.data.data.zoomLink) {
        // Open zoom link in new tab
        window.open(response.data.data.zoomLink, '_blank');
        toast({
          title: "Success",
          description: "Joining class... Zoom should open in a new tab.",
        });
      } else {
        toast({
          title: "Error",
          description: "No zoom link available for this class",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining class:", error);
      toast({
        title: "Error",
        description: "Failed to join class. Please check if the class is active.",
        variant: "destructive",
      });
    } finally {
      setJoiningClass(null);
    }
  };

  return (
    <div>
      <Table>
        <TableHeader>          <TableRow>            <TableHead></TableHead>
          <TableHead>Thumbnail</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Start Time</TableHead>
          <TableHead>Reg. Fee</TableHead>
          <TableHead>Course Fee</TableHead>
          <TableHead>Registration</TableHead>
          <TableHead className="text-center">
            <div className="flex items-center justify-center space-x-1">
              <Video size={14} />
              <span>Live Status</span>
            </div>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Subscribers</TableHead>
          <TableHead className="text-center">Actions</TableHead>
        </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((liveClass) => (
            <React.Fragment key={liveClass.id}>
              <TableRow>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpand(liveClass.id)}
                    disabled={
                      !liveClass.hasModules || !liveClass.modules?.length
                    }
                    className={!liveClass.hasModules ? "opacity-0" : ""}
                  >
                    {expandedSessions[liveClass.id] ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </Button>
                </TableCell>
                <TableCell>
                  {liveClass.thumbnailUrl ? (
                    <div className="relative w-12 h-12 rounded-md overflow-hidden">
                      <Image
                        src={liveClass.thumbnailUrl}
                        alt={liveClass.title}
                        fill
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center text-gray-500">
                      No image
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {liveClass.title}
                  {liveClass.hasModules && (
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      <Layers size={12} className="mr-1" />
                      {liveClass.modules?.length || 0} modules
                      {liveClass.isFirstModuleFree && (
                        <Badge
                          variant="outline"
                          className="ml-2 bg-green-50 text-green-700 text-[10px] py-0 px-1"
                        >
                          Free first module
                        </Badge>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>{liveClass.startTime}</TableCell>                <TableCell>₹{liveClass.registrationFee}</TableCell>
                <TableCell>₹{liveClass.courseFee}</TableCell>                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={liveClass.registrationEnabled ?? true}
                      onCheckedChange={(checked) =>
                        handleToggleRegistration(liveClass.id, checked)
                      }
                      disabled={updatingRegistration}
                    />
                    <Label className="text-xs">
                      {liveClass.registrationEnabled ?? true ? "Open" : "Closed"}
                    </Label>
                  </div>
                </TableCell>                <TableCell className="text-center">
                  <div className="flex flex-col items-center space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={liveClass.isOnClassroom ?? false}
                        onCheckedChange={(checked) =>
                          handleToggleClassroom(liveClass.id, checked)
                        }
                        disabled={updatingRegistration}
                      />
                      <Label className={`text-xs font-medium ${liveClass.isOnClassroom ? 'text-green-600' : 'text-gray-500'}`}>
                        {liveClass.isOnClassroom ? "LIVE" : "Offline"}
                      </Label>
                    </div>
                    {liveClass.isOnClassroom && (
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-600 font-medium">On Air</span>
                      </div>
                    )}
                  </div>
                </TableCell>

                <TableCell>
                  <span
                    className={`px-2 py-1 rounded text-sm ${liveClass.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                      }`}
                  >
                    {liveClass.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>{liveClass.subscriptions?.length || 0}</TableCell>                <TableCell className="text-center">
                  <div className="flex flex-wrap items-center justify-center gap-1">
                    <Link href={`/dashboard/zoom/edit/${liveClass.id}`}>
                      <Button variant="outline" size="sm" title="Edit Live Class">
                        <Edit size={14} />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      title="View Registrations"
                      onClick={() => handleViewRegistrations(liveClass)}
                    >
                      <Users size={14} />
                    </Button>

                    <Button
                      variant={liveClass.isOnClassroom ? "default" : "outline"}
                      size="sm"
                      title={liveClass.isOnClassroom ? "Join Live Class" : "Class Not Started"}
                      onClick={() => handleAdminJoinClass(liveClass.id)}
                      disabled={!liveClass.isOnClassroom || joiningClass === liveClass.id}
                      className={liveClass.isOnClassroom ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {joiningClass === liveClass.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Video size={14} />
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      title="Delete Live Class"
                      onClick={() => handleDeleteClass(liveClass)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>

            </React.Fragment>
          ))}
          {classes.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8">
                No zoom live classes found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Registration Dialog */}
      {showRegistrationsDialog && selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Registrations: {selectedClass.title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRegistrationsDialog(false);
                  setSelectedClass(null);
                  setRegistrations([]);
                  setSelectedUsers([]);
                }}
              >
                ✕
              </Button>
            </div>

            {loadingRegistrations ? (
              <div className="flex justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between">
                  <div>
                    <span className="text-sm text-gray-600">
                      {registrations.length} Registration(s)
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleBulkApprove}
                      disabled={selectedUsers.length === 0}
                    >
                      Approve Selected
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemoveAccess}
                      disabled={selectedUsers.length === 0}
                    >
                      Remove Access
                    </Button>
                  </div>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers(
                                registrations.map((reg) => reg.user.id)
                              );
                            } else {
                              setSelectedUsers([]);
                            }
                          }}
                          checked={
                            selectedUsers.length > 0 &&
                            selectedUsers.length === registrations.length
                          }
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.map((reg) => (
                      <TableRow key={reg.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(reg.user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([
                                  ...selectedUsers,
                                  reg.user.id,
                                ]);
                              } else {
                                setSelectedUsers(
                                  selectedUsers.filter(
                                    (id) => id !== reg.user.id
                                  )
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>{reg.user.name}</TableCell>
                        <TableCell>{reg.user.email}</TableCell>
                        <TableCell>{formatDate(reg.createdAt)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              reg.status === "ACTIVE"
                                ? "default"
                                : reg.status === "PENDING"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {reg.status}
                          </Badge>
                          {reg.hasAccessToLinks && (
                            <Badge variant="outline" className="ml-2">
                              Has Access
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {reg.status !== "ACTIVE" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  setProcessingAction(true);
                                  await axios.post(
                                    `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${selectedClass.id}/approve-registrations`,
                                    { userIds: [reg.user.id] },
                                    { withCredentials: true }
                                  );

                                  toast({
                                    title: "Success",
                                    description:
                                      "Registration approved successfully",
                                  });

                                  await handleViewRegistrations(selectedClass);
                                } catch (error) {
                                  console.error(
                                    "Error approving registration:",
                                    error
                                  );
                                  toast({
                                    title: "Error",
                                    description:
                                      "Failed to approve registration",
                                    variant: "destructive",
                                  });
                                } finally {
                                  setProcessingAction(false);
                                }
                              }}
                              disabled={processingAction}
                            >
                              Approve
                            </Button>
                          )}
                          {reg.status === "ACTIVE" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  setProcessingAction(true);
                                  await axios.post(
                                    `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class/${selectedClass.id}/remove-access`,
                                    { userIds: [reg.user.id] },
                                    { withCredentials: true }
                                  );

                                  toast({
                                    title: "Success",
                                    description: "Access removed successfully",
                                  });

                                  await handleViewRegistrations(selectedClass);
                                } catch (error) {
                                  console.error(
                                    "Error removing access:",
                                    error
                                  );
                                  toast({
                                    title: "Error",
                                    description: "Failed to remove access",
                                    variant: "destructive",
                                  });
                                } finally {
                                  setProcessingAction(false);
                                }
                              }}
                              disabled={processingAction}
                            >
                              Remove Access
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {registrations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No registrations found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && confirmAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{confirmAction.title}</h2>
            <p className="mb-6">{confirmAction.message}</p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={processingAction}
              >
                Cancel
              </Button>
              <Button
                variant={
                  confirmAction.type === "delete" ||
                    confirmAction.type === "remove"
                    ? "destructive"
                    : "default"
                }
                onClick={confirmAction.action}
                disabled={processingAction}
              >
                {processingAction ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-background"></div>
                ) : (
                  "Confirm"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
