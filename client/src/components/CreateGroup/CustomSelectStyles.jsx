const CustomSelectStyles = (isDark, errors = {}) => ({
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "transparent",
    borderColor: errors[state.selectProps.name] 
      ? '#EF4444' // Red-500 for error
      : state.isFocused ? "#6366F1" : isDark ? "#4A4A4A" : "#000000",
    padding: "0.5rem",
    borderRadius: "0.5rem",
    boxShadow: "none",
    "&:hover": {
      borderColor: errors[state.selectProps.name] ? '#EF4444' : '#6366F1',
    },
  }),
  valueContainer: (provided) => ({
    ...provided,
    padding: "0 2px",
  }),
  input: (provided) => ({
    ...provided,
    color: isDark ? "#FFFFFF" : "#1F2937",
  }),
  singleValue: (provided) => ({
    ...provided,
    color: isDark ? "#FFFFFF" : "#1F2937",
  }),
  placeholder: (provided) => ({
    ...provided,
    color: isDark ? "#6B7280" : "#9CA3AF",
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: isDark ? "#2B2B2B" : "#FFFFFF",
    borderRadius: "0.5rem",
    zIndex: 50,
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#4F46E5"
      : state.isFocused
      ? isDark
        ? "#374151"
        : "#E5E7EB"
      : "transparent",
    color: isDark ? "#FFFFFF" : "#1F2937",
    "&:active": {
      backgroundColor: "#4338CA",
    },
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: isDark ? '#374151' : '#E5E7EB',
    borderRadius: '0.5rem',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: isDark ? '#F3F4F6' : '#1F2937',
    paddingLeft: '0.5rem',
    paddingRight: '0.25rem',
  }),
  multiValueRemove: (provided) => ({
    ...provided,
    color: isDark ? '#9CA3AF' : '#6B7280',
    borderRadius: '0 0.5rem 0.5rem 0',
    ':hover': {
      backgroundColor: '#4F46E5',
      color: 'white',
    },
  }),
  menuList: (provided) => ({
    ...provided,
    "::-webkit-scrollbar": { width: "8px" },
    "::-webkit-scrollbar-track": {
      background: isDark ? "#232426" : "#f1f5f9",
    },
    "::-webkit-scrollbar-thumb": {
      backgroundColor: isDark ? "#4f4f4f" : "#cbd5e1",
      borderRadius: "10px",
      border: `2px solid ${isDark ? "#232426" : "#f1f5f9"}`,
    },
  }),
});
export default CustomSelectStyles;