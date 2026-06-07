"use client";
import React from "react";
import { Play } from "lucide-react";
import { useTheme } from "@/components/home/ThemeContext";
import type { Post } from "@/types/post";
import ExplorePostGrid from "./ExplorePostGrid";
import ExploreReelGrid from "./ExploreReelGrid";
import ExploreFeaturedEvent from "./ExploreFeaturedEvent";
import ExploreEventGrid from "./ExploreEventGrid";

interface Props {
  posts: Post[];
  reels: Post[];
  events: any[];
  liveEvents: any[];
  postsLoading: boolean;
  reelsLoading: boolean;
  eventsLoading: boolean;
  onLoadMore: () => void;
  postsHasMore: boolean;
}

export default function ExploreAllTab({
  posts, reels, events, liveEvents,
  postsLoading, reelsLoading, eventsLoading,
  onLoadMore, postsHasMore,
}: Props) {
  const { themeStyles } = useTheme();

  const allEvents = (() => {
    const seen = new Set<string>();
    return [...liveEvents.map(e => ({ ...e, isLive: true })), ...events].filter(e => {
      if (!e._id || seen.has(e._id)) return false;
      seen.add(e._id);
      return true;
    });
  })();

  // Split: first 9 posts for top grid, rest for bottom
  const topPosts    = posts.slice(0, 9);
  const bottomPosts = posts.slice(9);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Top posts grid (first 9) */}
      <section>
        <ExplorePostGrid posts={topPosts} loading={postsLoading} />
      </section>

      {/* ── Featured events strip */}
      {(eventsLoading || allEvents.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: themeStyles.text }}>
              Featured Events
            </h3>
            <button className="text-xs font-semibold" style={{ color: "#8860D9" }}>
              See All
            </button>
          </div>
          <ExploreFeaturedEvent events={allEvents} loading={eventsLoading} />
        </section>
      )}

      {/* Reels section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(147.67deg,#2979FF 13%,#9DC1FF 100%)" }}
            >
              <Play size={10} className="text-white fill-white ml-0.5" />
            </div>
            <h3 className="text-sm font-bold" style={{ color: themeStyles.text }}>
              Reels
            </h3>
          </div>
          {!reelsLoading && reels.length > 0 && (
            <span className="text-xs font-semibold" style={{ color: "#8860D9" }}>
              {reels.length} reels
            </span>
          )}
        </div>

        {reelsLoading ? (
          // Show skeleton only while loading
          <ExploreReelGrid reels={[]} loading={true} hideEmptyState={true} />
        ) : reels.length > 0 ? (
          // Show reels grid when data exists
          <ExploreReelGrid reels={reels} loading={false} hideEmptyState={true} />
        ) : null  /* Hide section entirely when no reels */ }
      </section>

      {/* ── Bottom posts grid (posts 9+) */}
      {!postsLoading && bottomPosts.length > 0 && (
        <section>
          <ExplorePostGrid posts={bottomPosts} loading={false} />
        </section>
      )}
      {/* ── Nearby events */}
      {allEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: themeStyles.text }}>
              Nearby Events
            </h3>
            <button className="text-xs font-semibold" style={{ color: "#8860D9" }}>
              See All
            </button>
          </div>
          <ExploreEventGrid events={allEvents.slice(0, 6)} loading={eventsLoading} />
        </section>
      )}

      {/* ── Load more */}
      {postsHasMore && !postsLoading && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            onClick={onLoadMore}
            className="px-8 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{
              background:
                "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)",
            }}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
