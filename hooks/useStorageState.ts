import { useEffect, useCallback, useReducer } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { jsonParse } from "@/utils/util";

type UseStateHook<T> = [[boolean, T | null], (value: T | null) => void];

function useAsyncState<T>(
  initialValue: [boolean, T | null] = [true, null],
): UseStateHook<T> {
  return useReducer(
    (
      state: [boolean, T | null],
      action: T | null = null,
    ): [boolean, T | null] => [false, action],
    initialValue,
  ) as UseStateHook<T>;
}

/**
 * 检查错误是否是 Keychain 访问被拒绝错误
 */
function isKeychainError(error: any): boolean {
  return (
    error?.message?.includes("User interaction is not allowed") ||
    error?.message?.includes("Keychain") ||
    error?.code === "ERR_SECURESTORE_ACCESS_DENIED"
  );
}

/**
 * 删除存储项
 */
export async function deleteStorageItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("Local storage is unavailable:", e);
    }
  } else {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn("[Storage] SecureStore delete failed:", error);
      // 降级到 AsyncStorage
      try {
        await AsyncStorage.removeItem(key);
      } catch (e) {
        console.error("[Storage] AsyncStorage delete also failed:", e);
      }
    }
  }
}

/**
 * 设置存储项（带错误处理和降级）
 */
export async function setStorageItem(
  key: string,
  value: string | null,
): Promise<void> {
  if (Platform.OS === "web") {
    try {
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.error("Local storage is unavailable:", e);
    }
    return;
  }

  try {
    if (value == null) {
      await SecureStore.deleteItemAsync(key);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  } catch (error) {
    console.warn(
      "[Storage] SecureStore set failed, falling back to AsyncStorage:",
      error,
    );
    // 降级到 AsyncStorage
    try {
      if (value == null) {
        await AsyncStorage.removeItem(key);
      } else {
        await AsyncStorage.setItem(key, value);
      }
    } catch (e) {
      console.error("[Storage] AsyncStorage set also failed:", e);
    }
  }
}

/**
 * 异步设置存储项（与 setStorageItem 相同，保留兼容性）
 */
export async function setStorageItemAsync(
  key: string,
  value: string | null,
): Promise<void> {
  return setStorageItem(key, value);
}

/**
 * 获取存储项（同步版本 - 已弃用，请使用 getStorageItemAsync）
 * 注意：此函数在 Keychain 被锁定时可能返回 null
 */
export function getStorageItem(
  key: string,
  parse: boolean = false,
): string | null | any {
  console.warn(
    "[Storage] getStorageItem is deprecated. Use getStorageItemAsync instead.",
  );

  if (Platform.OS === "web") {
    try {
      const value = localStorage.getItem(key);
      return parse ? jsonParse(value) : value;
    } catch (e) {
      console.error("Local storage is unavailable:", e);
      return null;
    }
  }

  // iOS/Android: 尝试同步读取，但可能失败
  try {
    const value = SecureStore.getItem(key);
    return parse ? jsonParse(value) : value;
  } catch (error) {
    console.warn("[Storage] SecureStore sync get failed:", error);
    return null;
  }
}

/**
 * 异步获取存储项（带错误处理和降级）
 * 推荐在所有场景使用此函数
 */
export async function getStorageItemAsync(
  key: string,
  parse: boolean = false,
): Promise<string | null | any> {
  if (Platform.OS === "web") {
    try {
      const value = localStorage.getItem(key);
      return parse ? jsonParse(value) : value;
    } catch (e) {
      console.error("Local storage is unavailable:", e);
      return null;
    }
  }

  try {
    // 首先尝试 SecureStore
    const value = await SecureStore.getItemAsync(key);
    return parse ? jsonParse(value) : value;
  } catch (error) {
    if (isKeychainError(error)) {
      console.warn(
        "[Storage] SecureStore access denied (device locked?), trying AsyncStorage:",
        error,
      );
    } else {
      console.warn(
        "[Storage] SecureStore get failed, trying AsyncStorage:",
        error,
      );
    }

    // 降级到 AsyncStorage
    try {
      const value = await AsyncStorage.getItem(key);
      return parse ? jsonParse(value) : value;
    } catch (asyncError) {
      console.error("[Storage] AsyncStorage get also failed:", asyncError);
      return null;
    }
  }
}

/**
 * React Hook: 使用存储状态
 */
export function useStorageState(key: string): UseStateHook<string> {
  // Public
  const [state, setState] = useAsyncState<string>();

  // Get
  useEffect(() => {
    let isMounted = true;

    const loadValue = async () => {
      try {
        let value: string | null = null;

        if (Platform.OS === "web") {
          try {
            if (typeof localStorage !== "undefined") {
              value = localStorage.getItem(key);
            }
          } catch (e) {
            console.error("Local storage is unavailable:", e);
          }
        } else {
          value = await getStorageItemAsync(key);
        }

        if (isMounted) {
          setState(value);
        }
      } catch (error) {
        console.error("[Storage] Failed to load value:", error);
        if (isMounted) {
          setState(null);
        }
      }
    };

    loadValue();

    return () => {
      isMounted = false;
    };
  }, [key, setState]);

  // Set
  const setValue = useCallback(
    async (value: string | null) => {
      setState(value);
      await setStorageItem(key, value);
    },
    [key, setState],
  );

  return [state, setValue];
}
