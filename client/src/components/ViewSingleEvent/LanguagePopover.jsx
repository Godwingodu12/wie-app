import PopoverContainer from "./PopoverContainer";

const LanguagePopover = ({ languages, theme }) => (
  <PopoverContainer title="Event language" theme={theme}>
    <div className="pr-2">
      <ul className="list-disc list-inside space-y-1 ml-4 custom-scrollbar max-h-24 overflow-y-auto pr-2">
        {languages && languages.length > 0 ? (
          languages.map((lang, index) => (
            <li key={index} className="text-sm">
              {lang}
            </li>
          ))
        ) : (
          <li className="text-sm">Language information not available.</li>
        )}
      </ul>
    </div>
  </PopoverContainer>
);

export default LanguagePopover;
