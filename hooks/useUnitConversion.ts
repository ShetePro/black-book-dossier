import { useCallback } from "react";
import { useSettingsStore } from "@/store/settingsStore";

/**
 * 单位转换 Hook
 * 根据设置中的 distanceUnit 自动转换距离单位
 */
export function useUnitConversion() {
  const { settings } = useSettingsStore();
  const { distanceUnit } = settings;

  // 公里转英里
  const kmToMiles = (km: number): number => {
    return km * 0.621371;
  };

  // 英里转公里
  const milesToKm = (miles: number): number => {
    return miles / 0.621371;
  };

  /**
   * 转换距离（米 → 当前单位）
   * @param meters 距离（米）
   * @param decimals 小数位数
   * @returns 转换后的数值
   */
  const convertDistance = useCallback(
    (meters: number, decimals: number = 2): number => {
      const km = meters / 1000;
      if (distanceUnit === "mi") {
        return parseFloat(kmToMiles(km).toFixed(decimals));
      }
      return parseFloat(km.toFixed(decimals));
    },
    [distanceUnit]
  );

  /**
   * 转换距离（保持公里，用于计算）
   * @param km 公里数
   * @param decimals 小数位数
   * @returns 转换后的数值
   */
  const convertKm = useCallback(
    (km: number, decimals: number = 2): number => {
      if (distanceUnit === "mi") {
        return parseFloat(kmToMiles(km).toFixed(decimals));
      }
      return parseFloat(km.toFixed(decimals));
    },
    [distanceUnit]
  );

  /**
   * 转换速度/配速
   * @param paceMinPerKm 配速（分钟/公里）
   * @returns 转换后的配速
   */
  const convertPace = useCallback(
    (paceMinPerKm: number): number => {
      if (distanceUnit === "mi") {
        // 英里配速 = 公里配速 × 1.60934
        return paceMinPerKm * 1.60934;
      }
      return paceMinPerKm;
    },
    [distanceUnit]
  );

  /**
   * 获取当前距离单位名称
   */
  const distanceUnitName = distanceUnit === "mi" ? "英里" : "公里";
  const distanceUnitShort = distanceUnit;

  return {
    // 转换函数
    convertDistance,
    convertKm,
    convertPace,
    kmToMiles,
    milesToKm,
    
    // 当前单位信息
    distanceUnit,
    distanceUnitName,
    distanceUnitShort,
    
    // 是否是公制
    isMetric: distanceUnit === "km",
    // 是否是英制
    isImperial: distanceUnit === "mi",
  };
}
