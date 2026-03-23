import React, { useState } from 'react'
import {
  Rocket,
  Handshake,
  Banknote,
  Briefcase,
  GraduationCap,
  Search,
  Check,
  ChevronDown,
} from 'lucide-react'
import { useTheme } from '../home/ThemeContext';
import { ConnectionNavigation } from './ConnectionNavigation';

// Asset Imports
import IdeaImg from '../../assets/connections/IdeaImg.png'
import EarlyImg from '../../assets/connections/EarlyImg.png'
import GrowthImg from '../../assets/connections/GrowthImg.png'
import EstablishedImg from '../../assets/connections/EstablishedImg.png'

// --- Types ---
type ConnectionType = 'startup' | 'client' | 'investor' | 'hr' | 'mentor'

interface FormData {
  connectionType: ConnectionType | null
  field: string
  stage: string
}

// --- Data Constants ---
const CONNECTION_OPTIONS = [
  {
    id: 'startup',
    title: 'Startup Collaboration',
    subtitle: 'Co-founder, team member, or collaborator',
    icon: Rocket,
    color: 'text-blue-400',
  },
  {
    id: 'client',
    title: 'Client/Customer',
    subtitle: 'Find customers or offer your services',
    icon: Handshake,
    color: 'text-yellow-400',
  },
  {
    id: 'investor',
    title: 'Investor',
    subtitle: 'Angel investors, VCs, or funding sources',
    icon: Banknote,
    color: 'text-green-400',
  },
  {
    id: 'hr',
    title: 'Connect with HR/CEO etc..',
    subtitle: 'Business guidance and mentorship',
    icon: Briefcase,
    color: 'text-pink-400',
  },
  {
    id: 'mentor',
    title: 'Mentor',
    subtitle: 'Business guidance and mentorship',
    icon: GraduationCap,
    color: 'text-orange-400',
  },
]

const FIELDS = [
  'Technology & Software',
  'E-commerce & Retail',
  'Healthcare & Wellness',
  'Finance & Fintech',
  'Education & Edu tech',
  'Marketing & Advertising',
  'Real Estate & Construction',
  'Artificial Intelligence',
  'Design & Creative',
  'Consulting',
]

const STAGES = [
  {
    id: 'idea',
    title: 'Idea Stage',
    subtitle: 'Just starting, concept phase',
    image: IdeaImg,
    color: '#EBD143',
    stage: 'Stage 1',
  },
  {
    id: 'early',
    title: 'Early Stage',
    subtitle: 'MVP built, initial traction',
    image: EarlyImg,
    color: '#B082C5',
    stage: 'Stage 2',
  },
  {
    id: 'growth',
    title: 'Growth Stage',
    subtitle: 'Scaling, proven model',
    image: GrowthImg,
    color: '#2768AD',
    stage: 'Stage 3',
  },
  {
    id: 'established',
    title: 'Established Stage',
    subtitle: 'Stable, established business',
    image: EstablishedImg,
    color: '#A7AAFC',
    stage: 'Stage 4',
  },
]

