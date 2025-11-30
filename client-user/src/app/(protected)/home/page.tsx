'use client';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import SideBar from '@/components/home/SideBar';
import { getProfile } from '@/services/wieUserService';
import StoryPlusIcon from '@/assets/Home/StoryPlusIcon.svg';
import UserDemoIcon from '@/assets/Home/UserDemoIcon.svg';
import DummyPost from '@/assets/Home/dummypost.png';
import LikeIcon from '@/assets/Home/LikeIcon.svg';
import CommentIcon from '@/assets/Home/CommentIcon.svg';
import ShareCountIcon from '@/assets/Home/ShareCount.svg';
import SaveIcon from '@/assets/Home/ShareIcon.svg';
import { MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
interface Story { id: string; username: string; avatar: string; hasStory: boolean; isOwn?: boolean; }
interface Post { id: string; user: { name: string; avatar: string; location: string; isVerified?: boolean; }; createdAt: string; image: string; likes: number; comments: number; shares: number; description: string; hashtags: string[]; likedBy: { name: string; avatar: string; }[]; }
const eventCategories = [
  'Sports, Fitness, & Adventure',
  'Music',
  'Arts, Culture, & Literature',
  'Dance',
  'Business & Innovation',
  'Food, Lifestyle, & Wellness',
  'Film, Media, & Gaming',
  'Travel, Holidays, & Tourism',
  'Festivals & Celebrations',
  'Environment, Sustainability, & Agriculture',
  'Religious & Spiritual Events',
  'Education & Learning',
];
const dummyStories: Story[] = [
  { id: '1', username: 'Your story', avatar: '', hasStory: false, isOwn: true },
  { id: '2', username: 'Gokul', avatar: '/avatars/gokul.jpg', hasStory: true },
  { id: '3', username: 'Sangeeth', avatar: '/avatars/sangeeth.jpg', hasStory: true },
  { id: '4', username: 'Ajeesh', avatar: '/avatars/ajeesh.jpg', hasStory: true },
  { id: '5', username: 'Sangeeth', avatar: '/avatars/sangeeth2.jpg', hasStory: true },
  { id: '6', username: 'Sangeeth', avatar: '/avatars/sangeeth3.jpg', hasStory: true },
];
const dummyPosts: Post[] = [
  { id: '1', user: { name: 'SangeethPalliyal', avatar: '/avatars/sangeeth.jpg', location: 'Azrael, Empuraan', isVerified: true }, createdAt: '11 hours ago', image: '', likes: 1200, comments: 1111, shares: 666, description: 'Mesmerizing colors and graceful movements! This tropical bird truly embodies the beauty of nature with its vibrant plumage and elegant dance.', hashtags: ['#nature', '#birds', '#tropical'], likedBy: [{ name: 'Gokul_Gopalan', avatar: '/avatars/gokul.jpg' }] },
];
export default function HomePage() {
  const [userProfile, setUserProfile] = useState<any>(null);
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());
  const router = useRouter();

  useEffect(() => { const fetchProfile = async () => { try { const profile = await getProfile(); setUserProfile(profile); } catch (e) { console.error('Error fetching profile:', e); } }; fetchProfile(); }, []);

  const toggleDescription = (postId: string) => { setExpandedPosts(prev => { const n = new Set(prev); n.has(postId) ? n.delete(postId) : n.add(postId); return n; }); };
  const truncateText = (text: string, limit: number) => { const words = text.split(' '); return words.length > limit ? { text: words.slice(0, limit).join(' ') + '...', truncated: true } : { text, truncated: false }; };
  const formatCount = (n: number) => n >= 1000 ? (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K' : n.toString();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SideBar userName={userProfile?.name || userProfile?.username} userAvatar={userProfile?.avatar} />
      {/* Main Content */}
      <main className="ml-0 md:ml-20 lg:ml-[281px] pb-20 md:pb-0 transition-all duration-300">
        <div className="max-w-[608px] mx-auto px-4 py-6">
          {/* Stories Section */}
          <div className="relative mb-6">
            <button className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#383838]/60 flex items-center justify-center hover:bg-[#383838] transition-colors"><ChevronLeft className="w-4 h-4" /></button>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide px-8 py-2">
              {dummyStories.map((story) => (
                <div key={story.id} className="flex flex-col items-center gap-2 cursor-pointer flex-shrink-0" style={{ width: '78px', height: '96px' }}>
                  <div className={`relative w-[62px] h-[62px] rounded-full ${story.hasStory ? 'p-[2px] bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]' : 'border-2 border-[#2D2F39]'}`}>
                    <div className="w-full h-full rounded-full bg-[#0a0a0a] p-[2px]">
                      <div className="w-full h-full rounded-full bg-[#1a1a1a] overflow-hidden flex items-center justify-center">
                        {story.isOwn ? (userProfile?.avatar ? <Image src={userProfile.avatar} alt="Your story" fill className="object-cover" /> : <Image src={UserDemoIcon} alt="Your story" width={30} height={30} />) : <Image src={UserDemoIcon} alt={story.username} width={30} height={30} />}
                      </div>
                    </div>
                    {story.isOwn && <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center"><Image src={StoryPlusIcon} alt="Add" width={10} height={10} /></div>}
                  </div>
                  <span className="text-xs text-[#6F7680] text-center truncate w-full" style={{ fontFamily: 'SF Pro, sans-serif' }}>{story.username}</span>
                </div>
              ))}
            </div>
            <button className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-[#383838]/60 flex items-center justify-center hover:bg-[#383838] transition-colors"><ChevronRight className="w-4 h-4" /></button>
          </div>

          {/* Event Categories */}
          <div className="mb-6" style={{ maxWidth: '608px' }}>
            <div className="flex justify-between items-center px-1.5 py-3">
              <h2 className="text-lg font-semibold text-white tracking-tight" style={{ fontFamily: 'SF Pro, sans-serif' }}>Event categories</h2>
              <button onClick={() => router.push(`/events/categories`)} className="text-sm text-white hover:text-[#8860D9] transition-colors" style={{ fontFamily: 'SF Pro, sans-serif' }}>see all</button>
            </div>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide p-1.5">
              {eventCategories.slice(0, 4).map((cat) => (
                <button key={cat} onClick={() => router.push(`/events/categories?category=${encodeURIComponent(cat)}`)} className="flex-shrink-0 w-[139px] h-[63px] rounded-xl bg-[#383838]/20 backdrop-blur-[17px] flex items-center justify-center hover:bg-[#383838]/40 transition-all">
                  <span className="text-sm font-medium text-white">{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Posts Feed */}
          <div className="flex flex-col gap-6">
            {dummyPosts.map((post) => {
              const { text: desc, truncated } = truncateText(post.description, 15);
              const isExpanded = expandedPosts.has(post.id);
              return (
                <article key={post.id} className="w-full" style={{ maxWidth: '608px' }}>
                  {/* Post Header */}
                  <div className="flex items-center justify-between p-1.5 h-[46px]">
                    <div className="flex items-center gap-3">
                      <div className="w-[34px] h-[34px] rounded-full overflow-hidden bg-[#1a1a1a]"><Image src={UserDemoIcon} alt={post.user.name} width={34} height={34} className="object-cover" /></div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1"><span className="text-sm font-medium text-white">{post.user.name}</span>{post.user.isVerified && <svg className="w-4 h-4 text-[#8860D9]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>}</div>
                        <span className="text-[10px] text-white/80 font-light tracking-wide" style={{ fontFamily: 'SF Pro, sans-serif' }}>{post.user.location}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="px-4 py-1.5 rounded-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-xs font-medium text-white hover:opacity-90 transition-opacity">Follow</button>
                      <button className="w-[18px] h-[18px] flex items-center justify-center text-white/60 hover:text-white transition-colors"><MoreHorizontal className="w-[18px] h-[18px]" /></button>
                    </div>
                  </div>
                  {/* Timestamp */}
                  <div className="px-1.5 pb-1.5 h-5"><span className="text-xs text-[#6F7680]">{post.createdAt}</span></div>
                  {/* Post Image */}
                  <div className="relative w-full h-[289px] rounded-3xl overflow-hidden bg-[#1a1a1a]"><Image src={DummyPost} alt="Post" fill className="object-cover" /><button className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clipRule="evenodd" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg></button><button className="absolute bottom-4 left-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" /></svg></button><button className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"><svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg></button></div>
                  {/* Actions */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-0 rounded-full bg-[#383838]/40 backdrop-blur-[50px] px-4 py-3">
                        <button className="flex items-center gap-1 pr-6 border-r border-white/10"><Image src={LikeIcon} alt="Like" width={18} height={18} /><span className="text-xs text-white">{formatCount(post.likes)}</span></button>
                        <button className="flex items-center gap-1 px-6 border-r border-white/10"><Image src={CommentIcon} alt="Comment" width={14} height={14} /><span className="text-xs text-white">{formatCount(post.comments)}</span></button>
                        <button className="flex items-center gap-1 pl-6"><Image src={ShareCountIcon} alt="Share" width={16} height={16} /><span className="text-xs text-white">{formatCount(post.shares)}</span></button>
                      </div>
                      <button className="w-12 h-12 rounded-full bg-[#383838]/40 backdrop-blur-[50px] flex items-center justify-center hover:bg-[#383838]/60 transition-colors"><Image src={SaveIcon} alt="Save" width={16} height={16} /></button>
                    </div>
                    {/* Description */}
                    <div className="mt-3 px-1.5">
                      <p className="text-sm text-white/90"><span className="font-semibold text-white">{post.user.name}</span>{' '}{isExpanded ? post.description : desc}{' '}{truncated && !isExpanded && <button onClick={() => toggleDescription(post.id)} className="text-[#6F7680] hover:text-white transition-colors">more</button>}{post.hashtags.map((tag) => <span key={tag} className="text-[#8860D9]">{tag} </span>)}</p>
                    </div>
                    {/* Liked By */}
                    <div className="mt-2 px-1.5 flex items-center gap-2">
                      <div className="flex -space-x-2">{post.likedBy.slice(0, 3).map((user, i) => <div key={i} className="w-5 h-5 rounded-full border-2 border-[#0a0a0a] overflow-hidden bg-[#1a1a1a]"><Image src={UserDemoIcon} alt={user.name} width={20} height={20} /></div>)}</div>
                      <span className="text-xs text-[#6F7680]">Liked by <span className="text-white font-medium">{post.likedBy[0]?.name}</span> and others</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
