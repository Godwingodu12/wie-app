"use client";
import React from "react";
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
  const { themeStyles, isDark } = useTheme();
  const allEvents = [...liveEvents.map(e => ({ ...e, isLive: true })), ...events];

  return (
    <div className="flex flex-col gap-6">
      {/* Posts grid */}
      <section>
        <ExplorePostGrid posts={posts} loading={postsLoading} />
      </section>

      {/* Featured events strip */}
      {(eventsLoading || allEvents.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: themeStyles.text }}>Featured Events</h3>
            <button className="text-xs font-semibold" style={{ color: "#8860D9" }}>See All</button>
          </div>
          <ExploreFeaturedEvent events={allEvents} loading={eventsLoading} />
        </section>
      )}

      {/* Reels grid */}
      {(reelsLoading || reels.length > 0) && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: themeStyles.text }}>Reels</h3>
          </div>
          <ExploreReelGrid reels={reels.slice(0, 9)} loading={reelsLoading} />
        </section>
      )}

      {/* More posts */}
      {!postsLoading && posts.length > 0 && (
        <section>
          <ExplorePostGrid posts={posts.slice(9)} loading={false} />
        </section>
      )}

      {/* Nearby events */}
      {allEvents.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: themeStyles.text }}>Nearby events</h3>
            <button className="text-xs font-semibold" style={{ color: "#8860D9" }}>see all</button>
          </div>
          <ExploreEventGrid events={allEvents.slice(0, 6)} loading={eventsLoading} />
        </section>
      )}

      {/* Load more */}
      {postsHasMore && !postsLoading && (
        <div className="flex justify-center pt-2 pb-6">
          <button
            onClick={onLoadMore}
            className="px-8 py-2.5 rounded-full text-sm font-semibold text-white"
            style={{ background: "linear-gradient(180deg,#B3B8E2 0%,#8860D9 50%,#9575CD 100%)" }}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}