'use client';

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import UnreadBadge from '@/components/chat/UnreadBadge';
export default function MessagesIcon() {
  return (
    <Link href="/message" className="relative inline-block">
      <MessageCircle size={24} className="text-white" />
      <UnreadBadge />
    </Link>
  );
}