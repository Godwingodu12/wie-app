'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/components/home/ThemeContext';
import { UserX, Loader2 } from 'lucide-react';
import Image from 'next/image';
import TopAlert from '@/components/ui/TopAlert';
import { getBlockedUsers, unblockUser } from '@/services/chatService';
import { getUserById } from '@/services/wieUserService';

// Mock blocked user type - replace with actual type from your API
interface BlockedUser {
  id: string;
  name: string;
  username: string;
  profile_picture?: string;
  blockedAt?: string;
}

const normalizeBlockedUser = (item: any): BlockedUser | null => {
  if (!item) return null;
  const user =
    item.user ||
    item.blockedUser ||
    item.blocked ||
    item.blockedUserDetails ||
    item.blockedId ||
    item.userId ||
    item;

  const id =
    item.userId?._id ||
    item.userId ||
    item.blockedId ||
    item._id ||
    user?._id ||
    user?.id ||
    item.id ||
    '';

  if (!id) return null;

  const name =
    user?.name ||
    user?.fullName ||
    user?.displayName ||
    item.name ||
    'Unknown';

  const username =
    user?.username ||
    user?.userName ||
    user?.handle ||
    item.username ||
    'unknown';

  const profile_picture =
    user?.profile_picture ||
    user?.profilePicture ||
    user?.avatar ||
    item.profile_picture ||
    item.avatar ||
    '';

  return { id, name, username, profile_picture };
};

