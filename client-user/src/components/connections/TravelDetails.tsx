import React, { useState } from 'react'
import { Calendar, Plus, MapPin } from 'lucide-react'
import { useTheme } from '../home/ThemeContext';
import { ConnectionNavigation } from './ConnectionNavigation';

export function TravelDetails({
  onProgress,
  onComplete,
  onBack,
}: {
  onProgress: (current: number, total: number) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(1)
  const totalSteps = 3
  // Form State
  const [formData, setFormData] = useState({
    destinations: [] as string[],
    location: '',
    date: '',
    connectionType: 'Group of Peoples',
    specificGroup: 'Boys only',
    travelStyles: [] as string[],
  })
  const { isDark, themeStyles } = useTheme();

  React.useEffect(() => {
    onProgress(step, totalSteps);
  }, [step, onProgress]);

  const handleNext = () => {
    if (step < totalSteps) {
        setStep(step + 1)
    } else {
        onComplete();
    }
  }
  const handleBack = () => {
    if (step > 1) {
        setStep(step - 1)
    } else {
        onBack();
    }
  }
  const toggleStyle = (style: string) => {
    if (formData.travelStyles.includes(style)) {
      setFormData({
        ...formData,
        travelStyles: formData.travelStyles.filter((s) => s !== style),
      })
    } else {
      setFormData({
        ...formData,
        travelStyles: [...formData.travelStyles, style],
      })
    }
  }
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-left">
              <h1 className="text-3xl md:text-4xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                Did you have any specific destinations, or are you planning for
                a travel?
              </h1>
            </div>

            {/* Quick Select Chips */}
            <div className="flex flex-wrap gap-3">
              {[
                'Nagarhole, Karnataka',
                'Periyar, Kerala',
                'Pench, Madhya Pradesh',
              ].map((loc) => (
                <button
                  key={loc}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors border ${
                    isDark
                      ? 'text-gray-300 hover:text-white border-white/5 bg-transparent'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 border-gray-200 bg-white'
                  }`}
                  style={{ backgroundColor: isDark ? 'transparent' : undefined }}
                >
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                    <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-gray-500'}`} />
                  </div>
                  <span className="text-sm">{loc}</span>
                </button>
              ))}
            </div>

            {/* Location Input */}
            <div className="space-y-4 max-w-2xl">
              <div className="space-y-2">
                <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Location</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="City/Region, Country"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        location: e.target.value,
                      })
                    }
                    className={`flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors ${
                      isDark
                        ? 'text-white placeholder-gray-600 border-white/10'
                        : 'bg-white text-gray-900 placeholder-gray-400 border-gray-200'
                    }`}
                    style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}
                  />
                  <button
                      className={`w-12 h-12 border rounded-xl flex items-center justify-center transition-colors ${
                        isDark
                          ? 'border-white/10 text-gray-400 hover:text-white'
                          : 'border-gray-200 bg-white text-gray-400 hover:text-gray-600'
                      }`}
                      style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}
                  >
                    <MapPin size={20} />
                  </button>
                </div>
              </div>

              {/* Map Placeholder */}
              <div
                  className={`w-full h-48 rounded-xl border overflow-hidden relative group ${
                    isDark ? 'border-white/10' : 'border-gray-200 bg-gray-50'
                  }`}
                  style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}
              >
                <div className={`absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Simple_world_map.svg/2000px-Simple_world_map.svg.png')] bg-cover bg-center grayscale ${isDark ? 'invert' : ''}`} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Map Preview</span>
                </div>
              </div>

              {/* Date Input */}
              <div className="space-y-2">
                <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date of visit</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Select a date"
                    value={formData.date}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        date: e.target.value,
                      })
                    }
                    className={`w-full border rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-colors ${
                      isDark
                        ? 'border-white/10 text-white placeholder-gray-600'
                        : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'
                    }`}
                    style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}
                  />
                  <Calendar
                    className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                    size={18}
                  />
                </div>
              </div>

              {/* Add More Button */}
              <div className="flex flex-col items-start gap-2 pt-4">
                <button className={`px-6 py-3 bg-[#10b981] hover:bg-[#059669] text-white rounded-full flex items-center gap-2 font-medium transition-colors shadow-lg ${isDark ? 'shadow-emerald-900/20' : 'shadow-emerald-500/20'}`}>
                  <span>Add more locations</span>
                  <Plus size={18} />
                </button>
                <span className="text-xs text-gray-500">
                  You can add maximum 5 locations
                </span>
              </div>
            </div>
          </div>
        )
      case 2:
        const mainOptions = [
          {
            label: 'Group of Peoples',
            sub: '4+ member',
            icon: '👨‍👩‍👧‍👦',
          },
          {
            label: 'Single person',
            sub: 'Find one travel buddy',
            icon: '🧳',
          },
          {
            label: 'Two person',
            sub: 'Join an existing duo or form a trio',
            icon: '👫',
          },
        ]
        const groupOptions = [
          {
            label: 'Boys only',
            sub: 'This group include only boys',
            icon: '👨‍👨‍👦',
          },
          {
            label: 'Girls only',
            sub: 'This group include only girls',
            icon: '👩‍👩‍👧',
          },
          {
            label: 'Boys & Girls',
            sub: 'This is a mixed group',
            icon: '👫',
          },
        ]
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-left">
              <h1 className="text-3xl md:text-4xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                What type of travel connection are you looking for?
              </h1>
            </div>

            {/* Main Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mainOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      connectionType: opt.label,
                    })
                  }
                  className={`p-10 rounded-[32px] flex flex-col items-center text-center gap-6 transition-all duration-300 border ${
                    formData.connectionType === opt.label
                      ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-xl border-transparent'
                      : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')
                  }`}
                >
                  <span className="text-6xl">{opt.icon}</span>
                  <div>
                    <div className={`text-2xl font-bold mb-2 ${formData.connectionType === opt.label ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-white' : 'text-gray-900')}`}>
                      {opt.label}
                    </div>
                    <div
                      className={`text-sm ${formData.connectionType === opt.label ? (isDark ? 'text-gray-600' : 'text-gray-400') : 'text-gray-500'}`}
                    >
                      {opt.sub}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-6 pt-8">
              <h3 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Specific group</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        specificGroup: opt.label,
                      })
                    }
                    className={`p-10 rounded-[32px] flex flex-col items-center text-center gap-6 transition-all duration-300 border ${
                      formData.specificGroup === opt.label
                        ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-xl border-transparent'
                        : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')
                    }`}
                  >
                    <span className="text-6xl">{opt.icon}</span>
                    <div>
                        <div className={`text-2xl font-bold mb-2 ${formData.specificGroup === opt.label ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-white' : 'text-gray-900')}`}>
                        {opt.label}
                      </div>
                      <div
                        className={`text-sm ${formData.specificGroup === opt.label ? (isDark ? 'text-gray-600' : 'text-gray-400') : 'text-gray-500'}`}
                      >
                        {opt.sub}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )
      case 3:
        const styles = [
          {
            label: 'Budget Backpacking',
            icon: '🏕️',
          },
          {
            label: 'Comfortable Hotels',
            icon: '🏨',
          },
          {
            label: 'Camping & Outdoors',
            icon: '⛺',
          },
          {
            label: 'Photography-focused',
            icon: '📷',
          },
          {
            label: 'Food & Culinary',
            icon: '🍜',
          },
          {
            label: 'Historical & Cultural',
            icon: '🏛️',
          },
          {
            label: 'Beach & Relaxation',
            icon: '🏖️',
          },
          {
            label: 'Adventure & Sports',
            icon: '🪂',
          },
          {
            label: 'Nightlife & Parties',
            icon: '🎉',
          },
          {
            label: 'Wellness & Retreat',
            icon: '🧘',
          },
        ];
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-left">
              <h1 className="text-3xl md:text-4xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                What's your travel style?
              </h1>
            </div>

            <div className="flex flex-wrap gap-4 py-6">
              {styles.map((style) => {
                const isSelected = formData.travelStyles.includes(style.label);
                return (
                  <button
                    key={style.label}
                    onClick={() => toggleStyle(style.label)}
                    className={`px-6 py-4 rounded-full text-base font-medium transition-all flex items-center gap-3 border ${
                      isSelected
                        ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' font-bold border-transparent shadow-md'
                        : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')
                    }`}
                  >
                    <span className="text-xl">{style.icon}</span>
                    {style.label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-[1400px] px-4 md:px-6 py-8">
      {/* Step Content */}
      <div className="flex-1 flex flex-col py-8 w-full min-h-[500px]">
        {renderStep()}
      </div>

      {/* Buttons */}
      <ConnectionNavigation
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={step === totalSteps ? 'Complete' : undefined}
        backLabel={step === 1 ? 'Go back' : 'Back'}
      />
    </div>
  )
}
