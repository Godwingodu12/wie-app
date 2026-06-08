import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const InfoRow = ({ icon, label, color = "#A855F7" }: { icon: any; label: string; color?: string }) => (
  <View className="flex-row items-center mb-4">
    <View className="w-9 h-9 rounded-xl bg-gray-900 items-center justify-center mr-3">
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text className="text-gray-200 font-rubik-medium text-[15px]">{label}</Text>
  </View>
);
