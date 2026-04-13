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
          headerShown: false,
        }}
      ></Stack.Screen>
    </Stack>
  );
}
