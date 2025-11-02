import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import PreferenceCard from "./PreferenceCard";

const PreferenceModal = ({ onClose, preferences, theme }) => {
 const [currentIndex, setCurrentIndex] = useState(1);
 const handlePrev = () => {
  setCurrentIndex((prev) => (prev === 0 ? preferences.length - 1 : prev - 1));
 };
 const handleNext = () => {
  setCurrentIndex((prev) => (prev === preferences.length - 1 ? 0 : prev + 1));
 };

 return (
<div
className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
onClick={onClose}
 >
 <div
 className="p-8 rounded-xl relative max-w-lg w-full shadow-2xl"
 style={{ backgroundColor: theme.cardBg }}
 onClick={(e) => e.stopPropagation()}
>
 <div className="flex justify-between items-center mb-6">
  <h2 className={`text-2xl font-bold ${theme.textColor}`}>
   Event Preferences
  </h2>
  <button
   onClick={onClose}
   className={`p-1 rounded-full ${theme.textColor} hover:opacity-80 transition-opacity`}
   style={{ boxShadow: theme.shadowOutset }}
  >
   <X size={20} />
  </button>
 </div>

 <div className="flex items-center justify-center">
<button
 onClick={handlePrev}
 className={`p-2 rounded-full ${theme.textColor} hover:opacity-80 transition-opacity`}
 style={{ boxShadow: theme.shadowOutset }}
>
 <ChevronLeft size={24} />
</button>
<div className="flex overflow-hidden relative w-60 h-72">
{preferences.map((pref, index) => {
 const isCurrent = index === currentIndex;

 const offset = index - currentIndex;
 const translateX = offset * 264;
 
 return (
  <div
key={pref.type}
 className="absolute inset-0 transition-transform duration-500 flex items-center justify-center"
style={{
transform: `translateX(${translateX}px)`,
opacity: isCurrent ? 1 : 0.4,
 }}
 >
<PreferenceCard
pref={pref}
 theme={theme}
 isCurrent={isCurrent}
 />
</div>
 );
 })}
 </div>

 <button
 onClick={handleNext}
 className={`p-2 rounded-full ${theme.textColor} hover:opacity-80 transition-opacity`}
 style={{ boxShadow: theme.shadowOutset }}
 >
 <ChevronRight size={24} />
 </button>
 </div>

{/* Indicator Dots */}
 <div className="flex justify-center space-x-2 mt-6">
 {preferences.map((_, index) => (
 <div
 key={index}
className={`w-2 h-2 rounded-full transition-colors duration-300 ${
index === currentIndex ? "bg-[#5E5CE6]" : "bg-gray-600"
 }`}
 ></div>
))}
 </div>
 </div>
 </div>
 );
};
export default PreferenceModal;