import React, { useState } from 'react'
import { ChevronLeft, Search, ChevronDown } from 'lucide-react'
import { useTheme } from '../home/ThemeContext';
import { ConnectionNavigation } from './ConnectionNavigation';

// Asset Imports
import beginnerImg from '../../assets/connections/beginnerImg.png'
import IntermediateImg from '../../assets/connections/IntermediateImg.png'
import ExpertImg from '../../assets/connections/ExpertImg.png'

// --- Constants ---
const CATEGORIES = [
  'Programming & Tech',
  'Creative Arts',
  'Music',
  'Languages',
  'Business Skills',
  'Writing',
  'Fitness',
]

const SUB_CATEGORIES = [
  'Python',
  'JavaScript',
  'Web Dev',
  'Data Science',
  'Figma',
  'Framer',
  'Webflow',
]

const STAGES = [
  {
    id: 1,
    title: 'Complete Beginner',
    subtitle: 'Never tried',
    image: beginnerImg.src || beginnerImg,
    color: '#B1E28E',
    textColor: 'text-[#B1E28E]',
  },
  {
    id: 2,
    title: 'Intermediate',
    subtitle: 'Some experience',
    image: IntermediateImg.src || IntermediateImg,
    color: '#8EA1E2',
    textColor: 'text-[#8EA1E2]',
  },
  {
    id: 3,
    title: 'Expert',
    subtitle: 'Skilled, want to master',
    image: ExpertImg.src || ExpertImg,
    color: '#00BBFF',
    textColor: 'text-[#00BBFF]',
  },
]

// --- Components ---
const SelectionPanel = ({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: string[]
  selected: string
  onSelect: (val: string) => void
}) => {
  const [search, setSearch] = useState('')
  const { isDark, themeStyles } = useTheme();
  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className={`w-full max-w-[400px] rounded-[24px] p-6 border flex flex-col h-[450px] ${isDark ? 'border-white/10' : 'bg-white border-gray-200'}`}
    style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}>
      <div className="flex items-center justify-between mb-4">
        <span className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</span>
        <ChevronDown className="w-5 h-5 text-gray-500" />
      </div>

      <div className="relative mb-6">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <Search className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
        <input
          type="text"
          placeholder="search here..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full h-12 rounded-xl pl-12 pr-4 outline-none border focus:border-purple-500/50 transition-all text-sm ${isDark ? 'text-white border-white/10 placeholder-gray-600' : 'bg-white text-gray-900 border-gray-200 placeholder-gray-400'}`}
          style={{ backgroundColor: isDark ? themeStyles.background : undefined }}
        />
      </div>

      <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2">
        {filtered.map((opt, idx) => {
          const isSelected = selected === opt
          return (
            <button
              key={idx}
              onClick={() => onSelect(opt)}
              className={`
                w-full text-left px-4 py-3 rounded-xl transition-all duration-300
                ${isSelected ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' font-bold' : (isDark ? 'text-gray-400 hover:bg-white/5' : 'text-gray-600 hover:bg-gray-100')}
              `}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export function SkillsDetails({
    onProgress,
    onComplete,
    onBack,
  }: {
    onProgress: (current: number, total: number) => void;
    onComplete: () => void;
    onBack: () => void;
}) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState('')
  const [subCategory, setSubCategory] = useState('')
  const [stage, setStage] = useState(1)
  const totalSteps = 2
  const { isDark, themeStyles } = useTheme();

  React.useEffect(() => {
    onProgress(step, totalSteps);
  }, [step, onProgress]);

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1)
    else {
      onComplete()
    }
  }
  const handleBack = () => {
    if (step > 1) setStep(step - 1)
    else onBack()
  }

  return (
    <div className="w-full max-w-[1400px] px-6 py-8">
      {/* Main Content */}
      <div className="flex-1 flex flex-col py-8 w-full">
        {step === 1 ? (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-semibold mb-12 text-left" style={{ color: isDark ? themeStyles.text : '#111827' }}>
              What skill do you want to develop?
            </h1>

            <div className="flex flex-wrap gap-8">
              <SelectionPanel
                label="Select a category"
                options={CATEGORIES}
                selected={category}
                onSelect={setCategory}
              />
              <SelectionPanel
                label="Select a sub category"
                options={SUB_CATEGORIES}
                selected={subCategory}
                onSelect={setSubCategory}
              />
            </div>
          </div>
        ) : (
          <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h1 className="text-4xl font-semibold mb-8 text-left" style={{ color: isDark ? themeStyles.text : '#111827' }}>
              Which stage are you in now?
            </h1>

            {/* Stage Slider */}
            <div className="flex flex-col mb-12 max-w-[1200px]">
              <div
                className={`relative w-full h-14 rounded-xl border cursor-pointer overflow-hidden mb-4 ${isDark ? 'border-white/5' : 'bg-gray-200 border-gray-300'}`}
                style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined }}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const percent = x / rect.width;
                  const index = Math.min(Math.floor(percent * STAGES.length), STAGES.length - 1);
                  setStage(STAGES[index].id);
                }}
              >
                {/* Color Progress Bar */}
                <div
                  className="absolute left-0 top-0 h-full transition-all duration-500 ease-out flex items-center justify-center z-10"
                  style={{
                    width: `${(stage / STAGES.length) * 100}%`,
                    backgroundColor: STAGES[stage - 1].color
                  }}
                >
                  <span className="text-black font-bold text-sm">
                    Stage {stage}
                  </span>

                  {/* Handle Line */}
                  <div className="absolute right-0 top-0 h-full w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
                </div>
              </div>
            </div>

            {/* 3D Character Carousel */}
            <div className="flex flex-col md:flex-row items-center justify-start gap-12 md:gap-16 min-h-[400px] pb-12">
              {STAGES.map((s) => {
                const isActive = stage === s.id
                return (
                  <div
                    key={s.id}
                    onClick={() => setStage(s.id)}
                    className={`
                      cursor-pointer transition-all duration-700 ease-out flex flex-col items-center relative
                      ${isActive ? 'scale-110 opacity-100 z-10' : 'scale-90 opacity-30 blur-[1px]'}
                    `}
                  >
                    <div className={`relative mb-6 transition-all duration-700 ${isActive ? 'drop-shadow-xl' : ''}`}>
                      <img
                        src={typeof s.image === 'string' ? s.image : (s.image as any).src}
                        alt={s.title}
                        className={`object-contain transition-all duration-500
                          ${isActive ? 'h-80 md:h-96' : 'h-64 md:h-80'}
                        `}
                      />
                    </div>

                    <div
                      className={`mt-6 text-center transition-all duration-500 w-48
                      ${isActive ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}
                    `}
                    >
                      <h3 className={`text-xl font-normal mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {s.title}
                      </h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{s.subtitle}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <ConnectionNavigation
        onBack={handleBack}
        onNext={handleNext}
        nextLabel={step === totalSteps ? 'Complete' : undefined}
        backLabel={step === 1 ? 'Go back' : 'Back'}
      />
    </div>
  )
}
