"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye, Code, GripVertical } from "lucide-react";
import axios from "axios";

interface TrackingScript {
    id: string;
    name: string;
    description?: string;
    scriptContent: string;
    position: "HEAD" | "BODY_START" | "BODY_END";
    priority: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

const TrackingScriptsPage = () => {
    const [scripts, setScripts] = useState<TrackingScript[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [editingScript, setEditingScript] = useState<TrackingScript | null>(null);
    const [previewScript, setPreviewScript] = useState<TrackingScript | null>(null); const [formData, setFormData] = useState({
        name: "",
        description: "",
        scriptContent: "",
        position: "HEAD" as "HEAD" | "BODY_START" | "BODY_END",
        priority: 1,
        isActive: true,
    });
    // Fetch tracking scripts
    const fetchScripts = async () => {
        try {
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/tracking-scripts`,
                { withCredentials: true }
            );
            // Transform backend response to match frontend interface
            const transformedScripts = response.data.data.map((script: any) => ({
                ...script,
                scriptContent: script.script, // Map script field to scriptContent
            }));
            setScripts(transformedScripts);
        } catch (error) {
            console.error("Error fetching scripts:", error);
            toast.error("Failed to fetch tracking scripts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchScripts();
    }, []);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingScript) {
                // Update existing script - transform scriptContent to script for server
                const { scriptContent, ...otherFields } = formData;
                const serverData = {
                    ...otherFields,
                    script: scriptContent
                };

                await axios.patch(
                    `${process.env.NEXT_PUBLIC_API_URL}/tracking-scripts/${editingScript.id}`,
                    serverData,
                    { withCredentials: true }
                );
                toast.success("Script updated successfully");
            } else {
                // Create new script - transform scriptContent to script for server
                const { scriptContent, ...otherFields } = formData;
                const serverData = {
                    ...otherFields,
                    script: scriptContent
                };

                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/tracking-scripts`,
                    serverData,
                    { withCredentials: true }
                );
                toast.success("Script created successfully");
            }

            fetchScripts();
            resetForm();
            setDialogOpen(false);
        } catch (error) {
            console.error("Error saving script:", error);
            toast.error("Failed to save script");
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            scriptContent: "",
            position: "HEAD",
            priority: 1,
            isActive: true,
        });
        setEditingScript(null);
    };

    // Handle edit
    const handleEdit = (script: TrackingScript) => {
        setEditingScript(script);
        setFormData({
            name: script.name,
            description: script.description || "",
            scriptContent: script.scriptContent,
            position: script.position,
            priority: script.priority,
            isActive: script.isActive,
        });
        setDialogOpen(true);
    };

    // Handle delete
    const handleDelete = async (id: string) => {
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_API_URL}/tracking-scripts/${id}`,
                { withCredentials: true }
            );
            toast.success("Script deleted successfully");
            fetchScripts();
        } catch (error) {
            console.error("Error deleting script:", error);
            toast.error("Failed to delete script");
        }
    };

    // Toggle script status
    const toggleScript = async (id: string) => {
        try {
            await axios.patch(
                `${process.env.NEXT_PUBLIC_API_URL}/tracking-scripts/${id}/toggle`,
                {},
                { withCredentials: true }
            );
            toast.success("Script status updated");
            fetchScripts();
        } catch (error) {
            console.error("Error toggling script:", error);
            toast.error("Failed to update script status");
        }
    };

    // Handle preview
    const handlePreview = (script: TrackingScript) => {
        setPreviewScript(script);
        setPreviewOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Tracking Scripts</h1>
                    <p className="text-muted-foreground">
                        Manage analytics and tracking scripts for your website
                    </p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={resetForm}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Script
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingScript ? "Edit Script" : "Add New Script"}
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="name">Script Name</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) =>
                                            setFormData({ ...formData, name: e.target.value })
                                        }
                                        placeholder="e.g., Google Analytics"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="position">Position</Label>                                    <Select
                                        value={formData.position}
                                        onValueChange={(value: "HEAD" | "BODY_START" | "BODY_END") =>
                                            setFormData({ ...formData, position: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>                                        <SelectContent>
                                            <SelectItem value="HEAD">Head Section</SelectItem>
                                            <SelectItem value="BODY_START">Body Start</SelectItem>
                                            <SelectItem value="BODY_END">Body End</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) =>
                                        setFormData({ ...formData, description: e.target.value })
                                    }
                                    placeholder="Brief description of the script"
                                />
                            </div>

                            <div>
                                <Label htmlFor="scriptContent">Script Content</Label>
                                <Textarea
                                    id="scriptContent"
                                    value={formData.scriptContent}
                                    onChange={(e) =>
                                        setFormData({ ...formData, scriptContent: e.target.value })
                                    }
                                    placeholder="Paste your tracking script here..."
                                    rows={10}
                                    className="font-mono text-sm"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="priority">Priority</Label>
                                    <Input
                                        id="priority"
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                priority: parseInt(e.target.value) || 1,
                                            })
                                        }
                                        min="1"
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Switch
                                        checked={formData.isActive}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, isActive: checked })
                                        }
                                    />
                                    <Label>Active</Label>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit">
                                    {editingScript ? "Update" : "Create"}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Scripts List */}
            <div className="grid gap-4">
                {scripts.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-12">
                            <Code className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-2">No scripts found</h3>
                            <p className="text-muted-foreground text-center mb-4">
                                Add your first tracking script to get started with analytics
                            </p>
                            <Button onClick={() => setDialogOpen(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Script
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    scripts.map((script) => (
                        <Card key={script.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <CardTitle className="flex items-center space-x-2">
                                                <span>{script.name}</span>
                                                <Badge variant={script.isActive ? "default" : "secondary"}>
                                                    {script.isActive ? "Active" : "Inactive"}
                                                </Badge>                                                <Badge variant="outline">
                                                    {script.position.replace(/_/g, " ")}
                                                </Badge>
                                            </CardTitle>
                                            {script.description && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    {script.description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handlePreview(script)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEdit(script)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Switch
                                            checked={script.isActive}
                                            onCheckedChange={() => toggleScript(script.id)}
                                        />
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Delete Script</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to delete "{script.name}"? This
                                                        action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction
                                                        onClick={() => handleDelete(script.id)}
                                                    >
                                                        Delete
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>Priority: {script.priority}</span>
                                    <span>
                                        Updated: {new Date(script.updatedAt).toLocaleDateString()}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Preview Dialog */}
            <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>Script Preview: {previewScript?.name}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Position</Label>
                                <p className="text-sm text-muted-foreground">
                                    {previewScript?.position.replace("_", " ").toUpperCase()}
                                </p>
                            </div>
                            <div>
                                <Label>Priority</Label>
                                <p className="text-sm text-muted-foreground">
                                    {previewScript?.priority}
                                </p>
                            </div>
                        </div>
                        <div>
                            <Label>Script Content</Label>
                            <pre className="mt-2 p-4 bg-muted rounded-lg overflow-auto text-sm">
                                {previewScript?.scriptContent}
                            </pre>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TrackingScriptsPage;
