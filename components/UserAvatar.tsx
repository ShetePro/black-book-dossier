import { Image, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";

function UserAvatar() {
  return (
    <View className={"flex flex-col justify-center items-center mb-5"}>
      <Image
        style={{ width: 150, height: 150, borderRadius: 75 }}
        source={{
          uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCVPUTuAdnYVDRUbolO9NUUoQ5MZvzR4uxsgHoyfCeWCTiB-1ljJ37VPT2AvhdIZf8qmWSSZKrUrNocPWBAPcilFhhweyoGUQqC5r3QhsrlzdYRtcu9v5vYU73dT-e9U1RZJTSGCSjardhPVq5n1zjilsAQ4KfEzjtBzlGg5x7XMeMXi_YJt0SRLO1ZZuXh3_dndEo9xfZnQKK0rvlCKHsEfmUOIh-8dZcFSQZyaeXv1vqTSy3q_px76ROuppSX9ZCxAIBjtC_u5Y9r",
        }}
      />
      <ThemedText style={{ fontSize: 20 }} className={"mt-3 font-bold"}>
        User12345
      </ThemedText>
      <ThemedText className={"text-xl"} darkColor={"#94a3b8"}>
        Running
      </ThemedText>
    </View>
  );
}

export default UserAvatar;
