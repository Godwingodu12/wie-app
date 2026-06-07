"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Play, Calendar, Users, Loader2 } from "lucide-react";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from "@/components/home/ThemeContext";
import { searchUsers } from "@/services/wieUserService";
import {
  followUser, unfollowUser,
  getDetailedFollowStatus, cancelFollowRequest,
} from "@/services/followService";
import { getExplorePosts, getReelsFeed } from "@/services/postService";
import { searchEventsByName, getLiveEvents } from "@/services/ticketUserService";
import type { Post } from "@/types/post";
import { User } from "@/types";

import ExploreAllTab    from "@/components/explore/ExploreAllTab";
import ExploreReelGrid  from "@/components/explore/ExploreReelGrid";
import ExploreEventGrid from "@/components/explore/ExploreEventGrid";
import ExploreUserGrid  from "@/components/explore/ExploreUserGrid";

type Tab = "all" | "reels" | "events" | "people";
interface FollowStatus {
  isFollowing: boolean;
  isPending:   boolean;
  status:      "active" | "pending" | "none";
}

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "all",    label: "All",    icon: null },
  { id: "reels",  label: "Reels",  icon: <Play     size={13} className="fill-current" /> },
  { id: "events", label: "Events", icon: <Calendar size={13} /> },
  { id: "people", label: "People", icon: <Users    size={13} /> },
];

export default function ExplorePage() {
  const { isMobile, isCollapsed } = useSidebar();
  const { themeStyles, isDark }   = useTheme();

  const [tab,         setTab]         = useState<Tab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQ,  setDebouncedQ]  = useState("");
  const searchTimer                   = useRef<ReturnType<typeof setTimeout>>();

  // ── Browse posts & reels
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [reels,        setReels]        = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [postsPage,    setPostsPage]    = useState(1);
  const [postsMore,    setPostsMore]    = useState(true);

  // ── Browse events
  const [browseEvents,  setBrowseEvents]  = useState<any[]>([]);
  const [liveEvents,    setLiveEvents]    = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(false);
  const eventsLoaded                      = useRef(false);

  // ── Universal search results
  const [searchPeople,  setSearchPeople]  = useState<User[]>([]);
  const [searchEvents,  setSearchEvents]  = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── Follow state (shared for both browse & search)
  const [followStatus,  setFollowStatus]  = useState<Record<string, FollowStatus>>({});
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  const isSearching  = debouncedQ.trim().length > 0;
  const marginLeft   = isMobile ? "0" : (isCollapsed ? "80px" : "281px");

  // ── Debounce 
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedQ(searchQuery), 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchQuery]);

