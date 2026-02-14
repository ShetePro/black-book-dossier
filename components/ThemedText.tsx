import { Text, type TextProps, StyleSheet } from "react-native";

import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
    | "default"
    | "title"
    | "defaultSemiBold"
    | "subtitle"
    | "describe"
    | "link";
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = "default",
  className,
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor().text;

  return <Text className={className} style={[{ color }, styles[type], style]} {...rest} />;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "LexendSemiBold",
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  describe: {
    fontSize: 14,
    lineHeight: 24,
    color: "gray",
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: "#0a7ea4",
  },
});
