import React from "react";
import { useChat } from "@/context/ChatContext";
import Image from "next/image";
import { useRouter } from "next/navigation";
import messageIcon from "@/assets/chat/messageIcon.png";
import { useTheme } from "@/components/home/ThemeContext";

export function EmptyState() {
  const { getTotalUnreadCount } = useChat();
  const totalMessages = getTotalUnreadCount();
  const router = useRouter();
  const { themeStyles, isDark } = useTheme();

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center text-center px-6"
      style={{ backgroundColor: themeStyles.background }}
    >
      <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500 max-w-2xl w-full">
        {/* Large Icon Bubble */}
        <div className="mb-8 relative">
          <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto transition-transform hover:scale-105">
            <Image
              src={messageIcon}
              alt="Messages"
              width={80}
              height={80}
              className="object-contain"
            />
          </div>
        </div>

        {/* Text Content */}
        <h2
          className="text-4xl md:text-5xl font-bold mb-4 tracking-tight"
          style={{ color: themeStyles.text }}
        >
          You have{" "}
          <span className="text-[#2979FF]">{totalMessages} messages</span>
        </h2>

        <p
          className="text-lg md:text-xl mb-10 font-medium max-w-md mx-auto leading-relaxed"
          style={{ color: themeStyles.textSecondary }}
        >
          Messages appear here. Start messaging now to connect with others.
        </p>

        <button
          onClick={() => router.push("/settings")}
          className="px-8 py-3 rounded-full font-medium transition-all text-sm md:text-base hover:shadow-lg hover:opacity-90"
          style={{
            background: themeStyles.cardBg,
            color: themeStyles.text,
            border: `1px solid ${themeStyles.border}`
          }}
        >
          Open Settings
        </button>
      </div>
    </div>
  );
}
