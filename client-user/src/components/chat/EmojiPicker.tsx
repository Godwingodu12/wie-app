'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { useTheme } from "@/components/home/ThemeContext";

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  position?: 'top' | 'bottom';
}

interface EmojiCategory {
  name: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    name: '😊 Smileys',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
      '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
      '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜',
      '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐',
      '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
      '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒',
      '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️', '🥴',
      '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐'
    ]
  },
  {
    name: '❤️ Hearts',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍',
      '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖',
      '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️',
      '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈',
      '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐',
      '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️'
    ]
  },
  {
    name: '👋 Gestures',
    emojis: [
      '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏',
      '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆',
      '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛',
      '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️',
      '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂',
      '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀'
    ]
  },
  {
    name: '🐶 Animals',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
      '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵',
      '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤',
      '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗',
      '🐴', '🦄', '🐝', '🪱', '🐛', '🦋', '🐌', '🐞',
      '🐜', '🪰', '🪲', '🪳', '🦟', '🦗', '🕷️', '🕸️'
    ]
  },
  {
    name: '🍕 Food',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇',
      '🍓', '🫐', '🍈', '🍒', '🍑', '🥭', '🍍', '🥥',
      '🥝', '🍅', '🍆', '🥑', '🥦', '🥬', '🥒', '🌶️',
      '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠',
      '🥐', '🥯', '🍞', '🥖', '🥨', '🧀', '🥚', '🍳',
      '🧈', '🥞', '🧇', '🥓', '🥩', '🍗', '🍖', '🌭'
    ]
  },
  {
    name: '⚽ Sports',
    emojis: [
      '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉',
      '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍',
      '🏏', '🪃', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿',
      '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸️', '🥌',
      '🎿', '⛷️', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺',
      '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣'
    ]
  },
  {
    name: '🚗 Travel',
    emojis: [
      '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑',
      '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🦯', '🦽',
      '🦼', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔',
      '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋',
      '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇',
      '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️'
    ]
  },
  {
    name: '⌚ Objects',
    emojis: [
      '⌚', '📱', '📲', '💻', '⌨️', '🖥️', '🖨️', '🖱️',
      '🖲️', '🕹️', '🗜️', '💾', '💿', '📀', '📼', '📷',
      '📸', '📹', '🎥', '📽️', '🎞️', '📞', '☎️', '📟',
      '📠', '📺', '📻', '🎙️', '🎚️', '🎛️', '🧭', '⏱️',
      '⏲️', '⏰', '🕰️', '⌛', '⏳', '📡', '🔋', '🔌',
      '💡', '🔦', '🕯️', '🪔', '🧯', '🛢️', '💸', '💵'
    ]
  },
  {
    name: '🎉 Activities',
    emojis: [
      '🎃', '🎄', '🎆', '🎇', '🧨', '✨', '🎈', '🎉',
      '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎑', '🧧',
      '🎀', '🎁', '🎗️', '🎟️', '🎫', '🎖️', '🏆', '🏅',
      '🥇', '🥈', '🥉', '⚽', '⚾', '🥎', '🏀', '🏐',
      '🏈', '🏉', '🎾', '🥏', '🎳', '🏏', '🏑', '🏒',
      '🥍', '🏓', '🏸', '🥊', '🥋', '🥅', '⛳', '⛸️'
    ]
  },
  {
    name: '🌍 Nature',
    emojis: [
      '🌍', '🌎', '🌏', '🌐', '🗺️', '🗾', '🧭', '🏔️',
      '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️',
      '🏟️', '🏛️', '🏗️', '🧱', '🪨', '🪵', '🛖', '🏘️',
      '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥', '🏦',
      '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰',
      '💒', '🗼', '🗽', '⛪', '🕌', '🛕', '🕍', '⛩️'
    ]
  },
  {
    name: '🌿 Nature & Plants',
    emojis: [
      '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️',
      '🍀', '🎍', '🪴', '🍃', '🍂', '🍁', '🍄', '🐚',
      '🪨', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸',
      '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕'
    ]
  },
  {
    name: '☁️ Weather',
    emojis: [
      '☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️',
      '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️',
      '🌫️', '🌈', '☔', '💧', '💦', '🌊', '🔥', '✨'
    ]
  },
  {
    name: '👕 Clothing & Fashion',
    emojis: [
      '👓', '🕶️', '🥽', '🥼', '🦺', '👔', '👕', '👖',
      '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱',
      '🩲', '🩳', '👙', '👒', '👑', '⛑️', '💄', '💍',
      '💼', '👜', '👛', '🎒', '👞', '👟', '🥾', '👠'
    ]
  },
{
    name: '🔯 Symbols & Zodiac',
    emojis: [
      '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓',
      '⛎', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺',
      '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️',
      '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯',
      '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗️', '❕', '❓',
      '❔', '‼️', '⁉️'
    ]
  },
  {
    name: '🏁 Flags',
    emojis: [
      '🏁', '🚩', '🎌', '🏴', '🏳️', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️',
      '🇺🇸', '🇬🇧', '🇨🇦', '🇦🇺', '🇯🇵', '🇰🇷', '🇩🇪', '🇫🇷',
      '🇮🇹', '🇪🇸', '🇧🇷', '🇮🇳', '🇨🇳', '🇷🇺', '🇲🇽', '🇸🇦'
    ]
  }
];

