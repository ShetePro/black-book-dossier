import { Stack } from "expo-router";
import BackRouteIcon from "@/components/BackRouteIcon";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import React from "react";

export default function ViewsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name={"run"}></Stack.Screen>
      <Stack.Screen name={"language"} options={{}}></Stack.Screen>
      <Stack.Screen
        name={"profile"}
        options={{
          headerTitle: "编辑资料",
          headerTitleStyle: { color: "#0f172a" },
          headerStyle: { backgroundColor: "#fff" },
          headerShadowVisible: false,
          headerBackTitle: "取消",
          headerRight: () => (
            <TouchableOpacity className="px-2">
              <Text className="text-indigo-600 font-bold text-base">保存</Text>
            </TouchableOpacity>
          ),
        }}
      ></Stack.Screen>
    </Stack>
  );
}
