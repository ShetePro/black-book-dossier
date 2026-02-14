import type { ReactNode } from "react";
import { View, ViewStyle } from "react-native";
import { ThemedView } from "@/components/ThemedView";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PageView({
  children,
  safeArea = true,
  style = {},
}: {
  children: ReactNode;
  safeArea?: boolean;
  style?: ViewStyle;
}) {
  return (
    <>
      {safeArea ? (
        <SafeAreaView
          className={"flex-1 bg-gray-50 dark:bg-slate-900"}
          style={{ flex: 1, boxSizing: "content", padding: 20, ...style }}
        >
          <ThemedView style={{ flex: 1, ...style }}>{children}</ThemedView>
        </SafeAreaView>
      ) : (
        <View className={"w-full h-full flex-1 bg-gray-50 dark:bg-slate-900"}>
          <ThemedView
            style={{ flex: 1, width: "100%", height: "100%", ...style }}
          >
            {children}
          </ThemedView>
        </View>
      )}
    </>
  );
}
