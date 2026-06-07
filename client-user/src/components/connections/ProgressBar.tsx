import React from 'react';
import { useTheme } from '../home/ThemeContext';
import { ChevronLeft } from 'lucide-react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
}

export function ProgressBar({
  currentStep,
  totalSteps,
  onBack,
}: ProgressBarProps) {
  const { isDark } = useTheme();

  return (
    <div className="flex items-center gap-4 mb-8">
      <button
        onClick={onBack}
        className={`transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'}`}
      >
        <ChevronLeft size={24} />
      </button>

      <div className={`flex-1 h-1 rounded-full overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
        <div
          className="h-full bg-[#8b5cf6] transition-all duration-300 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {currentStep}/{totalSteps}
      </span>
    </div>
  )
}
