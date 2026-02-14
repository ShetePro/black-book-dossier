import { ActivityIndicator, ViewProps } from "react-native";
import { ReactNode } from "react";

export default function Loading({
  children,
  size,
  color,
  ...props
}: {
  children?: ReactNode;
  size?: number | "small" | "large";
  color?: string;
} & ViewProps) {
  return (
    <ActivityIndicator size={size} color={color} {...props}>
      {children}
    </ActivityIndicator>
  );
}
