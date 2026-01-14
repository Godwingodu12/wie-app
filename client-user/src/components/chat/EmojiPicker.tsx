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
    ? 'bottom-full mb-0' 
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
<div className="p-3">
        <div className="relative flex items-center">
          <Search size={14} className="absolute left-3 text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search emoji..."
            className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-1 focus:ring-[#5494FF] placeholder:text-gray-600"
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
                selectedCategory === index ? 'bg-[#5494FF]' : 'hover:bg-white/5'
              }`}
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
        style={{ height: '240px' }}
      >
        {filteredCategories.map((category, catIdx) => (
          <div key={catIdx} id={`category-${catIdx}`} className="mb-4">
            <h4 className="text-[10px] font-bold text-gray-500 mb-2 uppercase tracking-widest sticky top-0 bg-[#1a1a1aff] py-1">
              {category.name}
            </h4>
            <div className="grid grid-cols-7 gap-1">
              {category.emojis.map((emoji, emoIdx) => (
                <button
                  key={emoIdx}
                  type="button"
                  onClick={(e) => handleEmojiClick(emoji)}
                  className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-white/10 rounded-lg transition-transform active:scale-90"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer - Recently Used (Optional) */}
<div className="bg-black/20 border-t border-white/5 text-center">
        <p className="text-[10px] text-gray-500 font-medium">Click an emoji to insert</p>
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
