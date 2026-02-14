import { Pressable } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function BackRouteIcon() {
  const colors = useThemeColor();
  function backRouter() {
    router.back();
  }
  return (
    <Pressable onPress={backRouter} style={{padding: 10}}>
      <AntDesign name="left" size={24} color={colors.icon} />
    </Pressable>
  );
}
