"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getProfile } from "@/services/wieUserService";
// Assets
import UserDemoIcon    from "@/assets/Home/UserDemoIcon.svg";
import DummyPost       from "@/assets/Home/dummypost.png";
import QrCode          from "@/assets/Home/QrCode.png";
import ProfileImage    from "@/assets/profile/ProfileImage.jpg";
// Media service
import {
  getFluxFeed, getMyFluxes, viewFlux, invalidateFluxFeedCache,
} from "@/services/mediaService";
import type { FeedFluxGroup, Flux } from "@/services/mediaService";
// Post service
import { getPostFeed } from "@/services/postService";
import PostCard from "@/components/post/PostCard";
import type { Post }   from "@/types/post";
import {
  ChevronLeft, ChevronRight, Play, MapPin, Calendar, Heart as HeartOutline,
} from "lucide-react";
// Layout
import SideBar          from "@/components/home/SideBar";
import { useSidebar }   from "@/context/SidebarContext";
import { useTheme }     from "@/components/home/ThemeContext";
import HomeSkeleton     from "@/components/home/HomeSkeleton";
import EventCategoryList from "@/components/events/Eventcategorylist";
import { UsernameSave } from '@/components/home/UsernameSave';
import { useSelector } from 'react-redux';
import { RootState } from '@/features/store';
// ── Static mock data (kept for sidebar widgets) 
const suggestedProfiles = [
  { id: 1, name: "san_geeth__palliyal", handle: "follows you" },
  { id: 2, name: "san_geeth__palliyal", handle: "follows you" },
  { id: 3, name: "san_geeth__palliyal", handle: "follows you" },
  { id: 4, name: "san_geeth__palliyal", handle: "follows you" },
];

const popularEvents = [
  { title: "A Study of Great Artists", date: "25 January 2025", location: "Malappuram", image: DummyPost },
  { title: "A Study of Great Artists", date: "25 January 2025", location: "Malappuram", image: DummyPost },
  { title: "A Study of Great Artists", date: "25 January 2025", location: "Malappuram", image: DummyPost },
  { title: "A Study of Great Artists", date: "25 January 2025", location: "Malappuram", image: DummyPost },
];

const suggestedReels = [1, 2, 3, 4, 5, 6];

// Component
export default function HomePage() {
  const { isCollapsed, isMobile } = useSidebar();
  const { themeStyles, isDark }   = useTheme();
  const router                    = useRouter();
  const storiesRef                = useRef<HTMLDivElement>(null);
  // Username modal 
  const authUser = useSelector((state: RootState) => state.auth.user);
  const [showUsernameModal, setShowUsernameModal] = useState(false);

  // Profile 
  const [userProfile, setUserProfile] = useState<any>(null);
  // Flux
  const [myFluxes,   setMyFluxes]   = useState<Flux[]>([]);
  const [feedGroups, setFeedGroups] = useState<FeedFluxGroup[]>([]);
  const [fluxLoading, setFluxLoading] = useState(true);

  // Posts
  const [posts,        setPosts]        = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsPage,    setPostsPage]    = useState(1);
  const [postsHasMore, setPostsHasMore] = useState(true);

  // Viewed flux IDs (persisted) 
  const [viewedFluxIds, setViewedFluxIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("viewedFluxIds");
      const parsed: string[] = stored ? JSON.parse(stored) : [];
      return new Set<string>(parsed.filter((id): id is string => typeof id === "string"));
    } catch {
      return new Set<string>();
    }
  });

  const marginLeft = isMobile ? "0" : "281px";
  const loadMorePosts = async () => {
    const next = postsPage + 1;
    setPostsPage(next);
    try {
      const res = await getPostFeed(next, 50);
      setPosts((prev) => [...prev, ...res.data]);
      setPostsHasMore(res.pagination.hasMore);
    } catch (e) {
      console.error("loadMorePosts failed:", e);
    }
  };

