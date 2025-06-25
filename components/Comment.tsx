// components/Comment.tsx
"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  MessageCircle,
  Check,
  X,
  User,
  Clock,
  Search,
  Filter,
  AlertCircle,
  Pin,
  PinOff,
} from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CommentProps {
  isOpen: boolean;
  onClose: () => void;
  debtorId: string;
  debtorName: string;
}

type CommentType = {
  id: string;
  text: string;
  createdBy: {
    name: string;
    avatar?: string;
    role: string;
  };
  createdAt: string;
  category: string;
  isPinned: boolean;
  isInternal: boolean;
};

export function Comment({
  isOpen,
  onClose,
  debtorId,
  debtorName,
}: CommentProps) {
  const [newComment, setNewComment] = useState("");
  const [commentCategory, setCommentCategory] = useState("general");
  const [isInternal, setIsInternal] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  // Mock data for comments
  const [comments, setComments] = useState<CommentType[]>([
    {
      id: "c-001",
      text: "Debtor promised to make a payment by the end of the month. Sounded sincere and provided details of upcoming income.",
      createdBy: {
        name: "Sarah Johnson",
        avatar: "",
        role: "Collection Agent",
      },
      createdAt: "2025-03-10T14:30:00Z",
      category: "payment",
      isPinned: true,
      isInternal: true,
    },
    {
      id: "c-002",
      text: "Debtor disputed the late fee charges. I've explained our policy but they remain unsatisfied. May need supervisor intervention.",
      createdBy: {
        name: "Michael Chen",
        avatar: "",
        role: "Senior Agent",
      },
      createdAt: "2025-03-08T09:15:00Z",
      category: "dispute",
      isPinned: false,
      isInternal: true,
    },
    {
      id: "c-003",
      text: "Called multiple times but no answer. Left voicemail requesting callback.",
      createdBy: {
        name: "Alex Rivera",
        avatar: "",
        role: "Collection Agent",
      },
      createdAt: "2025-03-05T11:45:00Z",
      category: "contact",
      isPinned: false,
      isInternal: true,
    },
    {
      id: "c-004",
      text: "Debtor requested payment plan options. I've emailed the standard options to them.",
      createdBy: {
        name: "Taylor Smith",
        avatar: "",
        role: "Collection Agent",
      },
      createdAt: "2025-03-01T16:20:00Z",
      category: "payment",
      isPinned: false,
      isInternal: true,
    },
  ]);

  // Comment categories
  const commentCategories = [
    { id: "general", name: "General", color: "slate" },
    { id: "payment", name: "Payment", color: "green" },
    { id: "dispute", name: "Dispute", color: "amber" },
    { id: "contact", name: "Contact Attempt", color: "blue" },
    { id: "legal", name: "Legal", color: "cyan" },
    { id: "urgent", name: "Urgent", color: "red" },
  ];

  // Filtered comments based on search and category
  const filteredComments = comments
    .filter((comment) => {
      // Filter by tab
      if (activeTab === "pinned" && !comment.isPinned) return false;
      if (activeTab === "internal" && !comment.isInternal) return false;
      if (activeTab === "external" && comment.isInternal) return false;

      // Filter by search query
      if (
        searchQuery &&
        !comment.text.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      // Filter by category
      if (categoryFilter !== "all" && comment.category !== categoryFilter) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      // Pinned comments first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      // Then sort by date (newest first)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create new comment
      const comment: CommentType = {
        id: `c-${Date.now()}`,
        text: newComment,
        createdBy: {
          name: "Current User", // Replace with actual user name
          avatar: "",
          role: "Collection Agent", // Replace with actual user role
        },
        createdAt: new Date().toISOString(),
        category: commentCategory,
        isPinned: false,
        isInternal: isInternal,
      };

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Update state
      setComments([...comments, comment]);

      // Reset form
      setNewComment("");

      // Show success message
      toast.success("Comment added", {
        description: "Your comment has been added to the account",
        position: "top-center",
        duration: 3000,
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment", {
        description:
          "There was an error adding your comment. Please try again.",
        position: "top-center",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePin = async (commentId: string) => {
    try {
      // Find the comment
      const updatedComments = comments.map((comment) => {
        if (comment.id === commentId) {
          return { ...comment, isPinned: !comment.isPinned };
        }
        return comment;
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Update state
      setComments(updatedComments);

      // Show success message
      const isPinned = updatedComments.find(
        (c) => c.id === commentId
      )?.isPinned;
      toast.success(isPinned ? "Comment pinned" : "Comment unpinned", {
        position: "top-center",
        duration: 2000,
      });
    } catch (error) {
      console.error("Error toggling pin:", error);
      toast.error("Action failed", {
        description:
          "There was an error updating the comment. Please try again.",
        position: "top-center",
        duration: 5000,
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      // Today - show time
      return `Today at ${date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (diffDays === 1) {
      // Yesterday
      return `Yesterday at ${date.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      })}`;
    } else if (diffDays < 7) {
      // Within a week
      return `${diffDays} days ago`;
    } else {
      // More than a week
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  };

  // Get category color
  const getCategoryColor = (categoryId: string) => {
    const category = commentCategories.find((c) => c.id === categoryId);
    return category ? category.color : "slate";
  };

  // Get category name
  const getCategoryName = (categoryId: string) => {
    const category = commentCategories.find((c) => c.id === categoryId);
    return category ? category.name : "General";
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="relative flex flex-col h-full">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 via-pink-400 to-purple-600"></div>
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl"></div>

          <DialogHeader className="p-6 pb-0 flex-shrink-0">
            <div className="flex items-center space-x-2 mb-2">
              <div className="bg-gradient-to-br from-pink-500 to-pink-600 p-2 rounded-full">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold text-slate-100">
                Account Comments
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-400">
              View and add comments for {debtorName}
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 pt-4 flex-shrink-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="bg-slate-800/50 w-full">
                <TabsTrigger
                  value="all"
                  className="flex-1 data-[state=active]:bg-slate-700"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="pinned"
                  className="flex-1 data-[state=active]:bg-slate-700"
                >
                  Pinned
                </TabsTrigger>
                <TabsTrigger
                  value="internal"
                  className="flex-1 data-[state=active]:bg-slate-700"
                >
                  Internal
                </TabsTrigger>
                <TabsTrigger
                  value="external"
                  className="flex-1 data-[state=active]:bg-slate-700"
                >
                  External
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="px-6 pt-4 space-y-2 flex-shrink-0">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search comments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-slate-800/50 border-slate-700 text-slate-300 w-full"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-slate-700 text-slate-300">
                  <div className="flex items-center">
                    <Filter className="h-3.5 w-3.5 mr-2 text-slate-500" />
                    <span className="truncate">
                      {categoryFilter === "all"
                        ? "All Categories"
                        : getCategoryName(categoryFilter)}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                  <SelectItem value="all">All Categories</SelectItem>
                  {commentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div
            style={{
              padding: "16px 24px",
              overflowY: "auto",
              maxHeight: "35vh", // Reduced from 60vh to ensure comment box is visible
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(51, 65, 85, 0.5) rgba(15, 23, 42, 0.3)",
              backgroundColor: "#1e293b",
            }}
            className="flex-grow"
          >
            {filteredComments.length > 0 ? (
              <div className="space-y-4">
                {filteredComments.map((comment) => (
                  <div
                    key={comment.id}
                    className={`bg-slate-800/50 rounded-lg border p-4 transition-all ${
                      comment.isPinned
                        ? "border-pink-500/30 shadow-[0_0_10px_rgba(236,72,153,0.1)]"
                        : "border-slate-700"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8 border border-slate-600">
                          {comment.createdBy.avatar ? (
                            <AvatarImage
                              src={comment.createdBy.avatar}
                              alt={comment.createdBy.name}
                            />
                          ) : (
                            <AvatarFallback className="bg-pink-900/50 text-pink-200">
                              {getInitials(comment.createdBy.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-slate-200">
                              {comment.createdBy.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {comment.createdBy.role}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 mt-0.5">
                            <div className="flex items-center text-xs text-slate-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {formatDate(comment.createdAt)}
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-${getCategoryColor(
                                comment.category
                              )}-400 border-${getCategoryColor(
                                comment.category
                              )}-500/30 bg-${getCategoryColor(
                                comment.category
                              )}-500/10 text-[10px] px-1.5 py-0`}
                            >
                              {getCategoryName(comment.category)}
                            </Badge>
                            {comment.isInternal ? (
                              <Badge
                                variant="outline"
                                className="bg-slate-700/50 text-slate-300 border-slate-600 text-[10px] px-1.5 py-0"
                              >
                                Internal
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px] px-1.5 py-0"
                              >
                                External
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full text-slate-500 hover:text-pink-400 hover:bg-pink-500/10"
                        onClick={() => handleTogglePin(comment.id)}
                      >
                        {comment.isPinned ? (
                          <Pin className="h-3.5 w-3.5 text-pink-400" />
                        ) : (
                          <PinOff className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                    <p className="text-sm text-slate-300 whitespace-pre-line">
                      {comment.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <AlertCircle className="h-8 w-8 text-slate-600 mb-2" />
                <h3 className="text-sm font-medium text-slate-400">
                  No comments found
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {searchQuery || categoryFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Be the first to add a comment to this account"}
                </p>
              </div>
            )}
          </div>

          <div className="p-6 pt-4 border-t border-slate-800 bg-slate-900 flex-shrink-0">
            <div className="space-y-4">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment about this account..."
                className="bg-slate-800/60 border-slate-700 text-slate-300 resize-none h-20"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select
                    value={commentCategory}
                    onValueChange={setCommentCategory}
                  >
                    <SelectTrigger className="w-[140px] bg-slate-800/60 border-slate-700 text-slate-300 h-9">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-slate-300">
                      {commentCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="flex items-center space-x-2">
                    <Label
                      htmlFor="comment-visibility"
                      className="text-xs text-slate-400"
                    >
                      Internal only
                    </Label>
                    <input
                      type="checkbox"
                      id="comment-visibility"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-slate-700 text-pink-500 focus:ring-pink-500 bg-slate-800"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-transparent"></div>
                      Adding...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Add Comment
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
