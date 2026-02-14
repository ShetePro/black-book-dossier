import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * 全局错误边界组件
 * 捕获 React 组件树中的错误，防止白屏
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // 更新 state，下次渲染时显示备用 UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error("[ErrorBoundary] 捕获到错误:", error);
    console.error("[ErrorBoundary] 错误堆栈:", errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    // 重置状态，尝试重新渲染
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>出错了</Text>
          <Text style={styles.subtitle}>应用遇到了一些问题</Text>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {this.state.error?.message || "未知错误"}
            </Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>重新加载</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={() => {
              // 关闭应用（iOS 不支持，所以只重置）
              this.handleRetry();
            }}
          >
            <Text style={[styles.buttonText, styles.secondaryButtonText]}>
              关闭应用
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  errorContainer: {
    backgroundColor: "#ffebee",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    maxWidth: "100%",
  },
  errorText: {
    color: "#c62828",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
    minWidth: 200,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4f46e5",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#4f46e5",
  },
});

export default ErrorBoundary;
