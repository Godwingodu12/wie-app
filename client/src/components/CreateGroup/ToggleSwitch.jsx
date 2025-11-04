const ToggleSwitch = ({ label, checked, onChange, disabled = false }) => (
  <div className="flex gap-2">
    <div>{label}</div>

    <label
      className={`relative inline-flex items-center ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
      <div className="w-11 h-6 bg-gray-500 dark:bg-[#363A3F] rounded-full peer peer-checked:bg-indigo-600 shadow-inner-dark after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
    </label>
  </div>
);
export default ToggleSwitch;
