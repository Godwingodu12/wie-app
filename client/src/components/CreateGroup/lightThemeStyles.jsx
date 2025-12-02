const lightThemeStyles = `
  .light input::placeholder,
  .light textarea::placeholder,
  .light select {
    color: #718096 !important;
    font-weight: 100 !important;
    opacity: 1 !important;
  }
  .light select option:first-child {
    color: #718096 !important;
    font-weight: 100 !important;
  }
   .light select option {
    background: white;
    color: black;
  }
    .light input:-webkit-autofill,
  .light input:-webkit-autofill:hover,
  .light input:-webkit-autofill:focus,
  .light input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0px 1000px white inset !important; /* Forces the background color */
    -webkit-text-fill-color: black !important; /* Ensures text is visible */
    caret-color: black !important; /* Ensures cursor is visible */
  }
`;
export default lightThemeStyles