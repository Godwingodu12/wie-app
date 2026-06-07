'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Loader2, UserPlus, ChevronLeft, X, Check } from 'lucide-react';
import { 
  getFollowRequests, 
  acceptFollowRequest, 
  rejectFollowRequest 
} from '@/services/followService';
import { useTheme } from '@/components/home/ThemeContext';
import SideBar from '@/components/home/SideBar';

interface FollowRequest {
  id: string;
  requestedAt: string;
  name?: string;
  username?: string;
  profile_picture?: string;
  bio?: string;
  is_verified?: boolean;
}

export default function FollowRequestsPage() {
  const router = useRouter();
  const { themeStyles } = useTheme();
  const [requests, setRequests] = useState<FollowRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await getFollowRequests(page, 20);
      setRequests(res.requests || []);
      setHasMore(res.page < res.totalPages);
    } catch (error) {
      console.error('Failed to fetch follow requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    try {
      await acceptFollowRequest(userId);
      setRequests(prev => prev.filter(req => req.id !== userId));
    } catch (error) {
      console.error('Failed to accept request:', error);
      alert('Failed to accept follow request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleReject = async (userId: string) => {
    setProcessingIds(prev => new Set(prev).add(userId));
    try {
      await rejectFollowRequest(userId);
      setRequests(prev => prev.filter(req => req.id !== userId));
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Failed to reject follow request');
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: themeStyles.background }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto scrollbar-hide font-sans flex" style={{ backgroundColor: themeStyles.background }}>
      <SideBar />

      <main className="transition-all duration-300 ease-in-out flex-1 w-full pb-24 px-0 pt-0 sm:p-4 sm:pb-24 md:p-6 md:pb-6 lg:p-8 lg:pb-8 lg:ml-[250px] xl:ml-[281px]">
        <div 
          className="w-full relative overflow-hidden flex flex-col mx-auto rounded-none sm:rounded-[20px] md:rounded-[28px] lg:rounded-[32px] my-0 sm:my-2 md:my-4 lg:my-8 min-h-screen sm:min-h-[calc(100vh-48px)] md:min-h-[calc(100vh-56px)] lg:min-h-[calc(100vh-64px)] border-none sm:border md:border shadow-none sm:shadow-lg md:shadow-xl lg:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] max-w-full sm:max-w-[95%] md:max-w-[90%] lg:max-w-[700px] xl:max-w-[1200px]"
          style={{
            background: themeStyles.cardBg,
            borderColor: themeStyles.border,
          }}
        >
          <div className="p-4 pt-6 sm:p-5 md:p-8 lg:p-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.back()}
                className="w-10 h-10 flex items-center justify-center rounded-full transition-colors"
                style={{ background: themeStyles.pillBg }}
              >
                <ChevronLeft size={20} style={{ color: themeStyles.text }} />
              </button>
              <h1 className="text-2xl font-bold" style={{ color: themeStyles.text }}>
                Follow Requests
              </h1>
            </div>

            {/* Requests List */}
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <UserPlus size={48} style={{ color: themeStyles.textSecondary }} className="mb-4 opacity-50" />
                <p className="text-lg font-medium" style={{ color: themeStyles.text }}>No follow requests</p>
                <p className="text-sm mt-2" style={{ color: themeStyles.textSecondary }}>
                  When someone requests to follow you, they'll appear here
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => {
                  const isProcessing = processingIds.has(request.id);
                  
                  return (
                    <div
                      key={request.id}
                      className="flex items-center gap-4 p-4 rounded-xl transition-colors"
                      style={{ background: themeStyles.pillBg }}
                    >
                      {/* Avatar */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                        {request.profile_picture ? (
                          <Image
                            src={request.profile_picture}
                            alt={request.name || 'User'}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] flex items-center justify-center">
                            <span className="text-xl font-bold text-white">
                              {(request.name || request.username || 'U').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold truncate" style={{ color: themeStyles.text }}>
                          {request.name || request.username || 'User'}
                        </p>
                        {request.username && (
                          <p className="text-sm truncate" style={{ color: themeStyles.textSecondary }}>
                            @{request.username}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={isProcessing}
                          className="w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-50"
                          style={{ background: themeStyles.cardBg, border: `1px solid ${themeStyles.border}` }}
                        >
                          {isProcessing ? (
                            <Loader2 size={16} className="animate-spin" style={{ color: themeStyles.textSecondary }} />
                          ) : (
                            <X size={16} style={{ color: '#FF453A' }} />
                          )}
                        </button>
                        <button
                          onClick={() => handleAccept(request.id)}
                          disabled={isProcessing}
                          className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] transition-opacity disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <Loader2 size={16} className="animate-spin text-white" />
                          ) : (
                            <Check size={16} className="text-white" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}