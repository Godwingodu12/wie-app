import React from 'react';
import { useTheme } from '../home/ThemeContext';

interface ConnectionNavigationProps {
  onBack: () => void;
  onNext: () => void;
  isFirstStep?: boolean;
  isLastStep?: boolean;
  isNextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
}

export const ConnectionNavigation: React.FC<ConnectionNavigationProps> = ({
  onBack,
  onNext,
  isFirstStep = false,
  isLastStep = false,
  isNextDisabled = false,
  nextLabel,
  backLabel = 'Go back',
}) => {
  const { isDark } = useTheme();

  return (
    <div className="flex flex-col md:flex-row justify-start items-center gap-4 w-full mt-6 md:mt-12 mb-8 md:mb-0">
      <button
        onClick={onBack}
        disabled={isFirstStep}
        className={`w-full md:w-[242px] h-[48px] rounded-[25px] border border-[#9575CD] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          isDark
            ? 'text-white hover:bg-white/5 disabled:border-white/20'
            : 'text-gray-700 hover:bg-purple-50 disabled:border-gray-300'
        }`}
      >
        {backLabel}
      </button>
      <button
        onClick={onNext}
        disabled={isNextDisabled}
        className="w-full md:w-[242px] h-[48px] rounded-[25px] bg-gradient-to-b from-[#B3B8E2] via-[#8860D9] to-[#9575CD] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {nextLabel || (isLastStep ? 'Finish' : 'Next')}
      </button>
    </div>
  );
};