// Show username modal if user has no username yet
  useEffect(() => {
    if (authUser && !authUser.username) {
      setShowUsernameModal(true);
    }
  }, [authUser]);
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getProfile();
        setUserProfile(profile);
        // Also check from fetched profile (handles page refresh)
        if (!profile?.username) {
          setShowUsernameModal(true);
        }
      } catch (e) {
        console.error("Error fetching profile:", e);
      }
    };

    const fetchFluxes = async () => {
      try {
        const [mine, feed] = await Promise.all([getMyFluxes(), getFluxFeed()]);
        setMyFluxes(mine);

        const activeFeed = feed.filter((g) => !g.isSelf && g.fluxes.length > 0);
        setFeedGroups(activeFeed);

        // Prune stale viewed IDs
        const activeIds = new Set<string>([
          ...mine.map((f: Flux) => f._id),
          ...feed.flatMap((g: FeedFluxGroup) => g.fluxes.map((f) => f._id ?? "")),
        ]);
        setViewedFluxIds((prev) => {
          const pruned = new Set<string>([...prev].filter((id) => activeIds.has(id)));
          try {
            localStorage.setItem("viewedFluxIds", JSON.stringify(Array.from(pruned)));
          } catch {}
          return pruned;
        });
      } catch (e) {
        console.error("Error fetching fluxes:", e);
      } finally {
        setFluxLoading(false);
      }
    };

    const fetchPosts = async () => {
      try {
        const res = await getPostFeed(1, 50);
        setPosts(res.data);
        setPostsHasMore(res.pagination.hasMore);
      } catch (e) {
        console.error("Error fetching posts:", e);
      } finally {
        setPostsLoading(false);
      }
    };

    fetchProfile();
    fetchFluxes();
    fetchPosts();
  }, []);

  // ── Helpers ───────────────────────────────────────────────
  const scrollStories = (direction: "left" | "right") => {
    storiesRef.current?.scrollBy({
      left: direction === "left" ? -300 : 300,
      behavior: "smooth",
    });
  };

  const markFluxViewed = async (fluxId: string) => {
    if (viewedFluxIds.has(fluxId)) return;
    setViewedFluxIds((prev) => {
      const next = new Set(prev);
      next.add(fluxId);
      try { localStorage.setItem("viewedFluxIds", JSON.stringify(Array.from(next))); } catch {}
      return next;
    });
    try { await viewFlux(fluxId); } catch {}
  };

  const refreshFeedAfterFollow = async (followedUserId: string) => {
    try {
      await invalidateFluxFeedCache(followedUserId);
      const [mine, feed] = await Promise.all([getMyFluxes(), getFluxFeed()]);
      setMyFluxes(mine);
      setFeedGroups(feed.filter((g) => !g.isSelf && g.fluxes.length > 0));
    } catch (e) {
      console.error("refreshFeedAfterFollow failed:", e);
    }
  };

  const myFluxViewed =
    myFluxes.length > 0 && myFluxes.every((f) => viewedFluxIds.has(f._id));

  // ─────────────────────────────────────────────────────────
  //  Render
  // ─────────────────────────────────────────────────────────
  return (
    <div
      className="h-screen overflow-y-auto scrollbar-hide font-sans selection:bg-[#8860D9] selection:text-white"
      style={{ backgroundColor: themeStyles.background, color: themeStyles.text }}
    >
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease forwards; }
      `}</style>

      <SideBar />
      {/* Unskippable username setup modal */}
      {showUsernameModal && (
        <UsernameSave
          onComplete={(updatedUser) => {
            setUserProfile((prev: any) => ({ ...prev, ...updatedUser }));
            setShowUsernameModal(false);
          }}
        />
      )}
      <main className="transition-all duration-300 ease-in-out" style={{ marginLeft }}>
        <div className="w-full max-w-[1600px] mx-auto flex justify-center xl:justify-between gap-10 pt-4 px-4 md:px-12 xl:px-20">

          {/* ── LEFT / CENTER FEED  */}
          <div className="flex-1 max-w-[700px] min-w-0 flex flex-col gap-8">
            {fluxLoading ? (
              <HomeSkeleton />
            ) : (
              <div className="flex flex-col gap-8 animate-fadeIn">

                {/* ── Stories / Flux bar ─────────────────── */}
                <div className="relative -mx-4 md:-mx-12 xl:-mx-20 flex items-center lg:ml-12">
                  {/* My story */}
                  <div className="pl-4 md:pl-12 xl:pl-20 flex-shrink-0">
                    <button
                      onClick={() => {
                        if (myFluxes.length > 0) {
                          markFluxViewed(myFluxes[0]._id);
                          router.push(`/post/flux-view?fluxId=${myFluxes[0]._id}`);
                        } else {
                          router.push("/post/flux");
                        }
                      }}
                      className="flex flex-col items-center gap-1.5 group"
                      style={{ width: 72 }}
                    >
                      <div
                        className="relative flex-shrink-0 transition-all group-hover:scale-105"
                        style={{
                          width: 70, height: 100, borderRadius: 12,
                          padding:    myFluxes.length > 0 ? 2 : 0,
                          background: myFluxes.length > 0
                            ? myFluxViewed
                              ? "linear-gradient(147.67deg,#555 13%,#888 100%)"
                              : "linear-gradient(147.67deg,#8860D9 13%,#B3B8E2 100%)"
                            : "transparent",
                          border:    myFluxes.length > 0 ? "none" : "1.5px dashed rgba(255,255,255,0.25)",
                          boxSizing: "border-box",
                        }}
                      >
                        <div style={{
                          width: "100%", height: "100%",
                          borderRadius: myFluxes.length > 0 ? 10 : 12,
                          overflow: "hidden", position: "relative", background: "#1a1a1a",
                        }}>
                          <Image
                            src={userProfile?.profile_picture ?? ProfileImage}
                            alt="my story" fill sizes="70px" className="object-cover"
                            style={{ opacity: myFluxes.length > 0 ? 1 : 0.6 }}
                            unoptimized={!!userProfile?.profile_picture}
                          />
                          {myFluxes.length === 0 && (
                            <div style={{
                              position: "absolute", bottom: 0, left: 0, right: 0,
                              display: "flex", justifyContent: "center", paddingBottom: 8,
                            }}>
                              <div style={{
                                width: 24, height: 24, borderRadius: "50%",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontSize: 14, fontWeight: 700,
                                background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)",
                              }}>+</div>
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[11px] truncate text-center w-full"
                        style={{ color: themeStyles.textSecondary }}>Your Flux</span>
                    </button>
                  </div>

                  {/* Other stories */}
                  {feedGroups.length > 0 && (
                    <div className="flex-1 min-w-0 relative group">
                      <button
                        onClick={() => scrollStories("left")}
                        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 hidden lg:flex opacity-0 group-hover:opacity-100"
                      >
                        <ChevronLeft />
                      </button>
                      <button
                        onClick={() => scrollStories("right")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 hidden lg:flex opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight />
                      </button>

                      <div ref={storiesRef}
                        className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-4 scroll-smooth">
                        {feedGroups.map((group) => {
                          const firstFlux = group.fluxes[0];
                          const fluxId    = firstFlux?._id ?? "";
                          return (
                            <button
                              key={group._id}
                              onClick={() => {
                                markFluxViewed(fluxId);
                                router.push(`/post/flux-view?fluxId=${fluxId}&userId=${group._id}`);
                              }}
                              className="flex flex-col items-center gap-1.5 flex-shrink-0 group/item"
                              style={{ width: 72 }}
                            >
                              <div
                                className="transition-all group-hover/item:scale-105"
                                style={{
                                  width: 70, height: 100, borderRadius: 12, padding: 2,
                                  background: group.fluxes.every(
                                    (f) => f._id != null && viewedFluxIds.has(f._id)
                                  )
                                    ? "linear-gradient(147.67deg,#444 13%,#777 100%)"
                                    : group.fluxes.some((f) => f.visibility === "close_friends")
                                      ? "linear-gradient(147.67deg,#22c55e 13%,#16a34a 100%)"
                                      : "linear-gradient(147.67deg,#2979FF 13%,#6B9CF0 54%,#9DC1FF 100%)",
                                  boxSizing: "border-box", flexShrink: 0,
                                }}
                              >
                                <div style={{
                                  width: "100%", height: "100%", borderRadius: 10,
                                  overflow: "hidden", position: "relative", background: "#1a1a1a",
                                }}>
                                  <Image
                                    src={group.user?.profile_picture || ProfileImage}
                                    alt={group.user?.username ?? ""} fill sizes="70px"
                                    className="object-cover"
                                    unoptimized={!!group.user?.profile_picture}
                                  />
                                </div>
                              </div>
                              <span className="text-[11px] truncate text-center w-full"
                                style={{ color: themeStyles.textSecondary }}>
                                {group.user?.username}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Event categories ───────────────────── */}
                <EventCategoryList />

                {/* ── Posts feed ─────────────────────────── */}
                <div className="flex flex-col gap-4 pb-20 mx-[4px]">
                  {postsLoading ? (
                    /* Skeleton */
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="rounded-[20px] overflow-hidden animate-pulse"
                        style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}>
                        <div className="flex items-center gap-3 p-4">
                          <div className="w-10 h-10 rounded-full" style={{ background: themeStyles.pillBg }} />
                          <div className="flex flex-col gap-2 flex-1">
                            <div className="h-3 w-28 rounded-full" style={{ background: themeStyles.pillBg }} />
                            <div className="h-2.5 w-16 rounded-full" style={{ background: themeStyles.pillBg }} />
                          </div>
                        </div>
                        <div className="w-full" style={{ aspectRatio: "4/5", maxHeight: 480, background: themeStyles.pillBg }} />
                        <div className="flex items-center gap-4 p-4">
                          {[64, 52, 44].map((width, j) => (
                            <div key={j} className="h-3 rounded-full" style={{ width, background: themeStyles.pillBg }} />
                          ))}
                        </div>
                      </div>
                    ))
                  ) : posts.length === 0 ? (
                    /* Empty */
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                      <span className="text-4xl">📸</span>
                      <p className="text-sm font-medium text-center max-w-[260px]"
                        style={{ color: themeStyles.textSecondary }}>
                        No posts yet. Follow people to see their posts here.
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Real posts */}
                      {posts.map((post) => (
                        <PostCard
                          key={post._id}
                          post={post}
                          currentUserId={userProfile?.id}
                          onDelete={(id) =>
                            setPosts((prev) => prev.filter((x) => x._id !== id))
                          }
                          onPostUpdated={(updated) =>
                            setPosts((prev) =>
                              prev.map((x) => (x._id === updated._id ? updated : x))
                            )
                          }
                        />
                      ))}

                      {/* Load more */}
                      {postsHasMore && (
                        <button
                          onClick={loadMorePosts}
                          className="w-full py-3 text-sm font-medium rounded-2xl transition-all duration-200 active:scale-[0.98]"
                          style={{
                            background: themeStyles.cardBg,
                            border:     `1px solid ${themeStyles.border}`,
                            color:      themeStyles.textSecondary,
                          }}
                        >
                          Load more posts
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ───────────────────────────── */}
          <div className="hidden xl:flex w-[320px] 2xl:w-[380px] flex-col gap-10 pt-2 h-fit sticky top-6">
            {/* Suggested Profiles */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[16px] font-bold" style={{ color: themeStyles.text }}>Suggested Profiles</h3>
                <button className="text-xs text-[#8860D9] font-medium hover:underline">see all</button>
              </div>
              <div className="flex flex-col gap-4">
                {suggestedProfiles.map((profile, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-[#222] overflow-hidden relative border border-white/5 flex-shrink-0">
                        <Image src={UserDemoIcon} alt={profile.name} fill sizes="44px" className="object-cover" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[13px] font-semibold truncate" style={{ color: themeStyles.text }}>{profile.name}</span>
                        <span className="text-[11px] truncate" style={{ color: themeStyles.textSecondary }}>{profile.handle}</span>
                      </div>
                    </div>
                    <button className="w-[62px] h-[26px] rounded-[25px] flex items-center justify-center text-[11px] font-semibold text-white bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] flex-shrink-0">
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Events */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[16px] font-bold" style={{ color: themeStyles.text }}>Popular events</h3>
                <button className="text-xs text-transparent bg-clip-text bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] font-medium hover:opacity-80 transition-opacity">see all</button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {popularEvents.map((evt, i) => (
                  <div key={i}
                    className="w-full h-[260px] flex flex-col p-3 rounded-[12px] border transition-colors cursor-pointer group relative overflow-hidden"
                    style={{ background: themeStyles.cardBg, borderColor: themeStyles.border }}>
                    <div className="w-full h-[140px] rounded-[8px] overflow-hidden relative mb-3">
                      <Image src={evt.image} alt="Event" fill
                        sizes="(max-width: 1280px) 50vw, 190px"
                        className="object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-2 right-2 w-7 h-7 backdrop-blur-md rounded-full flex items-center justify-center border transition-colors z-10"
                        style={{ backgroundColor: themeStyles.pillBg, borderColor: themeStyles.border }}>
                        <HeartOutline className="w-3.5 h-3.5 text-[#8860D9] fill-[#8860D9]" />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-[14px] font-semibold leading-tight truncate" style={{ color: themeStyles.text }}>{evt.title}</h4>
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: themeStyles.textSecondary }}>
                        <Calendar className="w-3.5 h-3.5 text-[#8860D9]" /><span>{evt.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px]" style={{ color: themeStyles.textSecondary }}>
                        <MapPin className="w-3.5 h-3.5 text-[#8860D9]" /><span className="truncate">{evt.location}</span>
                      </div>
                      <div className="flex -space-x-2 mt-1.5">
                        {[1, 2, 3, 4].map((x) => (
                          <div key={x} className="w-6 h-6 rounded-full border relative overflow-hidden"
                            style={{ borderColor: isDark ? themeStyles.background : "#FFFFFF" }}>
                            <Image src={UserDemoIcon} alt="" fill sizes="24px" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Reels */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-[16px] font-bold" style={{ color: themeStyles.text }}>Suggested reels</h3>
                <button className="text-xs text-transparent bg-clip-text bg-[linear-gradient(180deg,_#B3B8E2_0%,_#8860D9_50%,_#9575CD_100%)] font-medium hover:opacity-80 transition-opacity">see all</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {suggestedReels.map((item) => (
                  <div key={item} className="relative aspect-[3/5] bg-[#1a1a1a] rounded-xl overflow-hidden cursor-pointer group">
                    <Image src={DummyPost} alt="Reel" fill
                      sizes="(max-width: 1280px) 33vw, 120px"
                      className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2 right-2 w-7 h-7 bg-white/20 backdrop-blur-sm rounded-[6px] flex items-center justify-center border border-white/30">
                      <Play className="w-3.5 h-3.5 text-white fill-white" />
                    </div>
                    <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent" />
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-4 mt-4 pt-6 text-[11px]"
              style={{ borderTop: `1px solid ${themeStyles.border}`, color: themeStyles.textSecondary }}>
              <div className="flex flex-col gap-3">
                <span className="font-medium" style={{ color: themeStyles.text }}>Download mobile app</span>
                <div className="w-24 h-24 relative p-1 bg-white rounded-lg overflow-hidden">
                  <Image src={QrCode} alt="QR Code" fill sizes="96px" className="object-contain" />
                </div>
              </div>
              <div className="flex flex-wrap gap-x-2 gap-y-1 leading-normal">
                <a href="#" className="hover:underline">About</a> ·
                <a href="#" className="hover:underline">Help</a> ·
                <a href="#" className="hover:underline">Privacy</a> ·
                <a href="#" className="hover:underline">Terms</a>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
