'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';

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
  }
];

export default function EmojiPicker({ isOpen, onClose, onEmojiSelect, position = 'bottom' }: EmojiPickerProps) {
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
    ? EMOJI_CATEGORIES.map(category => ({
        ...category,
        emojis: category.emojis.filter(emoji => 
          emoji.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.emojis.length > 0)
    : EMOJI_CATEGORIES;

  const positionClasses = position === 'top' 
    ? 'bottom-full mb-2' 
    : 'top-full mt-2';

  return (
    <div 
      ref={pickerRef}
      className={`absolute left-0 ${positionClasses} z-50 bg-[#1a1a1a] border border-[#2D2F39] rounded-lg shadow-2xl`}
      style={{ width: '352px', maxHeight: '420px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#2D2F39]">
        <h3 className="text-white font-semibold text-sm">Emoji</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-[#2D2F39] rounded-full transition"
        >
          <X size={18} className="text-gray-400" />
        </button>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-[#2D2F39]">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji..."
            className="w-full pl-9 pr-3 py-2 bg-[#0C1014] border border-[#2D2F39] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#8860D9]"
          />
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex gap-1 px-3 py-2 border-b border-[#2D2F39] overflow-x-auto scrollbar-hide">
          {EMOJI_CATEGORIES.map((category, index) => (
            <button
              key={index}
              onClick={() => {
                setSelectedCategory(index);
                // Scroll to category
                const categoryElement = document.getElementById(`category-${index}`);
                if (categoryElement && emojiContainerRef.current) {
                  emojiContainerRef.current.scrollTop = categoryElement.offsetTop - 100;
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-xl transition flex-shrink-0 ${
                selectedCategory === index
                  ? 'bg-[#8860D9]'
                  : 'hover:bg-[#2D2F39]'
              }`}
            >
              {category.name.split(' ')[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div 
        ref={emojiContainerRef}
        className="overflow-y-auto p-3 space-y-4"
        style={{ maxHeight: '280px' }}
      >
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} id={`category-${categoryIndex}`}>
              <h4 className="text-xs font-semibold text-gray-400 mb-2 sticky top-0 bg-[#1a1a1a] py-1">
                {category.name}
              </h4>
              <div className="grid grid-cols-8 gap-1">
                {category.emojis.map((emoji, emojiIndex) => (
                  <button
                    key={emojiIndex}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-[#2D2F39] rounded-lg transition"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <span className="text-4xl mb-2">😕</span>
            <p className="text-sm">No emoji found</p>
          </div>
        )}
      </div>

      {/* Footer - Recently Used (Optional) */}
      <div className="p-3 border-t border-[#2D2F39] bg-[#0C1014] rounded-b-lg">
        <p className="text-xs text-gray-500 text-center">
          Click an emoji to insert
        </p>
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