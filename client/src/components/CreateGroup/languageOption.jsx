const languageOptions = [
  "English", "Hindi", "Malayalam", "Tamil", "Kannada", "Telugu", "Marathi", "Gujarati", "Punjabi", "Urdu", "Bengali",
  "Odia", "Assamese", "Sanskrit", "Konkani", "Maithili", "Manipuri", "Nepali", "Sinhala",
  "Spanish", "French", "German", "Italian", "Dutch", "Greek", "Polish", "Swedish", "Norwegian", "Danish", "Finnish",
  "Portuguese", "Romanian", "Hungarian", "Czech", "Slovak", "Ukrainian", "Bulgarian", "Serbian", "Croatian",
  "Russian", "Turkish", "Chinese (Mandarin)", "Chinese (Cantonese)", "Japanese", "Korean", "Thai", "Vietnamese", "Indonesian", "Malay", "Filipino",
  "Arabic", "Persian (Farsi)", "Hebrew","Swahili", "Zulu", "Afrikaans","Other"
].map((lang) => ({ value: lang, label: lang }));

export default languageOptions;