export default function EmojiPicker({ isOpen, onClose, onEmojiSelect, position = 'bottom' }: EmojiPickerProps) {
  const { themeStyles, isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(0);
  const pickerRef = useRef<HTMLDivElement>(null);
  const emojiContainerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setSearchQuery('');
  };

  // Filter emojis based on search
  const filteredCategories = searchQuery
    ? (() => {
        const lowerCaseSearchQuery = searchQuery.toLowerCase();

        const isSubsequence = (text: string, query: string): boolean => {
          let i = 0; // pointer for text
          let j = 0; // pointer for query
          while (i < text.length && j < query.length) {
            if (text[i] === query[j]) {
              j++;
            }
            i++;
          }
          return j === query.length;
        };

        return EMOJI_CATEGORIES.map(category => {
          const lowerCaseCategoryName = category.name.toLowerCase();
          const filteredEmojis = category.emojis.filter(emoji => {
            return isSubsequence(lowerCaseCategoryName, lowerCaseSearchQuery) ||
                   isSubsequence(emoji.toLowerCase(), lowerCaseSearchQuery);
          });
          return {
            ...category,
            emojis: filteredEmojis,
          };
        }).filter(category => category.emojis.length > 0);
      })()
    : EMOJI_CATEGORIES;

  const positionClasses = position === 'top'
    ? 'bottom-full mb-0'
    : 'top-full mt-2';

  return (
    <div
      ref={pickerRef}
      className={`absolute left-4 right-4 sm:left-0 sm:right-auto sm:w-[352px] ${positionClasses} z-50 rounded-lg shadow-2xl border`}
      style={{
        maxHeight: '420px',
        background: themeStyles.cardBg,
        borderColor: themeStyles.border
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: themeStyles.border }}>
        <h3 className="font-semibold text-sm" style={{ color: themeStyles.text }}>Emoji</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full transition"
          style={{
            color: themeStyles.textSecondary,
            backgroundColor: 'transparent'
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Search */}
      <div className="p-3">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji..."
            className="w-full pl-9 pr-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-[#5494FF] placeholder:text-gray-600"
            style={{
              backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : themeStyles.hoverBg,
              borderColor: isDark ? 'rgba(255,255,255,0.1)' : themeStyles.border,
              color: themeStyles.text
            }}
          />
        </div>
      </div>

      {/* Category Tabs */}
{!searchQuery && (
        <div className="flex gap-1 px-3 pb-1 overflow-x-auto scrollbar-hide">
          {EMOJI_CATEGORIES.map((category, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                setSelectedCategory(index);
                const categoryElement = document.getElementById(`category-${index}`);
                if (categoryElement && emojiContainerRef.current) {
                  emojiContainerRef.current.scrollTop = categoryElement.offsetTop - 120;
                }
              }}
              className={`p-2 rounded-xl text-lg transition flex-shrink-0 ${
                selectedCategory === index ? 'bg-[#5494FF]' : 'hover:brightness-95'
              }`}
              style={{
                backgroundColor: selectedCategory === index ? '#5494FF' : 'transparent',
              }}
            >
              {category.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid - CLEANED UP BUTTONS AND SPACING */}
      <div
        ref={emojiContainerRef}
        className="overflow-y-auto p-3 pt-0 scrollbar-hide"
        style={{
          height: '240px',
          backgroundColor: isDark ? '#0C1014' : themeStyles.background
        }}
      >
        {filteredCategories.map((category, catIdx) => (
          <div key={catIdx} id={`category-${catIdx}`} className="mb-4">
            <h4
              className="text-[10px] font-bold mb-2 uppercase tracking-widest sticky top-0 py-1 z-10"
              style={{
                backgroundColor: isDark ? '#0C1014' : themeStyles.background,
                color: themeStyles.textSecondary
              }}
            >
              {category.name}
            </h4>
            <div className="grid grid-cols-7 gap-1">
              {category.emojis.map((emoji, emoIdx) => (
                <button
                  key={emoIdx}
                  type="button"
                  onClick={(e) => handleEmojiClick(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-2xl rounded-lg transition-transform active:scale-90 hover:opacity-70"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - Recently Used (Optional) */}
      {/* Footer - Recently Used (Optional) */}
      <div
        className="border-t text-center py-1"
        style={{
          backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : themeStyles.hoverBg,
          borderColor: themeStyles.border
        }}
      >
        <p className="text-[10px] font-medium" style={{ color: themeStyles.textSecondary }}>Click an emoji to insert</p>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
