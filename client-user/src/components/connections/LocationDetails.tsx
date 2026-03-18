import React, { useState } from 'react'
import boyImg from '../../assets/connections/boyImg.png'
import girlImg from '../../assets/connections/girlImg.png'
import { useTheme } from '../home/ThemeContext';
import { ConnectionNavigation } from './ConnectionNavigation';

interface LookingForOption {
  label: string;
  image?: any;
  images?: any[];
}

export function LocationDetails({
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
    lookingFor: 'Boys',
    yourNeed: '',
    nearLocation: 'Yes',
    activities: [] as string[],
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
  const toggleActivity = (activity: string) => {
    if (formData.activities.includes(activity)) {
      setFormData({
        ...formData,
        activities: formData.activities.filter((a) => a !== activity),
      })
    } else {
      setFormData({
        ...formData,
        activities: [...formData.activities, activity],
      })
    }
  }
  const renderStep = () => {
    switch (step) {
      case 1:
        const lookingForOptions: LookingForOption[] = [
          {
            label: 'Boys',
            image: boyImg,
          },
          {
            label: 'Girls',
            image: girlImg,
          },
          {
            label: 'Random',
            images: [boyImg, girlImg],
          },
        ]
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-left">
              <h1 className="text-4xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                Are you looking for?
              </h1>
            </div>

            {/* Selection Cards */}
            <div className="flex flex-wrap gap-6">
              {lookingForOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      lookingFor: option.label,
                    })
                  }
                  className={`rounded-[24px] flex flex-col items-center justify-center text-center transition-all duration-300 w-[166px] h-[155px] gap-[10px] p-[12px_12px_24px_12px] border ${
                    formData.lookingFor === option.label
                      ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-2xl border-transparent'
                      : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-400 hover:bg-gray-50 border-gray-200')
                  }`}
                >
                  <div className="flex -space-x-6 mb-2">
                    {option.images ? (
                      option.images.map((img, i) => (
                        <img
                          key={i}
                          src={typeof img === 'string' ? img : (img as any).src}
                          alt=""
                          className="w-20 h-20 object-contain"
                        />
                      ))
                    ) : (
                      <img
                        src={typeof option.image === 'string' ? option.image : (option.image as any).src}
                        alt=""
                        className="w-20 h-20 object-contain"
                      />
                    )}
                  </div>
                  <div className={`font-bold text-xl ${formData.lookingFor === option.label ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-white' : 'text-gray-900')}`}>{option.label}</div>
                </button>
              ))}
            </div>

            {/* Your Need Section */}
            <div className="space-y-2 max-w-2xl">
              <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Your need</label>
              <textarea
                placeholder="Eg:Looking for someone to join me at the coffee shop for co-working"
                value={formData.yourNeed}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    yourNeed: e.target.value,
                  })
                }
                className={`w-full h-32 border rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500 transition-colors resize-none ${
                    isDark
                    ? 'border-white/10 text-white placeholder-gray-600'
                    : 'border-gray-200 bg-white text-gray-900 placeholder-gray-400'
                }`}
                style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}
              />
            </div>
          </div>
        )
      case 2:
        const locationOptions = [
          {
            label: 'Yes',
            subtitle: 'They should be within 1-5km of you',
            value: 'Yes',
          },
          {
            label: 'No',
            subtitle: 'They can be anywhere in my city/region',
            value: 'No',
          },
          {
            label: 'Maybe',
            subtitle:
              'They can be anywhere/Flexible on distance in my city/region',
              value: 'Maybe',
          },
        ]
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-left">
              <h1 className="text-4xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                Is that person near your location right now?
              </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-6">
              {locationOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setFormData({
                      ...formData,
                      nearLocation: option.value,
                    })
                  }
                  className={`p-6 rounded-2xl flex flex-col items-center text-center gap-3 transition-all duration-300 min-h-[140px] justify-center border ${
                    formData.nearLocation === option.value
                        ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' border-2 border-white/20 shadow-xl'
                        : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-400 hover:bg-gray-50 border-gray-200')
                  }`}
                >
                  <div className={`font-semibold text-lg ${formData.nearLocation === option.value ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-white' : 'text-gray-900')}`}>{option.label}</div>
                  <div
                    className={`text-xs ${formData.nearLocation === option.value ? (isDark ? 'text-gray-600' : 'text-gray-400') : (isDark ? 'text-gray-500' : 'text-gray-500')}`}
                  >
                    {option.subtitle}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )
      case 3:
        const activities = [
          [
            {
              label: 'Entertainment Shows',
              icon: '🎭',
            },
            {
              label: 'Sports',
              icon: '⚡',
            },
            {
              label: 'Tech Fest',
              icon: '💻',
            },
            {
              label: 'Concert',
              icon: '🎸',
            },
            {
              label: 'Payout/Camping',
              icon: '⛺',
            },
          ],
          [
            {
              label: 'Movies',
              icon: '🎬',
            },
            {
              label: 'Theater',
              icon: '🎪',
            },
            {
              label: 'Comedy shows',
              icon: '🎭',
            },
          ],
        ]
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-left">
              <h1 className="text-4xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                Are you currently at or heading to any specific activity/event?
              </h1>
            </div>

            <div className="space-y-4 py-6">
              {activities.map((row, i) => (
                <div key={i} className="flex flex-wrap gap-3">
                  {row.map((activity) => {
                    const isSelected = formData.activities.includes(
                      activity.label,
                    )
                    return (
                      <button
                        key={`${activity.label}-${i}`}
                        onClick={() => toggleActivity(activity.label)}
                        className={`px-4 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 border ${
                          isSelected
                            ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' border-transparent'
                            : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')
                        }`}
                      >
                        <span>{activity.icon}</span>
                        {activity.label}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        )
      default:
        return null
    }
  }
  return (
    <div className="w-full max-w-[1400px] px-4 md:px-6 py-8">
      {/* Internal Progress Bar Removed - handled by parent */}

      <div className="min-h-[400px]">{renderStep()}</div>

      <ConnectionNavigation
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={step === totalSteps ? 'Complete' : undefined}
        backLabel={step === 1 ? 'Go back' : 'Back'}
      />
    </div>
  )
}