export default function BlockedAccountsPage() {
  const { themeStyles } = useTheme();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);
  const [confirmUser, setConfirmUser] = useState<BlockedUser | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchBlockedUsers = async () => {
      try {
        setLoading(true);
        const res = await getBlockedUsers();
        const list =
          res?.lockedUsers ||
          res?.blockedUsers ||
          res?.data?.blockedUsers ||
          res?.data ||
          res?.blocked ||
          res?.users ||
          res?.results ||
          [];

        if (Array.isArray(list) && list.length > 0 && list[0]?.userId && !list[0]?.name) {
          const detailed = await Promise.all(
            list.map(async (item: any) => {
              try {
                const userId = item.userId;
                const profile = await getUserById(userId);
                return {
                  id: profile?._id || profile?.id || userId,
                  name: profile?.name || profile?.fullName || profile?.displayName || 'Unknown',
                  username: profile?.username || profile?.userName || profile?.handle || 'unknown',
                  profile_picture: profile?.profile_picture || profile?.profilePicture || profile?.avatar || '',
                  blockedAt: item.blockedAt,
                } as BlockedUser;
              } catch (e) {
                return {
                  id: item.userId,
                  name: 'Unknown',
                  username: 'unknown',
                  profile_picture: '',
                  blockedAt: item.blockedAt,
                } as BlockedUser;
              }
            })
          );
          setBlockedUsers(detailed);
        } else {
          const normalized = (Array.isArray(list) ? list : [])
            .map(normalizeBlockedUser)
            .filter(Boolean) as BlockedUser[];
          setBlockedUsers(normalized);
        }
      } catch (err) {
        console.error('Failed to fetch blocked users', err);
        setBlockedUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlockedUsers();
  }, []);

  const handleUnblock = async (userId: string) => {
    if (!userId) return;
    setUnblockingId(userId);
    try {
      await unblockUser(userId);
      setBlockedUsers(prev => prev.filter(user => user.id !== userId));
      setToast({ message: 'User unblocked successfully', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to unblock user', type: 'error' });
    } finally {
      setUnblockingId(null);
      setConfirmUser(null);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2" style={{ color: themeStyles.text }}>
          Blocked Accounts
        </h2>
        <p style={{ color: themeStyles.textSecondary }}>
          Manage accounts you have blocked. Blocked accounts cannot see your posts or interact with you.
        </p>
      </div>

      {/* Blocked Users Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: themeStyles.textSecondary }} />
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
            style={{ background: themeStyles.pillBg }}
          >
            <UserX className="w-10 h-10" style={{ color: themeStyles.textSecondary }} />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: themeStyles.text }}>
            No Blocked Accounts
          </h3>
          <p className="text-center max-w-md" style={{ color: themeStyles.textSecondary }}>
            You haven't blocked any accounts yet. When you block someone, they'll appear here.
          </p>
        </div>
      ) : (
        <div className="flex flex-wrap justify-center gap-6">
          {blockedUsers.map((user) => {
            const id = user.id;
            const name = user.name;
            const username = user.username;
            const avatar = user.profile_picture || '';
            return (
              <div
                key={id || `${name}-${username}`}
                className="flex flex-col items-center justify-center text-center"
                style={{
                  width: '215px',
                  height: '251px',
                  padding: '24px',
                  gap: '10px',
                  borderRadius: '12px',
                  opacity: 1,
                  background: themeStyles.cardBg,
                  backdropFilter: 'blur(60px)',
                  border: `1px solid ${themeStyles.border}`,
                }}
              >
                <div
                  className="flex items-center justify-center overflow-hidden"
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: '67px',
                    opacity: 1,
                    background: themeStyles.pillBg,
                  }}
                >
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt={name}
                      width={70}
                      height={70}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserX className="w-6 h-6" style={{ color: themeStyles.textSecondary }} />
                  )}
                </div>

                <div className="mt-2">
                  <div className="text-sm font-semibold" style={{ color: themeStyles.text }}>
                    {name}
                  </div>
                  <div className="text-xs mt-1" style={{ color: themeStyles.textSecondary }}>
                    @{username}
                  </div>
                </div>

                <button
                  onClick={() => setConfirmUser({ ...user })}
                  disabled={!id || unblockingId === id}
                  className="mt-3 text-xs font-medium disabled:opacity-50"
                  style={{
                    width: '84px',
                    height: '34px',
                    borderRadius: '25px',
                    padding: '8px 12px',
                    gap: '10px',
                    opacity: 1,
                    background: themeStyles.pillBg,
                    color: themeStyles.text,
                  }}
                >
                  {unblockingId === id ? '...' : 'Unblock'}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {confirmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-[428px] p-6 rounded-[24px]"
            style={{
              background: themeStyles.cardBg,
              backdropFilter: 'blur(60px)',
              border: `1px solid ${themeStyles.border}`,
            }}
          >
            <div className="flex flex-col items-center text-center">
              <div
                className="flex items-center justify-center overflow-hidden mb-4"
                style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '67px',
                  background: themeStyles.pillBg,
                }}
              >
                {confirmUser.profile_picture ? (
                  <Image
                    src={confirmUser.profile_picture}
                    alt={confirmUser.name}
                    width={70}
                    height={70}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserX className="w-6 h-6" style={{ color: themeStyles.textSecondary }} />
                )}
              </div>

              <div className="text-sm font-semibold" style={{ color: themeStyles.text }}>
                {confirmUser.name}
              </div>
              <div className="text-xs mt-1" style={{ color: themeStyles.textSecondary }}>
                @{confirmUser.username}
              </div>

              <p className="mt-4 text-sm" style={{ color: themeStyles.text }}>
                Are you sure you want to unblock @{confirmUser.username}?
              </p>
            </div>

            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                onClick={() => setConfirmUser(null)}
                className="text-xs font-medium"
                style={{
                  width: '166px',
                  height: '34px',
                  borderRadius: '25px',
                  padding: '8px 12px',
                  background: themeStyles.pillBg,
                  color: themeStyles.textSecondary,
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnblock(confirmUser.id)}
                disabled={unblockingId === confirmUser.id}
                className="text-xs font-medium disabled:opacity-50"
                style={{
                  width: '167px',
                  height: '34px',
                  borderRadius: '25px',
                  padding: '8px 12px',
                  background:
                    'linear-gradient(147.67deg, #2979FF 13.16%, #6B9CF0 54.09%, #9DC1FF 100.03%)',
                  color: '#ffffff',
                  overflow: 'hidden',
                }}
              >
                {unblockingId === confirmUser.id ? 'Unblocking...' : 'Unblock'}
              </button>
            </div>
          </div>
        </div>
      )}

      <TopAlert
        message={toast?.message || ''}
        type={toast?.type}
        visible={!!toast}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
