import { useState } from "react";
import InfoTooltip from "./InfoTooltip";

const TagInput = ({ label, tags, onTagsChange, placeholder, darkMode }) => {
  const [inputValue, setInputValue] = useState("");
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      if (!tags.includes(inputValue.trim())) {
        onTagsChange([...tags, inputValue.trim()]);
      }
      setInputValue("");
    }
  };
  const removeTag = (tagToRemove) => {
    onTagsChange(tags.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div>
      <label
        className={`flex items-center text-sm font-medium ${
          darkMode ? "text-gray-400" : "text-black"
        } mb-2`}
      >
        {label} <InfoTooltip note="Press Enter to add a tag." />
      </label>
      <div
        className={`flex flex-wrap items-center gap-2 p-2 bg-transparent border rounded-lg ${
          darkMode ? "border-[#4A4A4A]" : "border-black"
        }`}
      >
        {Array.isArray(tags) &&
          tags.map((tag, index) => (
            <div
              key={index}
              className="flex items-center gap-2 bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 dark:text-indigo-300 px-3 py-1 rounded-full text-sm"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="text-indigo-400 dark:text-indigo-300 hover:text-indigo-600 dark:hover:text-white font-bold"
              >
                ×
              </button>
            </div>
          ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`flex-1 bg-transparent focus:outline-none p-1 ${
            darkMode
              ? "text-white placeholder-gray-500"
              : "text-gray-800 placeholder-gray-400"
          }`}
        />
      </div>
    </div>
  );
};


export default TagInput;