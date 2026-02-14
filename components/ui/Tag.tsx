import { View, Text, StyleSheet, ViewStyle, StyleProp } from "react-native";
import { COLORS } from "@/styles/theme";
import { LinearGradient } from "expo-linear-gradient";

type TagProps = {
  label?: string;
  type: "primary" | "success" | "info" | "warning" | "danger";
  color?: string;
  style?: StyleProp<ViewStyle>;
};
export default function Tag(props: TagProps) {
  const colorMap: Record<string, readonly [string, string, ...string[]]> = {
    primary: [COLORS.primaryColor, "#6366f1"],
    success: ["#2ecc71", "#27ae60"],
    danger: ["#ec7063", "#c0392b"],
    info: [COLORS.infoColor, "#95a5a6"],
  };
  return (
    <View style={[styles.container, props.style]}>
      <LinearGradient
        colors={colorMap[props.type]}
        style={{ ...styles[props.type], ...styles.dynamicBox }}
      >
        <Text className={"text-gray-100 text-mini"}>{props.label}</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  primary: {},
  success: {
    backgroundColor: COLORS.successColor,
  },
  warning: {
    backgroundColor: COLORS.warningColor,
  },
  danger: {
    backgroundColor: COLORS.dangerColor,
  },
  info: {
    backgroundColor: COLORS.infoColor,
  },
  container: {
    justifyContent: "center",
    alignItems: "flex-start",
  },
  dynamicBox: {
    padding: 5,
    borderRadius: 5,
  },
});
