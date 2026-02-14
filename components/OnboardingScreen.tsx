import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";
import { setStorageItemAsync } from "@/hooks/useStorageState";

const { width, height } = Dimensions.get("window");
const ONBOARDING_KEY = "hasSeenOnboarding";

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingPage {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  gradient: [string, string];
  titleKey: string;
  descriptionKey: string;
}

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const pages: OnboardingPage[] = [
    {
      id: "gps",
      icon: "map-marker-path",
      iconColor: "#6366F1",
      gradient: ["#6366F1", "#8B5CF6"],
      titleKey: "onboarding.gps.title",
      descriptionKey: "onboarding.gps.description",
    },
    {
      id: "location",
      icon: "lock-open-outline",
      iconColor: "#10B981",
      gradient: ["#10B981", "#14B8A6"],
      titleKey: "onboarding.location.title",
      descriptionKey: "onboarding.location.description",
    },
    {
      id: "privacy",
      icon: "shield-check",
      iconColor: "#F59E0B",
      gradient: ["#F59E0B", "#EF4444"],
      titleKey: "onboarding.privacy.title",
      descriptionKey: "onboarding.privacy.description",
    },
    {
      id: "start",
      icon: "run-fast",
      iconColor: "#3B82F6",
      gradient: ["#3B82F6", "#6366F1"],
      titleKey: "onboarding.start.title",
      descriptionKey: "onboarding.start.description",
    },
  ];

  const handleComplete = async () => {
    await setStorageItemAsync(ONBOARDING_KEY, "true");
    onComplete();
  };

  const handleNext = () => {
    if (currentPage < pages.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentPage + 1,
        animated: true,
      });
      setCurrentPage(currentPage + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const renderPage = ({ item, index }: { item: OnboardingPage; index: number }) => (
    <View style={styles.page}>
      {/* 顶部图标区域 */}
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={item.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBackground}
        >
          <MaterialCommunityIcons name={item.icon} size={80} color="#fff" />
        </LinearGradient>
      </View>

      {/* 文字内容 */}
      <View style={styles.textContainer}>
        <Text style={styles.title}>{t(item.titleKey)}</Text>
        <Text style={styles.description}>{t(item.descriptionKey)}</Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {pages.map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === currentPage && styles.activeDot,
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 跳过按钮 */}
      {currentPage < pages.length - 1 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>{t("onboarding.skip")}</Text>
        </TouchableOpacity>
      )}

      {/* 页面内容 */}
      <FlatList
        ref={flatListRef}
        data={pages}
        renderItem={renderPage}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
      />

      {/* 底部控制区 */}
      <View style={styles.bottomContainer}>
        {renderDots()}

        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <LinearGradient
            colors={pages[currentPage].gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            <Text style={styles.buttonText}>
              {currentPage === pages.length - 1
                ? t("onboarding.getStarted")
                : t("onboarding.next")}
            </Text>
            <Ionicons
              name={currentPage === pages.length - 1 ? "checkmark" : "arrow-forward"}
              size={20}
              color="#fff"
              style={styles.buttonIcon}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  skipButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: "#666",
  },
  page: {
    width,
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 40,
    paddingTop: height * 0.15,
  },
  iconContainer: {
    marginBottom: 40,
  },
  gradientBackground: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 24,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 30,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    borderRadius: 4,
    backgroundColor: "#6366F1",
  },
  bottomContainer: {
    paddingHorizontal: 40,
    paddingBottom: 50,
  },
  nextButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export { ONBOARDING_KEY };