useEffect(() => {
  let cancelled = false;
  (async () => {
    setPostsLoading(true);
    setReelsLoading(true);
    try {
      const [postsResult, reelsResult] = await Promise.allSettled([
        getExplorePosts(1, 50),   // fetch more to account for filtering
        getReelsFeed(1, 30),
      ]);

      if (cancelled) return;

      if (postsResult.status === "fulfilled") {
        // Only show non-reel content in the post grid
        const onlyPosts = (postsResult.value.data ?? []).filter(
          (p: any) => (p.contentType ?? "post") !== "reel",
        );
        setPosts(onlyPosts);
        setPostsMore(postsResult.value.pagination?.hasMore ?? false);
      } else {
        console.error("[Explore] Posts fetch failed:", postsResult.reason);
      }

      if (reelsResult.status === "fulfilled") {
        const reelsData = reelsResult.value.data ?? [];
        console.log(`[Explore] Loaded ${reelsData.length} reels`);
        setReels(reelsData);
      } else {
        console.error("[Explore] Reels fetch failed:", reelsResult.reason);
      }
    } finally {
      if (!cancelled) {
        setPostsLoading(false);
        setReelsLoading(false);
      }
    }
  })();
  return () => { cancelled = true; };
}, []);

  // ── Load browse events (for all/events tab, not while searching) ──
  useEffect(() => {
    if (isSearching) return;
    if (tab !== "events" && tab !== "all") return;
    if (eventsLoaded.current && tab === "all") return;
    (async () => {
      setEventsLoading(true);
      try {
        // Only call getLiveEvents for browse — searchEventsByName needs a non-empty query
        const liveRes = await getLiveEvents().catch(() => null);
        if (liveRes) {
          const tickets = liveRes?.data?.tickets ?? [];
          setLiveEvents(tickets);
          // Use live events as the browse list too
          setBrowseEvents(tickets);
        }
        eventsLoaded.current = true;
      } catch { /* silently fail */ }
      finally { setEventsLoading(false); }
    })();
  }, [tab, isSearching]);

  // ── UNIVERSAL SEARCH — fires whenever debouncedQ changes ──────────
  // Searches BOTH people AND events regardless of which tab is active.
  useEffect(() => {
    if (!debouncedQ.trim()) {
      setSearchPeople([]);
      setSearchEvents([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setSearchLoading(true);
      try {
        const [uRes, eRes] = await Promise.allSettled([
          searchUsers(debouncedQ, 1, 15),
          searchEventsByName({ searchQuery: debouncedQ }),
        ]);

        if (cancelled) return;
        // ── People
        if (uRes.status === "fulfilled") {
          const found: User[] = uRes.value.users ?? [];
          setSearchPeople(found);
          // Fetch follow status for found users
          const checks = await Promise.all(
            found.map(async (u) => {
              try {
                const s = await getDetailedFollowStatus(u.id);
                return {
                  id: u.id,
                  status: {
                    isFollowing: s.isFollowing,
                    isPending:   s.isPending,
                    status:      s.status as "active" | "pending" | "none",
                  },
                };
              } catch {
                return { id: u.id, status: { isFollowing: false, isPending: false, status: "none" as const } };
              }
            }),
          );
          if (!cancelled) {
            const map: Record<string, FollowStatus> = {};
            checks.forEach((c) => { map[c.id] = c.status; });
            setFollowStatus((prev) => ({ ...prev, ...map }));
          }
        }

        // ── Events (deduplicated)
        if (eRes.status === "fulfilled") {
          const byCategory = eRes.value?.data?.eventsByCategory ?? {};
          const flat       = Object.values(byCategory).flat() as any[];
          const seen       = new Set<string>();
          const unique     = flat.filter((e) => {
            if (!e._id || seen.has(e._id)) return false;
            seen.add(e._id);
            return true;
          });
          if (!cancelled) setSearchEvents(unique);
        }
      } catch { /* silently fail */ }
      finally { if (!cancelled) setSearchLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [debouncedQ]);

  const loadMorePosts = async () => {
    const next = postsPage + 1;
    setPostsPage(next);
    try {
      const res = await getExplorePosts(next, 50);
      const onlyPosts = (res.data ?? []).filter(
        (p: any) => (p.contentType ?? "post") !== "reel",
      );
      setPosts((prev) => [...prev, ...onlyPosts]);
      setPostsMore(res.pagination?.hasMore ?? false);
    } catch (err) {
      console.error("[Explore] loadMorePosts failed:", err);
    }
  };

  // Follow toggle
  const handleFollowToggle = useCallback(
    async (userId: string, isPrivate: boolean) => {
      setFollowLoading((p) => ({ ...p, [userId]: true }));
      try {
        const cur = followStatus[userId];
        if (cur?.isFollowing) {
          await unfollowUser(userId);
          setFollowStatus((p) => ({ ...p, [userId]: { isFollowing: false, isPending: false, status: "none" } }));
        } else if (cur?.isPending) {
          await cancelFollowRequest(userId);
          setFollowStatus((p) => ({ ...p, [userId]: { isFollowing: false, isPending: false, status: "none" } }));
        } else {
          const r = await followUser(userId);
          if (r.status === "pending") {
            setFollowStatus((p) => ({ ...p, [userId]: { isFollowing: false, isPending: true, status: "pending" } }));
          } else {
            setFollowStatus((p) => ({ ...p, [userId]: { isFollowing: true, isPending: false, status: "active" } }));
          }
        }
      } catch { /* silently fail */ }
      finally { setFollowLoading((p) => ({ ...p, [userId]: false })); }
    },
    [followStatus],
  );

  // ── Deduplicated browse events ─────────────────────────
  const allBrowseEvents = (() => {
    const seen = new Set<string>();
    return [
      ...liveEvents.map((e) => ({ ...e, isLive: true })),
      ...browseEvents,
    ].filter((e) => {
      if (!e._id || seen.has(e._id)) return false;
      seen.add(e._id);
      return true;
    });
  })();

  // ─────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: themeStyles.background }}>
      <SideBar />

      <main
        className={`transition-all duration-300 ${isMobile ? "pb-24" : ""}`}
        style={{ marginLeft }}
      >
        <div className="max-w-2xl lg:max-w-5xl mx-auto px-3 sm:px-5 pt-4 pb-10">

          {/* ── Sticky search + tabs ─────────────────────── */}
          <div
            className="sticky top-0 z-40 pb-3 pt-2"
            style={{ background: themeStyles.background }}
          >
            {/* Search bar */}
            <div className="relative mb-3">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: themeStyles.textSecondary }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search people, events, posts…"
                className="w-full pl-11 pr-10 py-3 rounded-2xl outline-none text-sm"
                style={{
                  background: isDark ? "rgba(255,255,255,0.07)" : themeStyles.cardBg,
                  border:     `1px solid ${themeStyles.border}`,
                  color:      themeStyles.text,
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(""); setDebouncedQ(""); }}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: themeStyles.textSecondary }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Tab pills — still visible but inactive when searching */}
            <div className="flex items-center gap-2 overflow-x-auto" style={{ scrollbarWidth: "none" }}>
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTab(t.id);
                    // Clearing search when switching to non-search tabs
                    if (t.id !== "people" && t.id !== "events") setSearchQuery("");
                  }}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold transition-all flex-shrink-0"
                  style={
                    tab === t.id && !isSearching
                      ? {
                          background: "linear-gradient(147.67deg,#2979FF 13%,#6B9CF0 54%,#9DC1FF 100%)",
                          color:      "#fff",
                          boxShadow:  "0 2px 12px rgba(41,121,255,0.3)",
                        }
                      : {
                          background: isDark ? "rgba(255,255,255,0.07)" : themeStyles.cardBg,
                          color:      themeStyles.text,
                          border:     `1px solid ${themeStyles.border}`,
                          opacity:    isSearching ? 0.5 : 1,
                        }
                  }
                >
                  {t.icon}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════
              SEARCH RESULTS — shows when typing anything
              (both people + events, no tab switching needed)
              ═══════════════════════════════════════════════ */}
          {isSearching ? (
            <div className="flex flex-col gap-6 pt-1">
              {/* Loading spinner */}
              {searchLoading && (
                <div className="flex justify-center py-10">
                  <Loader2 size={28} className="animate-spin text-[#8860D9]" />
                </div>
              )}

              {/* Empty state */}
              {!searchLoading && searchPeople.length === 0 && searchEvents.length === 0 && (
                <div className="flex flex-col items-center py-16 gap-3">
                  <span className="text-5xl">🔍</span>
                  <p className="text-sm font-medium" style={{ color: themeStyles.textSecondary }}>
                    No results for "{debouncedQ}"
                  </p>
                </div>
              )}

              {/* ── People results ── */}
              {!searchLoading && searchPeople.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={15} style={{ color: "#8860D9" }} />
                    <h3 className="text-sm font-bold" style={{ color: themeStyles.text }}>
                      People
                    </h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: themeStyles.pillBg, color: themeStyles.textSecondary }}
                    >
                      {searchPeople.length}
                    </span>
                  </div>
                  <ExploreUserGrid
                    users={searchPeople}
                    loading={false}
                    followStatus={followStatus}
                    followLoading={followLoading}
                    onFollowToggle={handleFollowToggle}
                  />
                </section>
              )}

              {/* ── Event results ── */}
              {!searchLoading && searchEvents.length > 0 && (
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Calendar size={15} style={{ color: "#8860D9" }} />
                    <h3 className="text-sm font-bold" style={{ color: themeStyles.text }}>
                      Events
                    </h3>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: themeStyles.pillBg, color: themeStyles.textSecondary }}
                    >
                      {searchEvents.length}
                    </span>
                  </div>
                  <ExploreEventGrid events={searchEvents} loading={false} />
                </section>
              )}
            </div>
          ) : (
            <>
              {tab === "all" && (
                <ExploreAllTab
                  posts={posts}
                  reels={reels}
                  events={browseEvents}
                  liveEvents={liveEvents}
                  postsLoading={postsLoading}
                  reelsLoading={reelsLoading}
                  eventsLoading={eventsLoading}
                  onLoadMore={loadMorePosts}
                  postsHasMore={postsMore}
                />
              )}

              {tab === "reels" && (
                <ExploreReelGrid reels={reels} loading={reelsLoading} />
              )}

              {tab === "events" && (
                <ExploreEventGrid events={allBrowseEvents} loading={eventsLoading} />
              )}

              {tab === "people" && (
                <div className="flex flex-col items-center py-20 gap-3">
                  <Search size={44} style={{ color: themeStyles.textSecondary }} />
                  <p className="text-sm font-medium" style={{ color: themeStyles.textSecondary }}>
                    Type a name in the search bar to find people
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
