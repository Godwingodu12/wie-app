"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Play, Calendar, Users } from "lucide-react";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/components/home/ThemeContext";
import { searchUsers } from "@/services/wieUserService";
import { followUser, unfollowUser, getDetailedFollowStatus, cancelFollowRequest } from "@/services/followService";
import { getExplorePosts } from "@/services/postService";
import { searchEventsByName, getLiveEvents } from "@/services/ticketUserService";
import type { Post } from "@/types/post";
import { User } from "@/types";

import ExploreAllTab    from "@/components/explore/ExploreAllTab";
import ExploreReelGrid  from "@/components/explore/ExploreReelGrid";
import ExploreEventGrid from "@/components/explore/ExploreEventGrid";
import ExploreUserGrid  from "@/components/explore/ExploreUserGrid";

type Tab = "all" | "reels" | "events" | "people";
interface FollowStatus { isFollowing: boolean; isPending: boolean; status: "active" | "pending" | "none"; }

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "all",    label: "All",    icon: null },
  { id: "reels",  label: "Reels",  icon: <Play size={13} className="fill-current" /> },
  { id: "events", label: "Events", icon: <Calendar size={13} /> },
  { id: "people", label: "People", icon: <Users size={13} /> },
];

export default function ExplorePage() {
  const { isMobile, isCollapsed } = useSidebar();
  const { themeStyles, isDark }   = useTheme();

  const [tab,         setTab]         = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQ,  setDebouncedQ]  = useState("");
  const searchTimer                   = useRef<ReturnType<typeof setTimeout>>();

  // Posts & reels
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [reels,        setReels]        = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [postsPage,    setPostsPage]    = useState(1);
  const [postsMore,    setPostsMore]    = useState(true);

  // Events
  const [events,        setEvents]        = useState<any[]>([]);
  const [liveEvents,    setLiveEvents]    = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const eventsLoaded                      = useRef(false);

  // People
  const [users,         setUsers]         = useState<User[]>([]);
  const [usersLoading,  setUsersLoading]  = useState(false);
  const [followStatus,  setFollowStatus]  = useState<Record<string, FollowStatus>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});
  const [usersPage,     setUsersPage]     = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);

  const marginLeft = isMobile ? "0" : (isCollapsed ? "80px" : "281px");

  // Debounce
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedQ(searchQuery), 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

  // Load posts once
  useEffect(() => {
    (async () => {
      setPostsLoading(true);
      setReelsLoading(true);
      try {
        const res = await getExplorePosts(1, 50);
        const all = res.data ?? [];
        setPosts(all.filter((p: Post) => !(p.mediaItems?.every(m => m.type === "video"))));
        setReels(all.filter((p: Post) => p.mediaItems?.some(m => m.type === "video")));
        setPostsMore(res.pagination?.hasMore ?? false);
      } catch {}
      finally { setPostsLoading(false); setReelsLoading(false); }
    })();
  }, []);

  // Load events once (for all tab) or on events tab
  useEffect(() => {
    if (tab !== "events" && tab !== "all") return;
    if (eventsLoaded.current && tab === "all") return;
    (async () => {
      setEventsLoading(true);
      try {
        const [evRes, liveRes] = await Promise.allSettled([
          searchEventsByName({ searchQuery: debouncedQ || "" }),
          getLiveEvents(),
        ]);
        if (evRes.status === "fulfilled") {
          const byCategory = evRes.value?.data?.eventsByCategory ?? {};
          setEvents(Object.values(byCategory).flat());
        }
        if (liveRes.status === "fulfilled") {
          setLiveEvents(liveRes.value?.data?.tickets ?? []);
        }
        eventsLoaded.current = true;
      } catch {}
      finally { setEventsLoading(false); }
    })();
  }, [tab, debouncedQ]);

  // People search
  useEffect(() => {
    if (tab !== "people") return;
    if (!debouncedQ.trim()) { setUsers([]); return; }
    (async () => {
      setUsersLoading(true);
      try {
        const res = await searchUsers(debouncedQ, usersPage, 20);
        setUsers(res.users ?? []);
        setUsersTotalPages(res.totalPages ?? 1);
        const checks = await Promise.all(
          (res.users ?? []).map(async (u: User) => {
            try { const s = await getDetailedFollowStatus(u.id); return { id: u.id, status: { isFollowing: s.isFollowing, isPending: s.isPending, status: s.status } }; }
            catch { return { id: u.id, status: { isFollowing: false, isPending: false, status: "none" as const } }; }
          })
        );
        const map: Record<string, FollowStatus> = {};
        checks.forEach(c => { map[c.id] = c.status; });
        setFollowStatus(map);
      } catch {}
      finally { setUsersLoading(false); }
    })();
  }, [tab, debouncedQ, usersPage]);

  const loadMorePosts = async () => {
    const next = postsPage + 1;
    setPostsPage(next);
    try {
      const res = await getExplorePosts(next, 50);
      const all = res.data ?? [];
      setPosts(prev => [...prev, ...all.filter((p: Post) => !(p.mediaItems?.every(m => m.type === "video")))]);
      setReels(prev => [...prev, ...all.filter((p: Post) => p.mediaItems?.some(m => m.type === "video"))]);
      setPostsMore(res.pagination?.hasMore ?? false);
    } catch {}
  };

  const handleFollowToggle = useCallback(async (userId: string, isPrivate: boolean) => {
    setFollowLoading(p => ({ ...p, [userId]: true }));
    try {
      const cur = followStatus[userId];
      if (cur?.isFollowing) { await unfollowUser(userId); setFollowStatus(p => ({ ...p, [userId]: { isFollowing: false, isPending: false, status: "none" } })); }
      else if (cur?.isPending) { await cancelFollowRequest(userId); setFollowStatus(p => ({ ...p, [userId]: { isFollowing: false, isPending: false, status: "none" } })); }
      else {
        const r = await followUser(userId);
        if (r.status === "pending") { setFollowStatus(p => ({ ...p, [userId]: { isFollowing: false, isPending: true, status: "pending" } })); }
        else { setFollowStatus(p => ({ ...p, [userId]: { isFollowing: true, isPending: false, status: "active" } })); }
      }
    } catch {}
    finally { setFollowLoading(p => ({ ...p, [userId]: false })); }
  }, [followStatus]);

  const showSearch = tab === "people" || tab === "events";
  const allEvents  = [...liveEvents.map(e => ({ ...e, isLive: true })), ...events];

  return (
    <div className="min-h-screen" style={{ background: themeStyles.background }}>
      <SideBar />

      <main
        className={`transition-all duration-300 ${isMobile ? "pb-24" : ""}`}
        style={{ marginLeft }}
      >
        <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 sm:px-5 pt-4 pb-10">

          {/* ── Sticky search + tabs header ── */}
          <div
            className="sticky top-0 z-40 pb-3 pt-2"
            style={{ background: themeStyles.background }}
          >
            {/* Search bar */}
            <div className="relative mb-3">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: themeStyles.textSecondary }} />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search events, people, posts..."
                className="w-full pl-11 pr-10 py-3 rounded-2xl outline-none text-sm"
                style={{
                  background: isDark ? "rgba(255,255,255,0.07)" : themeStyles.cardBg,
                  border: `1px solid ${themeStyles.border}`,
                  color: themeStyles.text,
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: themeStyles.textSecondary }}>
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Tab pills */}
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); if (t.id !== "people" && t.id !== "events") setSearchQuery(""); }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex-shrink-0"
                  style={
                    tab === t.id
                      ? { background: "linear-gradient(147.67deg,#2979FF 13.16%,#6B9CF0 54.09%,#9DC1FF 100.03%)", color: "#fff", boxShadow: "0 2px 12px rgba(41,121,255,0.3)" }
                      : { background: isDark ? "rgba(255,255,255,0.07)" : themeStyles.cardBg, color: themeStyles.text, border: `1px solid ${themeStyles.border}` }
                  }
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Tab content ── */}
          {tab === "all" && (
            <ExploreAllTab
              posts={posts} reels={reels}
              events={events} liveEvents={liveEvents}
              postsLoading={postsLoading} reelsLoading={reelsLoading}
              eventsLoading={eventsLoading}
              onLoadMore={loadMorePosts}
              postsHasMore={postsMore}
            />
          )}

          {tab === "reels" && (
            <ExploreReelGrid reels={reels} loading={reelsLoading} />
          )}

          {tab === "events" && (
            <ExploreEventGrid events={allEvents} loading={eventsLoading} />
          )}

          {tab === "people" && (
            <>
              {!debouncedQ.trim() ? (
                <div className="flex flex-col items-center py-20 gap-3">
                  <Search size={44} style={{ color: themeStyles.textSecondary }} />
                  <p className="text-sm" style={{ color: themeStyles.textSecondary }}>Search for people to connect with</p>
                </div>
              ) : (
                <>
                  <ExploreUserGrid
                    users={users} loading={usersLoading}
                    followStatus={followStatus} followLoading={followLoading}
                    onFollowToggle={handleFollowToggle}
                  />
                  {usersTotalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-5">
                      <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1}
                        className="px-4 py-2 rounded-xl text-sm disabled:opacity-40"
                        style={{ background: themeStyles.cardBg, color: themeStyles.text, border: `1px solid ${themeStyles.border}` }}>
                        Prev
                      </button>
                      <span className="text-sm" style={{ color: themeStyles.textSecondary }}>{usersPage}/{usersTotalPages}</span>
                      <button onClick={() => setUsersPage(p => Math.min(usersTotalPages, p + 1))} disabled={usersPage === usersTotalPages}
                        className="px-4 py-2 rounded-xl text-sm disabled:opacity-40"
                        style={{ background: themeStyles.cardBg, color: themeStyles.text, border: `1px solid ${themeStyles.border}` }}>
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
