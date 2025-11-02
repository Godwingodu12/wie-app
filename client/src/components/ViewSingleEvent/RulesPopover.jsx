import PopoverContainer from "./PopoverContainer";

const RulesPopover = ({ rules, theme }) => (
  <PopoverContainer title="Rules and Regulations" theme={theme} >
    <p className="whitespace-pre-wrap text-justify leading-relaxed px-2">{rules}</p>
  </PopoverContainer>
);
export default RulesPopover