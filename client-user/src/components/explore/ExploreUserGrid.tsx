"use client";
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { UserPlus, UserCheck, Clock, Loader2 } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import { User } from "@/types";
import DefaultAvatar from "@/assets/Home/Ellipse 14.png";

interface FollowStatus { isFollowing: boolean; isPending: boolean; }
interface Props {
  users: User[];
  loading: boolean;
  followStatus: Record<string, FollowStatus>;
  followLoading: Record<string, boolean>;
  onFollowToggle: (userId: string, isPrivate: boolean) => void;
}

export default function ExploreUserGrid({ users, loading, followStatus, followLoading, onFollowToggle }: Props) {
  const { themeStyles } = useTheme();
  const router = useRouter();

  if (loading) return (
    <div className="space-y-2">
      {Array(5).fill(null).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-2xl animate-pulse" style={{ background: themeStyles.cardBg }}>
          <div className="w-12 h-12 rounded-full flex-shrink-0" style={{ background: themeStyles.pillBg }} />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3 w-28 rounded-full" style={{ background: themeStyles.pillBg }} />
            <div className="h-2.5 w-20 rounded-full" style={{ background: themeStyles.pillBg }} />
          </div>
          <div className="w-20 h-8 rounded-full" style={{ background: themeStyles.pillBg }} />
        </div>
      ))}
    </div>
  );

  if (users.length === 0) return (
    <div className="flex flex-col items-center py-16 gap-3">
      <span className="text-5xl">👥</span>
      <p className="text-sm" style={{ color: themeStyles.textSecondary }}>No users found</p>
    </div>
  );

  return (
    <div className="space-y-2">
      {users.map(user => {
        const s = followStatus[user.id];
        const busy = followLoading[user.id];
        return (
          <div key={user.id} className="flex items-center gap-3 p-3 rounded-2xl transition-all" style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
            <button className="relative w-11 h-11 rounded-full overflow-hidden flex-shrink-0" onClick={() => router.push(`/profile/${user.id}`)}>
              <Image src={user.profile_picture ?? DefaultAvatar} alt="" fill className="object-cover" unoptimized={!!user.profile_picture} />
            </button>
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => router.push(`/profile/${user.id}`)}>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold truncate" style={{ color: themeStyles.text }}>{user.name ?? user.username ?? "User"}</p>
                {user.is_verified && (
                  <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                  </svg>
                )}
              </div>
              {user.username && <p className="text-xs truncate" style={{ color: themeStyles.textSecondary }}>@{user.username}</p>}
            </div>
            <button
              onClick={() => onFollowToggle(user.id, user.accountPrivacy === "private")}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex-shrink-0 disabled:opacity-50"
              style={s?.isFollowing || s?.isPending
                ? { background: themeStyles.pillBg, color: themeStyles.text, border: `1px solid ${themeStyles.border}` }
                : { background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)", color: "#fff" }}
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : s?.isFollowing ? <><UserCheck size={12} /><span>Following</span></> : s?.isPending ? <><Clock size={12} /><span>Requested</span></> : <><UserPlus size={12} /><span>Follow</span></>}
            </button>
          </div>
        );
      })}
    </div>
  );
}