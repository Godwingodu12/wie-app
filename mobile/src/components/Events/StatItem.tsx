import { Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export const StatItem = ({ icon, count }: { icon: any; count: string }) => (
  <View className="flex-row items-center mr-6">
    <Ionicons name={icon} size={16} color="white" />
    <Text className="text-white ml-2 font-rubik-medium text-sm">{count}</Text>
  </View>
);
