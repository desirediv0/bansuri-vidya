"use client";

import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileUpload } from "@/components/ui/dropzone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Save,
  Calendar,
  Info,
  Tag,
  IndianRupee,
  Clock,
  User,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { generateSlug } from "@/utils/slugUtils";

interface FormData {
  title: string;
  description: string;
  startTime: string;
  thumbnailUrl: string;
  registrationFee: string;
  courseFee: string;
  courseFeeEnabled: boolean;
  registrationEnabled: boolean;
  currentRaga: string;
  currentOrientation: string;
  sessionDescription: string;
  isActive: boolean;
  author: string;
  slug: string;
}

export default function CreateZoomLiveClassPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    startTime: "",
    thumbnailUrl: "",
    registrationFee: "0",
    courseFee: "0",
    courseFeeEnabled: true,
    registrationEnabled: true,
    currentRaga: "",
    currentOrientation: "",
    sessionDescription: "",
    isActive: true,
    author: "",
    slug: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const { toast } = useToast();

  // Generate slug from title automatically
  useEffect(() => {
    if (formData.title && !slugManuallyEdited) {
      const generatedSlug = generateSlug(formData.title);
      setFormData((prev) => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, slugManuallyEdited]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // Format slug field specifically
    if (name === "slug") {
      const formattedSlug = value
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

      setFormData((prev) => ({ ...prev, [name]: formattedSlug }));
      setSlugManuallyEdited(true);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // If user is manually editing the slug, track this
    if (name === "slug") {
      setSlugManuallyEdited(true);
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleImageUpload = (fileUrl: string) => {
    setFormData((prev) => ({ ...prev, thumbnailUrl: fileUrl }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Basic validation
    if (
      !formData.title ||
      !formData.startTime ||
      !formData.registrationFee ||
      !formData.courseFee ||
      !formData.thumbnailUrl
    ) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Use the slug directly if provided, otherwise generate from title
      const slug = formData.slug || generateSlug(formData.title);

      // Prepare payload
      const payload: any = {
        title: formData.title,
        description: formData.description || "",
        startTime: formData.startTime,
        registrationFee: parseFloat(formData.registrationFee),
        courseFee: parseFloat(formData.courseFee),
        courseFeeEnabled: true,
        registrationEnabled: formData.registrationEnabled,
        currentRaga: formData.currentRaga || null,
        currentOrientation: formData.currentOrientation || null,
        sessionDescription: formData.sessionDescription || null,
        isActive: formData.isActive,
        thumbnailUrl: formData.thumbnailUrl,
        slug: slug,
        price: 0,
        getPrice: false,
        hasModules: false,
        isFirstModuleFree: false,
        recurringClass: false,
        author: formData.author || "",
      };

      // Create zoom live class
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/admin/class`,
        payload,
        { withCredentials: true }
      );

      toast({
        title: "Success",
        description: "Live class created successfully",
      });

      router.push("/dashboard/zoom");
    } catch (error: any) {
      console.error("Error creating live class:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create class",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="p-0 h-auto"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Live Classes
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Create New Live Class</h1>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-xl flex items-center">
            <Info className="h-5 w-5 mr-2 text-blue-500" />
            Class Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Class Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter a descriptive title for your class"
                    className="w-full"
                    required
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="slug" className="text-sm font-medium">
                    URL Slug
                  </Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="custom-url-path (leave empty to auto-generate from title)"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">
                    Custom URL identifier (e.g.,
                    "intermediate-bansuri-class-june"). The slug will
                    auto-update as you type the title unless you manually edit
                    it.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="author" className="text-sm font-medium">
                    Meeting Author/Host
                  </Label>
                  <div className="relative">
                    <User className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                    <Input
                      id="author"
                      name="author"
                      value={formData.author}
                      onChange={handleChange}
                      placeholder="Enter meeting host name"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Class Description
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Provide details about what students will learn"
                    rows={4}
                    className="resize-none"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label
                    htmlFor="sessionDescription"
                    className="text-sm font-medium"
                  >
                    Session Description
                  </Label>
                  <Textarea
                    id="sessionDescription"
                    name="sessionDescription"
                    value={formData.sessionDescription}
                    onChange={handleChange}
                    placeholder="Provide additional details about the session"
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </div>

              <Separator />

              {/* Schedule */}
              <div>
                <h3 className="text-base font-medium mb-4 flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-blue-500" />
                  Schedule
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime" className="text-sm font-medium">
                      Start Time <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Clock className="h-4 w-4 absolute left-3 top-3 text-gray-500" />
                      <Input
                        id="startTime"
                        name="startTime"
                        type="text"
                        value={formData.startTime}
                        onChange={handleChange}
                        className="pl-10"
                        placeholder="e.g., June 15, 2024 15:00"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Enter date and time in any format (e.g., June 15, 2024
                      3:00 PM)
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Fees Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="registrationFee"
                    className="text-sm font-medium"
                  >
                    Registration Fee <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="registrationFee"
                    name="registrationFee"
                    type="number"
                    value={formData.registrationFee}
                    onChange={handleChange}
                    placeholder="Enter registration fee"
                    className="w-48"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="courseFee" className="text-sm font-medium">
                      Course Fee <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="courseFee"
                      name="courseFee"
                      type="number"
                      value={formData.courseFee}
                      onChange={handleChange}
                      placeholder="Enter course fee"
                      className="w-48"
                      required
                    />
                  </div>
                  <div className="mt-2 p-3 rounded-md border border-blue-200 bg-blue-50">
                    <div className="flex items-center space-x-2">
                      <Info className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-blue-700 font-medium">
                        Course fee requirement is always enabled
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Students must pay the course fee to access class links after
                    registration. Course fee requirement is always required for
                    all live classes.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Class Details */}
              <div>
                <h3 className="text-base font-medium mb-4 flex items-center">
                  <Tag className="h-4 w-4 mr-2 text-blue-500" />
                  Class Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label
                      htmlFor="currentRaga"
                      className="text-sm font-medium"
                    >
                      Current Raga
                    </Label>
                    <Input
                      id="currentRaga"
                      name="currentRaga"
                      value={formData.currentRaga}
                      onChange={handleChange}
                      placeholder="e.g., Madhyam Saptak, Sa - Pa"
                    />
                    <p className="text-xs text-gray-500">
                      Musical Raga covered in this class
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="currentOrientation"
                      className="text-sm font-medium"
                    >
                      Current Orientation
                    </Label>
                    <Input
                      id="currentOrientation"
                      name="currentOrientation"
                      value={formData.currentOrientation}
                      onChange={handleChange}
                      placeholder="e.g., Hindi Classical, Carnatic"
                    />
                    <p className="text-xs text-gray-500">
                      Musical style or orientation
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Thumbnail */}
              <div>
                <h3 className="text-base font-medium mb-4">Thumbnail Image</h3>
                <FileUpload
                  onUploadComplete={handleImageUpload}
                  existingImageUrl={formData.thumbnailUrl}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Recommended size: 1280x720px (16:9 ratio)
                </p>
              </div>

              <Separator />

              {/* Settings */}
              <div>
                <h3 className="text-base font-medium mb-4">Settings</h3>
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label
                      htmlFor="isActive"
                      className="text-sm font-medium cursor-pointer"
                    >
                      Active Status
                    </Label>
                    <p className="text-xs text-gray-500">
                      Make this class visible to students
                    </p>
                  </div>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      handleSwitchChange("isActive", checked)
                    }
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/dashboard/zoom")}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  {isLoading ? (
                    "Creating..."
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Create Class
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
