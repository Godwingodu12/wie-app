import { Text, View } from "react-native";

export const Tag = ({ label }: { label: string }) => {
  const isFree = label.toLowerCase() === "free";
  const isPaid = label.toLowerCase() === "paid";

  // Define exact color strings to ensure NativeWind compiler sees them
  const bgColor = isFree 
    ? "bg-green-900/40" 
    : isPaid 
      ? "bg-yellow-600/20" 
      : "bg-gray-800/60";

  const textColor = isFree 
    ? "text-green-400" 
    : isPaid 
      ? "text-yellow-500" 
      : "text-gray-300";

  return (
    <View 
      className={`px-4 py-2 mr-2 rounded-xl ${bgColor}`}
      style={{ borderRadius: 12 }} // Inline fallback to force rounding if Tailwind fails
    >
      <Text className={`${textColor} font-rubik-medium text-xs`}>
        {label}
      </Text>
    </View>
  );
};
