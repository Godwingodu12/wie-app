import PopoverContainer from "./PopoverContainer";

const LanguagePopover = ({ languages, theme }) => (
  <PopoverContainer title="Event language" theme={theme}>
    <ul className="list-disc list-inside space-y-1 ml-4">
      {languages && languages.length > 0 ? (
        languages.map((lang, index) => <li key={index}>{lang}</li>)
      ) : (
        <li>Language information not available.</li>
      )}
    </ul>
  </PopoverContainer>
);

export default LanguagePopover