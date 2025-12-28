"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import cameraImg from "@/assets/profile/camera.png";

interface Post {
  id: string;
  image_url: string;
  caption?: string;
  likes_count: number;
  comments_count: number;
}

interface PostsTabProps {
  userId: string;
  isMobile: boolean;
  isReels?: boolean;
}

export default function PostsTab({ userId, isMobile, isReels = false }: PostsTabProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/posts?userId=${userId}&type=${isReels ? 'reels' : 'posts'}`);
        // const data = await response.json();
        // setPosts(data);
        
        // Mock data for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        setPosts([]);
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId, isReels]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10">
        <div className="mb-0 opacity-100" style={{ width: '300px', height: '273px' }}>
          <Image src={cameraImg} alt="Camera" className="w-full h-full object-contain" />
        </div>
        <h3 className="text-white text-xl font-bold mb-4 -mt-10">
          {isReels ? 'No Reels Yet!' : 'No Posts Yet!'}
        </h3>
        <button
          className="px-10 py-2.5 rounded-full text-white text-sm font-medium transition-all hover:opacity-90"
          style={{
            background: 'linear-gradient(349.06deg, #8E74E1 4.79%, #6E53D1 49.49%, #4D439B 88.77%)'
          }}
        >
          Create
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 md:gap-2">
      {posts.map((post) => (
        <div
          key={post.id}
          className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg"
        >
          <Image
            src={post.image_url}
            alt="Post"
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <span className="text-white text-sm font-medium">❤️ {post.likes_count}</span>
            <span className="text-white text-sm font-medium">💬 {post.comments_count}</span>
          </div>
        </div>
      ))}
    </div>
  );
}