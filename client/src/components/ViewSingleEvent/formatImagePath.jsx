const API_BASE_URL = import.meta.env.VITE_TICKET_API_BASE_URL;

const formatImagePath = (path) => {
  if (typeof path !== "string" || !path) return "";

  const cleanPath = path.replace("src\\", "").replace(/\\/g, "/");
  return `${API_BASE_URL}/${cleanPath}`;
};
export default formatImagePath;
