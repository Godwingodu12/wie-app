"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, Images, Play } from "lucide-react";
import cameraImg from "@/assets/profile/camera.png";
import { getUserPosts } from "@/services/postService";
import type { Post } from "@/types/post";
import PostDetailModal from "@/components/post/PostDetailModal";

interface PostsTabProps {
  userId:       string;
  isMobile:     boolean;
  isReels?:     boolean;
  isOwnProfile?: boolean;
  currentUserId?: string;
}

export default function PostsTab({
  userId,
  isMobile,
  isReels      = false,
  isOwnProfile = false,
  currentUserId,
}: PostsTabProps) {
  const router            = useRouter();
  const [posts,    setPosts]    = useState<Post[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [hasMore,  setHasMore]  = useState(true);
  const [selected, setSelected] = useState<Post | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await getUserPosts(userId, 1, 30);

        if (cancelled) return;

        // Filter: isReels → only posts whose first media is video
        //         posts   → everything (images + mixed carousels)
        const filtered = isReels
          ? res.data.filter((p) => p.mediaItems?.[0]?.type === "video")
          : res.data;

        setPosts(filtered);
        setHasMore(res.pagination.hasMore);
        setPage(1);
      } catch (err) {
        console.error("PostsTab fetch failed:", err);
        if (!cancelled) setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetch();
    return () => { cancelled = true; };
  }, [userId, isReels]);

  const loadMore = async () => {
    const next = page + 1;
    try {
      const res = await getUserPosts(userId, next, 30);
      const filtered = isReels
        ? res.data.filter((p) => p.mediaItems?.[0]?.type === "video")
        : res.data;
      setPosts((prev) => [...prev, ...filtered]);
      setHasMore(res.pagination.hasMore);
      setPage(next);
    } catch { /* silently fail */ }
  };

  const handleDelete = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
    setSelected(null);
  };

  // ── Loading skeleton ─────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-0.5">
        {Array(9).fill(null).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse bg-[#1a1a1a]" />
        ))}
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="mb-0 opacity-100" style={{ width: 300, height: 273 }}>
          <Image src={cameraImg} alt="Camera" className="w-full h-full object-contain" />
        </div>
        <h3 className="text-white text-xl font-bold mb-4 -mt-10">
          {isReels ? "No Reels Yet!" : "No Posts Yet!"}
        </h3>
        {isOwnProfile && (
          <button
            onClick={() => router.push("/post/add-post")}
            className="px-10 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95"
            style={{
              background:
                "linear-gradient(349.06deg,#8E74E1 4.79%,#6E53D1 49.49%,#4D439B 88.77%)",
            }}
          >
            Create Post
          </button>
        )}
      </div>
    );
  }

  // ── Grid ─────────────────────────────────────────────────
  return (
    <>
      <div className="grid grid-cols-3 gap-0.5">
        {posts.map((post) => {
          const first = post.mediaItems?.[0];
          return (
            <button
              key={post._id}
              className="relative aspect-square overflow-hidden group cursor-pointer"
              onClick={() => setSelected(post)}
            >
              {/* Thumbnail */}
              {first?.type === "video" ? (
                <video
                  src={first.url}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  muted playsInline
                />
              ) : first?.url ? (
                <Image
                  src={first.url}
                  alt="Post"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 33vw, 200px"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-[#1a1a1a]" />
              )}

              {/* Badges */}
              <div className="absolute top-1.5 right-1.5 flex gap-1">
                {(post.mediaItems?.length ?? 0) > 1 && (
                  <div className="w-5 h-5 rounded bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <Images size={11} className="text-white" />
                  </div>
                )}
                {first?.type === "video" && (post.mediaItems?.length ?? 0) === 1 && (
                  <div className="w-5 h-5 rounded bg-black/60 backdrop-blur-sm flex items-center justify-center">
                    <Play size={11} className="text-white fill-white" />
                  </div>
                )}
              </div>

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <span className="text-white text-sm font-bold">
                  ❤️ {post.likeCount ?? (post as any).likes?.length ?? 0}
                </span>
                <span className="text-white text-sm font-bold">
                  💬 {post.commentCount ?? (post as any).comments?.length ?? 0}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center py-4">
          <button
            onClick={loadMore}
            className="px-6 py-2 rounded-full text-white text-sm font-medium"
            style={{
              background:
                "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)",
            }}
          >
            Load more
          </button>
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <PostDetailModal
          post={selected}
          onClose={() => setSelected(null)}
          isOwnProfile={isOwnProfile}
          currentUserId={currentUserId}
          onDelete={handleDelete}
          onPostUpdated={(updated) =>
            setPosts((prev) =>
              prev.map((p) => (p._id === updated._id ? updated : p)),
            )
          }
        />
      )}
    </>
  );
}
