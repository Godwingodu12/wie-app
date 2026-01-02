'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMessageRequests, acceptMessageRequest, declineMessageRequest } from '@/services/chatService';
import { MessageRequest } from '@/types/chat';
import { ArrowLeft, Loader2, Check, X } from 'lucide-react';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';

export default function MessageRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const response = await getMessageRequests();
      if (response.success) {
        setRequests(response.requests || []);
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (chatId: string) => {
    setProcessing(chatId);
    try {
      const response = await acceptMessageRequest(chatId);
      if (response.success) {
        setRequests(prev => prev.filter(req => req._id !== chatId));
        // Navigate to the accepted chat
        router.push('/message');
      }
    } catch (error) {
      // Silent fail
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (chatId: string) => {
    setProcessing(chatId);
    try {
      const response = await declineMessageRequest(chatId);
      if (response.success) {
        setRequests(prev => prev.filter(req => req._id !== chatId));
      }
    } catch (error) {
      // Silent fail
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0C1014]">
        <Loader2 className="animate-spin text-[#8860D9]" size={32} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-[#0C1014]">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#2D2F39] p-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-[#2D2F39] rounded-full text-white"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-xl font-bold text-white">Message Requests</h1>
      </div>

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 px-4">
            <p className="text-lg text-white mb-2">No message requests</p>
            <p className="text-sm text-center">You'll see message requests from people you don't follow here</p>
          </div>
        ) : (
          <div className="divide-y divide-[#2D2F39]">
            {requests.map((request) => (
              <div key={request._id} className="p-4 bg-[#0C1014]">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[#2D2F39] flex-shrink-0">
                    {request.participant?.profile_picture ? (
                      <Image
                        src={request.participant.profile_picture}
                        alt={request.participant.name}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-semibold text-lg bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD]">
                        {request.participant?.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-white truncate">
                        {request.participant?.name || 'Unknown'}
                      </p>
                      {request.participant?.is_verified && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                        </svg>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 truncate">
                      {request.lastMessage?.content || 'Wants to send you a message'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {request.lastMessage?.timestamp
                        ? formatDistanceToNow(new Date(request.lastMessage.timestamp), { addSuffix: true })
                        : ''}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(request._id)}
                    disabled={processing === request._id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {processing === request._id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Accept</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDecline(request._id)}
                    disabled={processing === request._id}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#2D2F39] text-white rounded-lg hover:bg-[#3D3F49] disabled:opacity-50 transition"
                  >
                    {processing === request._id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <>
                        <X size={16} />
                        <span>Decline</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}