// --- Sub-Components ---
const Step1Connection = ({
  selected,
  onSelect,
}: {
  selected: ConnectionType | null
  onSelect: (id: ConnectionType) => void
}) => {
  const { isDark, themeStyles } = useTheme();
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {CONNECTION_OPTIONS.map((option) => {
        const Icon = option.icon
        const isSelected = selected === option.id
        return (
          <button
            key={option.id}
            onClick={() => onSelect(option.id as ConnectionType)}
            className={`
              relative group flex flex-col items-center justify-center text-center transition-all duration-300 p-6 h-auto min-h-[180px] rounded-3xl gap-3 border
              ${isSelected
                ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-2xl border-transparent'
                : (isDark ? 'text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')}
            `}
            style={{ backgroundColor: !isSelected && isDark ? themeStyles.background : undefined }}
          >
            <div className={`p-4 rounded-full mb-2 transition-colors ${isSelected ? (isDark ? 'bg-gray-200' : 'bg-gray-700') : (isDark ? 'bg-gray-900 border-white/10' : 'bg-gray-100 border-gray-200 border')}`}>
              <Icon className={`w-10 h-10 md:w-12 md:h-12 ${isSelected ? (isDark ? 'text-black' : 'text-white') : option.color}`} />
            </div>
            <div className="flex flex-col items-center">
              <h3 className={`text-xl font-bold mb-1 ${isSelected ? (isDark ? 'text-black' : 'text-white') : (isDark ? 'text-white' : 'text-gray-900')}`}>
                {option.title}
              </h3>
              <p className={`text-sm ${isSelected ? (isDark ? 'text-gray-600' : 'text-gray-300') : 'text-gray-500'}`}>
                {option.subtitle}
              </p>
            </div>

            {isSelected && (
              <div className="absolute top-4 right-4 text-purple-600">
                <Check className="w-6 h-6" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

const Step2Field = ({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (field: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { isDark, themeStyles } = useTheme();
  const filteredFields = FIELDS.filter((f) =>
    f.toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <div className="w-full max-w-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative">
        <label className={`block text-sm mb-2 ml-1 text-left ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Select your option
        </label>

        <div
          className={`
            w-full border rounded-xl overflow-hidden transition-all duration-300
            ${isDark ? 'border-gray-800' : 'bg-white border-gray-200'}
            ${isOpen
                ? 'ring-2 ring-purple-500/50 border-purple-500'
                : ''}
          `}
          style={{ backgroundColor: isDark ? themeStyles.background : undefined }}
        >
          {/* Search Input Header */}
          <div className={`flex items-center px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
            <Search className={`w-5 h-5 mr-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              placeholder="Search here..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setIsOpen(true)
              }}
              onFocus={() => setIsOpen(true)}
              className={`bg-transparent border-none outline-none w-full ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
            />
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-500' : 'text-gray-500'}`}
              onClick={() => setIsOpen(!isOpen)}
            />
          </div>

          {/* Dropdown List */}
          <div
            className={`
            overflow-y-auto transition-all duration-300
            ${isOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}
          `}
          >
            {filteredFields.map((field) => (
              <button
                key={field}
                onClick={() => {
                  onSelect(field)
                  setSearch(field)
                  setIsOpen(false)
                }}
                className={`
                  w-full text-left px-4 py-3 text-sm transition-colors
                  ${selected === field
                      ? (isDark ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-100 text-purple-700')
                      : (isDark ? 'text-gray-300 hover:bg-gray-900' : 'text-gray-700 hover:bg-gray-100')}
                `}
              >
                {field}
              </button>
            ))}
            {filteredFields.length === 0 && (
              <div className="px-4 py-3 text-gray-500 text-sm">
                No results found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const Step3Stage = ({
  selected,
  onSelect,
}: {
  selected: string
  onSelect: (stage: string) => void
}) => {
  const currentStageIndex = STAGES.findIndex((s) => s.id === selected);
  const progressWidth = ((currentStageIndex + 1) / STAGES.length) * 100;
  const currentStage = STAGES[currentStageIndex];
  const { isDark, themeStyles } = useTheme();

  return (
    <div className="w-full mt-8 animate-in fade-in zoom-in-95 duration-700">
      {/* Interactive Stage Selector Slider */}
      <div className="flex flex-col mb-12 max-w-[1400px]">
        <div
          className={`relative w-full h-14 rounded-xl border cursor-pointer overflow-hidden mb-4 ${isDark ? 'border-white/5' : 'bg-gray-200 border-gray-300'}`}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const percent = x / rect.width;
            const index = Math.min(Math.floor(percent * STAGES.length), STAGES.length - 1);
            onSelect(STAGES[index].id);
          }}
        >
          {/* Color Progress Bar */}
          <div
            className="absolute left-0 top-0 h-full transition-all duration-500 ease-out flex items-center justify-center z-10"
            style={{
              width: `${progressWidth}%`,
              backgroundColor: currentStage.color
            }}
          >
            <span className="text-black font-bold text-sm">
              {currentStage.stage}
            </span>

            {/* Handle Line */}
            <div className="absolute right-0 top-0 h-full w-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
          </div>
        </div>
      </div>

      {/* Scaling Characters Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 items-center justify-items-center gap-8 min-h-[400px]">
        {STAGES.map((stage) => {
          const isSelected = selected === stage.id
          return (
            <div
              key={stage.id}
              onClick={() => onSelect(stage.id)}
              className={`
                flex flex-col items-center transition-all duration-700 cursor-pointer
                ${isSelected ? 'scale-110 lg:scale-125 opacity-100 z-10' : 'scale-90 opacity-40 blur-[1px]'}
              `}
            >
              <div
                className={`
                  relative mb-6 transition-all duration-700
                  ${isSelected ? (isDark ? 'drop-shadow-[0_0_50px_rgba(255,255,255,0.2)]' : 'drop-shadow-[0_0_30px_rgba(0,0,0,0.1)]') : ''}
                `}
              >
                <img
                  src={typeof stage.image === 'string' ? stage.image : (stage.image as any).src}
                  alt={stage.title}
                  className="w-40 h-40 md:w-56 md:h-56 object-contain"
                />
              </div>

              <div className={`text-center transition-all duration-500 ${isSelected ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <h3 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stage.title}
                </h3>
                <p className={`text-base md:text-lg max-w-[250px] mx-auto ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stage.subtitle}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- Main Component ---
export function BusinessDetails({
  onProgress,
  onComplete,
  onBack,
}: {
  onProgress: (current: number, total: number) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>({
    connectionType: null,
    field: '',
    stage: 'idea',
  })
  const totalSteps = 3
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

  const updateFormData = (key: keyof FormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  // Render content based on step
  const renderContent = () => {
    const headingClass = `text-3xl md:text-4xl font-semibold mb-12 animate-in fade-in slide-in-from-left-4 duration-500 text-left`;

    switch (step) {
      case 1:
        return (
          <>
            <h1 className={headingClass} style={{ color: isDark ? themeStyles.text : '#111827' }}>
              What kind of business connection are you looking for?
            </h1>
            <Step1Connection
              selected={formData.connectionType}
              onSelect={(val) => updateFormData('connectionType', val)}
            />
          </>
        )
      case 2:
        return (
          <>
            <h1 className={headingClass} style={{ color: isDark ? themeStyles.text : '#111827' }}>
              What is your field or niche?
            </h1>
            <Step2Field
              selected={formData.field}
              onSelect={(val) => updateFormData('field', val)}
            />
          </>
        )
      case 3:
      case 4:
      case 5:
      case 6:
      case 7:
        return (
          <>
            <h1 className={`${headingClass} mb-4`} style={{ color: isDark ? themeStyles.text : '#111827' }}>
              What stage is your business/career at?
            </h1>
            <Step3Stage
              selected={formData.stage}
              onSelect={(val) => updateFormData('stage', val)}
            />
          </>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full max-w-[1400px] px-4 md:px-6 py-8">
      {/* Main Content */}
      <div className="min-h-[400px] flex flex-col py-8 w-full">
        {renderContent()}
      </div>

      {/* Footer Navigation */}
      <ConnectionNavigation
        onBack={handleBack}
        onNext={handleNext}
        isLastStep={step === totalSteps}
        nextLabel={step === totalSteps ? 'Complete' : undefined}
        backLabel={step === 1 ? 'Go back' : 'Back'}
      />
    </div>
  )
}
