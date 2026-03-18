import React, { useState } from 'react'
import { ChevronLeft, Search, ChevronDown, Check, X } from 'lucide-react'
import { useTheme } from '../home/ThemeContext';
import { ConnectionNavigation } from './ConnectionNavigation';

const EVENT_CATEGORIES = [
  {
    id: 'music',
    label: 'Music',
    icon: '🎵',
  },
  {
    id: 'sports',
    label: 'Sports',
    icon: '⚽',
  },
  {
    id: 'tech',
    label: 'Tech Fest',
    icon: '💻',
  },
  {
    id: 'cultural',
    label: 'Cultural',
    icon: '🎭',
  },
  {
    id: 'art',
    label: 'Art & Design',
    icon: '🎨',
  },
  {
    id: 'literary',
    label: 'Literary',
    icon: '📚',
  },
  {
    id: 'food',
    label: 'Food & Drink',
    icon: '🍕',
  },
  {
    id: 'gaming',
    label: 'Gaming',
    icon: '🎮',
  },
  {
    id: 'fitness',
    label: 'Fitness & Wellness',
    icon: '🏋️',
  },
]

const SAMPLE_EVENTS = [
  'Coldplay concert, Sreekrishnapuram',
  'Billie Eilish concert, Kunnamkulam',
  'Invento 2025, Palakkad',
  'UI/UX meetup, Malappuram',
  'Welcome to illuminati, Barania',
  'Tech Summit 2025, Kochi',
  'Startup Grind, Trivandrum',
]

export function EventsEnjoy({
    onProgress,
    onComplete,
    onBack,
  }: {
    onProgress: (current: number, total: number) => void;
    onComplete: () => void;
    onBack: () => void;
  }) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [isAttending, setIsAttending] = useState<boolean | null>(null)
  const [selectedEvent, setSelectedEvent] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const { isDark, themeStyles } = useTheme();

  // Single step component
  React.useEffect(() => {
    onProgress(1, 1);
  }, [onProgress]);

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    )
  }

  const filteredEvents = SAMPLE_EVENTS.filter((event) =>
    event.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleNext = () => {
    onComplete();
  }

  return (
    <div className="w-full max-w-[1400px] px-4 md:px-6 py-8">
      {/* Main Content */}
      <div className="flex-1 flex flex-col py-8 w-full">
        {/* Question 1: Event Types */}
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl md:text-4xl font-semibold mb-8 text-left" style={{ color: isDark ? themeStyles.text : '#111827' }}>
            Which type of events do you enjoy?
          </h1>

          <div className="flex flex-wrap gap-3">
            {EVENT_CATEGORIES.map((category) => {
              const isSelected = selectedCategories.includes(category.id)
              return (
                <button
                  key={category.id}
                  onClick={() => toggleCategory(category.id)}
                  className={`
                    flex items-center gap-2 px-6 py-3 rounded-full transition-all duration-300 border
                    ${isSelected
                        ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' border-transparent shadow-md'
                        : (isDark ? 'bg-transparent text-gray-400 hover:bg-white/5 border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')}
                  `}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium">
                    {category.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Question 2: Attending Events */}
        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
          <h2 className="text-3xl md:text-4xl font-semibold mb-8 text-left" style={{ color: isDark ? themeStyles.text : '#111827' }}>
            Are you attending any upcoming event?
          </h2>

          <div className="flex gap-6 mb-12">
            <button
              onClick={() => setIsAttending(true)}
              className={`
                group relative w-[140px] h-[140px] md:w-[166px] md:h-[155px] rounded-[24px] flex flex-col items-center justify-center transition-all duration-300 border
                ${isAttending === true
                    ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-2xl border-transparent'
                    : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-400 hover:bg-gray-50 border-gray-200')}
              `}
            >
              <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center border ${isAttending === true ? (isDark ? 'bg-gray-200 border-gray-300' : 'bg-gray-700 border-gray-600') : (isDark ? 'border-white/10' : 'bg-gray-100 border-gray-200')}`}
              style={{ backgroundColor: isAttending !== true && isDark ? themeStyles.pillBg : undefined }}>
                <div className="w-8 h-8 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.4)]" />
              </div>
              <span className="font-medium">Yes</span>
            </button>

            <button
              onClick={() => setIsAttending(false)}
              className={`
                group relative w-[140px] h-[140px] md:w-[166px] md:h-[155px] rounded-[24px] flex flex-col items-center justify-center transition-all duration-300 border
                ${isAttending === false
                    ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-2xl border-transparent'
                    : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-400 hover:bg-gray-50 border-gray-200')}
              `}
            >
              <div className={`w-12 h-12 rounded-full mb-3 flex items-center justify-center border ${isAttending === false ? (isDark ? 'bg-gray-200 border-gray-300' : 'bg-gray-700 border-gray-600') : (isDark ? 'border-white/10' : 'bg-gray-100 border-gray-200')}`}
              style={{ backgroundColor: isAttending !== false && isDark ? themeStyles.pillBg : undefined }}>
                <div className="w-8 h-8 rounded-full bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.4)]" />
              </div>
              <span className="font-bold text-xl">No</span>
            </button>
          </div>

          {/* Conditional Event Selector Dialog */}
          {isAttending === true && (
            <div className={`w-full max-w-[550px] rounded-[24px] p-6 border animate-in fade-in slide-in-from-top-4 duration-500 ${isDark ? 'border-white/10 shadow-none' : 'bg-white border-gray-200 shadow-xl'}`}
            style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}>
              <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-lg`}>Select your event</span>
                <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
              </div>

              <div className="relative mb-6">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </div>
                <input
                  type="text"
                  placeholder="search here..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setIsDropdownOpen(true)
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  className={`w-full h-12 rounded-xl pl-12 pr-4 outline-none border focus:border-purple-500/50 transition-all ${isDark ? 'text-white border-white/10 placeholder-gray-600' : 'bg-white text-gray-900 border-gray-200 placeholder-gray-400'}`}
                  style={{ backgroundColor: isDark ? themeStyles.background : undefined }}
                />
              </div>

              <div className={`space-y-4 max-h-[300px] overflow-y-auto transition-all ${isDropdownOpen ? 'block' : 'hidden'}`}>
                {filteredEvents.map((event, idx) => {
                  const [name, location] = event.split(', ')
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedEvent(event)
                        setSearchQuery(event)
                        setIsDropdownOpen(false)
                      }}
                      className="w-full text-left group transition-colors"
                    >
                      <div className={`font-medium group-hover:text-purple-600 transition-colors ${isDark ? 'text-white group-hover:text-purple-400' : 'text-gray-700'}`}>
                        {name}, <span className={`${isDark ? 'text-gray-500' : 'text-gray-500'} font-normal`}>{location}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <ConnectionNavigation
        onBack={onBack}
        onNext={handleNext}
        nextLabel="Next"
      />
    </div>
  )
}
