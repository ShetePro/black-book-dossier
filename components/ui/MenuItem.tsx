import { TouchableOpacity, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  label: string;
  value?: string;
  onPress?: () => void;
}

export const MenuItem = ({
  icon,
  color,
  label,
  value,
  onPress,
}: MenuItemProps) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.7}
    className="flex-row items-center justify-between p-4 bg-white dark:bg-slate-800"
  >
    <View className="flex-row items-center">
      <View
        className="w-8 h-8 rounded-lg items-center justify-center mr-3"
        style={{ backgroundColor: `${color}20` }} // 20% opacity using hex
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text className="text-base text-slate-700 dark:text-slate-200 font-medium">
        {label}
      </Text>
    </View>

    <View className="flex-row items-center">
      {value && <Text className="text-slate-400 text-sm mr-2">{value}</Text>}
      <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
    </View>
  </TouchableOpacity>
);
