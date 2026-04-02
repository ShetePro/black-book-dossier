import React, { Component, ErrorInfo, ReactNode, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] 捕获到错误:", error);
    console.error("[ErrorBoundary] 错误堆栈:", errorInfo.componentStack);
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
        />
      );
    }
    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  onRetry: () => void;
}

function ErrorFallback({ error, errorInfo, onRetry }: ErrorFallbackProps) {
  const colors = useThemeColor();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View
          style={[styles.iconContainer, { backgroundColor: `${colors.danger}20` }]}
        >
          <Ionicons name="warning" size={48} color={colors.danger} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>出错了</Text>

        <Text style={[styles.message, { color: colors.textSecondary }]}>
          应用遇到了问题，请尝试重新加载。
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            onPress={onRetry}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="refresh" size={18} color="#0a0a0a" />
            <Text style={styles.buttonText}>重新加载</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowDetails(!showDetails)}
            style={[styles.buttonSecondary, { borderColor: colors.border }]}
          >
            <Text style={[styles.buttonSecondaryText, { color: colors.text }]}>
              {showDetails ? "隐藏详情" : "查看详情"}
            </Text>
          </TouchableOpacity>
        </View>

        {showDetails && error && (
          <ScrollView
            style={[
              styles.detailsContainer,
              { backgroundColor: colors.surface },
            ]}
            contentContainerStyle={styles.detailsContent}
          >
            <Text style={[styles.errorTitle, { color: colors.danger }]}>
              错误信息:
            </Text>
            <Text style={[styles.errorText, { color: colors.text }]}>
              {error.toString()}
            </Text>

            {errorInfo && (
              <>
                <Text
                  style={[
                    styles.errorTitle,
                    { color: colors.danger, marginTop: 12 },
                  ]}
                >
                  组件堆栈:
                </Text>
                <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                  {errorInfo.componentStack}
                </Text>
              </>
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: "#0a0a0a",
    fontSize: 15,
    fontWeight: "600",
  },
  buttonSecondary: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  buttonSecondaryText: {
    fontSize: 15,
    fontWeight: "500",
  },
  detailsContainer: {
    width: "100%",
    maxHeight: 200,
    marginTop: 24,
    borderRadius: 12,
    padding: 16,
  },
  detailsContent: {
    paddingBottom: 16,
  },
  errorTitle: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "monospace",
    lineHeight: 18,
  },
});

export default ErrorBoundary;
