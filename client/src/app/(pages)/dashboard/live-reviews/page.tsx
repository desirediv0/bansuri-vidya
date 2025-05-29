"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { useCustomDebounce } from "@/hooks/useCustomDebounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Star, Trash2, Edit2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  isEdited: boolean;
  user: {
    name: string;
    email: string;
  };
  zoomClass: {
    title: string;
    slug: string;
  };
}

interface PaginationData {
  total: number;
  pages: number;
  page: number;
  limit: number;
}

export default function LiveReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useCustomDebounce(searchTerm, 500);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    pages: 1,
    page: 1,
    limit: 10,
  });
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState("");
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchReviews();
  }, [pagination.page, debouncedSearchTerm]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-review/admin/all`,
        {
          params: {
            page: pagination.page,
            limit: pagination.limit,
            search: debouncedSearchTerm,
          },
          withCredentials: true,
        }
      );
      setReviews(response.data.data.reviews);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewToDelete) return;

    try {
      await axios.delete(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-review/delete/${reviewToDelete}`,
        { withCredentials: true }
      );
      toast.success("Review deleted successfully");
      setReviewToDelete(null);
      fetchReviews();
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review");
    }
  };

  const handleEditClick = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleUpdateReview = async () => {
    if (!editingReview) return;

    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_API_URL}/zoom-review/update/${editingReview.id}`,
        {
          rating: editRating,
          comment: editComment,
        },
        { withCredentials: true }
      );
      toast.success("Review updated successfully");
      setEditingReview(null);
      fetchReviews();
    } catch (error) {
      console.error("Error updating review:", error);
      toast.error("Failed to update review");
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Live Class Reviews</h1>
        <div className="flex items-center gap-2">
          <Search className="h-5 w-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{review.user.name}</div>
                    <div className="text-sm text-gray-500">
                      {review.user.email}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{review.zoomClass.title}</TableCell>
                <TableCell>
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-md">
                  <p className="truncate">{review.comment}</p>
                </TableCell>
                <TableCell>
                  {new Date(review.createdAt).toLocaleDateString()}
                  {review.isEdited && (
                    <span className="text-xs text-gray-500"> (edited)</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditClick(review)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setReviewToDelete(review.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {reviews.length === 0 && (
          <div className="text-center py-8 text-gray-500">No reviews found</div>
        )}

        {pagination.pages > 1 && (
          <div className="py-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.max(1, prev.page - 1),
                      }))
                    }
                    aria-disabled={pagination.page === 1}
                  />
                </PaginationItem>
                {[...Array(pagination.pages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink
                      onClick={() =>
                        setPagination((prev) => ({ ...prev, page: i + 1 }))
                      }
                      isActive={pagination.page === i + 1}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        page: Math.min(pagination.pages, prev.page + 1),
                      }))
                    }
                    aria-disabled={pagination.page === pagination.pages}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingReview}
        onOpenChange={() => setEditingReview(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setEditRating(num)}
                    className="focus:outline-none"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        num <= editRating
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Comment</label>
              <Textarea
                value={editComment}
                onChange={(e) => setEditComment(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingReview(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateReview}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!reviewToDelete}
        onOpenChange={() => setReviewToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setReviewToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
