import React, { useState } from 'react';
import { useTheme } from '../home/ThemeContext';
import { ConnectionNavigation } from './ConnectionNavigation';

// Asset Imports
import DeoressionImg from '../../assets/connections/DeoressionImg.png';
import MoveonImg from '../../assets/connections/MoveonImg.png';
import NeutralImg from '../../assets/connections/NeutralImg.png';

export function RelationDetails({
  onProgress,
  onComplete,
  onBack,
}: {
  onProgress: (current: number, total: number) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 3; // Reduced to 3 after removing preferences
  const [formData, setFormData] = useState({
    relationType: '',
    mindset: '',
    hasHistory: '', // 'Yes' or 'No'
    previousDuration: '', // e.g. '0-1 year'
  });
  const { isDark, themeStyles } = useTheme();

  React.useEffect(() => {
    onProgress(step, totalSteps);
  }, [step, onProgress]);

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        const relationOptions = [
          {
            label: 'Long-term Relationship',
            sub: 'Serious commitment with future plans',
            icon: '❤️',
          },
          {
            label: 'Fling',
            sub: 'Short-term, fun connection',
            icon: '✨',
          },
          {
            label: 'We will see the feelings',
            sub: 'Hopeful romantic, open to possibilities',
            icon: '🌙',
          },
          {
            label: 'Friends with benefits',
            sub: 'Casual connection without labels',
            icon: '💭',
          },
        ];
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-left">
              <h1 className="text-4xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                What kind of relationship are you looking for?
              </h1>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {relationOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setFormData({ ...formData, relationType: opt.label })}
                  className={`flex flex-col items-center justify-center text-center transition-all duration-300 p-6 rounded-3xl gap-3 border ${
                    formData.relationType === opt.label
                      ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-xl border-transparent'
                      : (isDark ? 'text-gray-400 border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')
                  }`}
                  style={{ backgroundColor: (formData.relationType !== opt.label) && isDark ? themeStyles.background : undefined, minHeight: '180px' }}
                >
                  <span className="text-5xl">{opt.icon}</span>
                  <div className="flex flex-col gap-1">
                    <div className={`text-xl font-semibold ${formData.relationType === opt.label ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-white' : 'text-gray-900')}`}>
                        {opt.label}
                    </div>
                    <div className={`text-sm ${formData.relationType === opt.label ? (isDark ? 'text-gray-600' : 'text-gray-400') : 'text-gray-500'}`}>
                      {opt.sub}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-8">
              <h1 className="text-4xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                Have you had any relationship before?
              </h1>
              <div className="flex flex-wrap gap-6">
                <button
                  onClick={() => setFormData({ ...formData, hasHistory: 'Yes' })}
                  className={`flex flex-col items-center justify-center gap-4 transition-all duration-300 w-[166px] h-[110px] rounded-3xl border ${
                    formData.hasHistory === 'Yes'
                        ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-xl border-transparent'
                        : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-green-500 ${formData.hasHistory === 'Yes' ? 'shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'opacity-40'}`} />
                  <span className={`font-medium ${formData.hasHistory === 'Yes' ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-white' : 'text-gray-900')}`}>Yes</span>
                </button>
                <button
                  onClick={() => setFormData({ ...formData, hasHistory: 'No' })}
                  className={`flex flex-col items-center justify-center gap-4 transition-all duration-300 w-[166px] h-[110px] rounded-3xl border ${
                    formData.hasHistory === 'No'
                        ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-xl border-transparent'
                        : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full bg-red-500 ${formData.hasHistory === 'No' ? 'shadow-[0_0_12px_rgba(239,68,68,0.6)]' : 'opacity-40'}`} />
                  <span className={`font-medium ${formData.hasHistory === 'No' ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-white' : 'text-gray-900')}`}>No</span>
                </button>
              </div>
            </div>

            <div className="space-y-8 pt-4">
              <h1 className="text-2xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                Duration of your previous relationship?
              </h1>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
                {[
                  { label: '0-1 year', sub: 'Brief relationship' },
                  { label: '1-2 years', sub: 'Moderate duration' },
                  { label: '2-3 years', sub: 'Established relationship' },
                  { label: '3+ years', sub: 'Long-term relationship' },
                ].map((duration) => (
                  <button
                    key={duration.label}
                    onClick={() => setFormData({ ...formData, previousDuration: duration.label })}
                    className={`p-4 rounded-xl flex flex-col items-center justify-center text-center gap-1 transition-all duration-300 h-[90px] border ${
                      formData.previousDuration === duration.label
                        ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 border-transparent shadow-md'
                        : (isDark ? 'text-gray-400 border-white/5' : 'bg-white text-gray-400 hover:bg-gray-50 border-gray-200')
                    }`}
                    style={{ backgroundColor: isDark && formData.previousDuration !== duration.label ? 'transparent' : undefined }}
                  >
                    <span className={`text-sm font-semibold ${formData.previousDuration === duration.label ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-white' : 'text-gray-900')}`}>{duration.label}</span>
                    <span className="text-[10px] opacity-60 px-1">{duration.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      case 3:
        const mindsetOptions = [
          {
            id: 'depression',
            title: 'Depression Stage',
            sub: "It's okay to take time to heal",
            image: DeoressionImg,
            stage: 'Stage 1',
            color: 'bg-gray-400',
          },
          {
            id: 'neutral',
            title: 'Neutral stage',
            sub: 'Moving forward at your own pace',
            image: NeutralImg,
            stage: 'Stage 2',
            color: 'bg-yellow-400',
          },
          {
            id: 'moveon',
            title: 'Move on',
            sub: 'Ready for new beginnings',
            image: MoveonImg,
            stage: 'Stage 3',
            color: 'bg-green-400',
          },
        ];

        // Default to first stage if nothing selected
        const currentMindset = formData.mindset || 'depression';
        const currentIndex = mindsetOptions.findIndex(o => o.id === currentMindset);
        const currentOption = mindsetOptions[currentIndex];

        return (
          <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-6 text-left">
              <h1 className="text-4xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                Which stage are you in now?
              </h1>

              {/* Stage Selector Bar */}
              <div
                className={`max-w-2xl flex items-center rounded-xl p-1 border relative overflow-hidden h-14 ${isDark ? 'border-white/5' : 'bg-gray-100 border-gray-200'}`}
                style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}
              >
                {/* Background Text */}
                <div className="absolute right-4 top-0 bottom-0 flex items-center z-0 pointer-events-none">
                  <span className={`text-[10px] font-semibold uppercase tracking-widest opacity-40 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Slide to change the stages
                  </span>
                </div>

                {/* Main Progress Bar */}
                <div
                  className="absolute left-1 top-1 bottom-1 rounded-lg transition-all duration-500 ease-out z-10 flex items-center justify-center overflow-hidden"
                  style={{
                    width: currentIndex === 0 ? '33.3%' : currentIndex === 1 ? '66.6%' : 'calc(100% - 8px)',
                    backgroundColor: currentIndex === 0 ? '#4B5563' : currentIndex === 1 ? '#FABB2A' : '#A3E635'
                  }}
                >
                  <span className={`${isDark ? 'text-black' : 'text-white'} font-bold text-xs uppercase z-20`}>
                    {currentOption.stage}
                  </span>

                  {/* The White Handle Line */}
                  <div className="absolute right-0 top-0 bottom-0 w-[6px] bg-white rounded-r-md" />
                </div>

                {/* Clickable segments for interaction */}
                {mindsetOptions.map((opt, i) => (
                  <button
                    key={opt.id}
                    onClick={() => setFormData({ ...formData, mindset: opt.id })}
                    className="flex-1 z-20 h-full outline-none"
                  />
                ))}
              </div>
            </div>

            {/* Fuzzies Display */}
            <div className="flex items-end justify-center gap-4 md:gap-12 py-12 min-h-[400px]">
              {mindsetOptions.map((opt, i) => {
                const isSelected = currentMindset === opt.id;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setFormData({ ...formData, mindset: opt.id })}
                    className={`flex flex-col items-center transition-all duration-500 outline-none`}
                    style={{
                      width: isSelected ? '340px' : '180px',
                      opacity: isSelected ? 1 : 0.4,
                      transform: isSelected ? 'scale(1.1)' : 'scale(0.8)',
                    }}
                  >
                    <div className="w-full aspect-square relative mb-6">
                      <img
                        src={typeof opt.image === 'string' ? opt.image : (opt.image as any).src}
                        alt={opt.title}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="text-center space-y-2">
                        <h3 className={`font-semibold transition-all duration-500 ${isSelected ? (isDark ? 'text-white text-2xl' : 'text-gray-900 text-2xl') : 'text-sm text-gray-500'}`}>
                        {opt.title}
                      </h3>
                      {isSelected && (
                        <p className={`text-sm animate-in fade-in duration-700 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {opt.sub}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-[1400px] px-6 py-8">
      <div className="min-h-[400px]">{renderStep()}</div>
      <ConnectionNavigation
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={step === totalSteps ? 'Complete' : undefined}
        backLabel={step === 1 ? 'Go back' : 'Back'}
      />
    </div>
  );
}
