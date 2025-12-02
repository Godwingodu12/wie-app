const darkThemeStyles = `
  .dark input::placeholder,
  .dark textarea::placeholder,
  .dark select {
    color: white !important;
    font-weight: 100 !important;
    opacity: 0.8 !important;
  }
  .dark select option:first-child {
    color: white !important;
    font-weight: 100 !important;
  }
  .dark select option {
    background: #212426;
    color: white;
  }
  .dark input:-webkit-autofill,
  .dark input:-webkit-autofill:hover,
  .dark input:-webkit-autofill:focus,
  .dark input:-webkit-autofill:active {
    -webkit-box-shadow: 0 0 0px 1000px #212426 inset !important; /* Matches your dark background */
    -webkit-text-fill-color: white !important; /* Ensures text is white */
    caret-color: white !important; /* Ensures cursor is white */
  }
`;

export default darkThemeStyles