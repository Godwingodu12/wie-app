"use client";
import React from "react";
import { X } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import PostCard from "./PostCard";
import type { Post } from "@/types/post";

interface PostDetailModalProps {
  post:            Post;
  onClose:         () => void;
  isOwnProfile?:   boolean;
  currentUserId?:  string;
  onDelete?:       (id: string) => void;
  onPostUpdated?:  (updated: Post) => void;
}

export default function PostDetailModal({
  post,
  onClose,
  isOwnProfile = false,
  currentUserId,
  onDelete,
  onPostUpdated,
}: PostDetailModalProps) {
  const { themeStyles } = useTheme();

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Card */}
        <div
          className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl scrollbar-hide"
          style={{ background: themeStyles.background }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close row */}
          <div className="flex justify-end px-3 pt-3">
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full transition-opacity hover:opacity-70"
              style={{ background: themeStyles.pillBg, color: themeStyles.textSecondary }}
            >
              <X size={16} />
            </button>
          </div>

          <PostCard
            post={post}
            currentUserId={currentUserId}
            onDelete={(id) => {
              onDelete?.(id);
              onClose();
            }}
            onPostUpdated={onPostUpdated}
          />
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </>
  );
}