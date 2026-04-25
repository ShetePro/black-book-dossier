export interface TimeParseResult {
  timestamp: number;
  originalText: string;
  confidence: number;
  type: 'relative' | 'absolute' | 'unknown';
}

const parseTimeOfDay = (text: string): { hour: number; minute: number; confidence: number } | null => {
  const normalizedText = text.trim().toLowerCase();

  const timePatterns: Array<{ pattern: RegExp; hourBase: number; hourOffset: number }> = [
    { pattern: /凌晨(\d{1,2})点(?:半|半点)?/, hourBase: 0, hourOffset: 0 },
    { pattern: /凌晨(\d{1,2})[:点](\d{1,2})?分?/, hourBase: 0, hourOffset: 0 },
    { pattern: /早上?(\d{1,2})点(?:半|半点)?/, hourBase: 6, hourOffset: 0 },
    { pattern: /上午(\d{1,2})点(?:半|半点)?/, hourBase: 0, hourOffset: 0 },
    { pattern: /上午(\d{1,2})[:点](\d{1,2})?分?/, hourBase: 0, hourOffset: 0 },
    { pattern: /中午(\d{1,2})点(?:半|半点)?/, hourBase: 11, hourOffset: 0 },
    { pattern: /下午(\d{1,2})点(?:半|半点)?/, hourBase: 12, hourOffset: 0 },
    { pattern: /下午(\d{1,2})[:点](\d{1,2})?分?/, hourBase: 12, hourOffset: 0 },
    { pattern: /傍晚(\d{1,2})点(?:半|半点)?/, hourBase: 17, hourOffset: 0 },
    { pattern: /晚上?(\d{1,2})点(?:半|半点)?/, hourBase: 18, hourOffset: 0 },
    { pattern: /晚上?(\d{1,2})[:点](\d{1,2})?分?/, hourBase: 18, hourOffset: 0 },
    { pattern: /半夜(\d{1,2})点(?:半|半点)?/, hourBase: 0, hourOffset: 0 },
    { pattern: /深夜(\d{1,2})点(?:半|半点)?/, hourBase: 0, hourOffset: 0 },
  ];

  for (const { pattern, hourBase } of timePatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      let hour = parseInt(match[1], 10);

      if (normalizedText.includes('下午') || normalizedText.includes('傍晚') || normalizedText.includes('晚上')) {
        if (hour < 12) hour += 12;
      } else if (normalizedText.includes('凌晨') || normalizedText.includes('深夜') || normalizedText.includes('半夜')) {
        if (hour >= 12) hour -= 12;
      }

      let minute = 0;

      if (normalizedText.includes('半') || normalizedText.includes('半点')) {
        minute = 30;
      }

      const minuteMatch = normalizedText.match(/[:点](\d{1,2})/);
      if (minuteMatch) {
        minute = parseInt(minuteMatch[1], 10);
      }

      return { hour, minute, confidence: 0.9 };
    }
  }

  const hourMinutePattern = normalizedText.match(/(\d{1,2})[:点时](\d{1,2})/);
  if (hourMinutePattern) {
    const hour = parseInt(hourMinutePattern[1], 10);
    const minute = parseInt(hourMinutePattern[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute, confidence: 0.85 };
    }
  }

  const simpleHourPattern = normalizedText.match(/(\d{1,2})点/);
  if (simpleHourPattern) {
    let hour = parseInt(simpleHourPattern[1], 10);
    if (normalizedText.includes('下午') && hour < 12) hour += 12;
    if (hour >= 0 && hour <= 23) {
      return { hour, minute: 0, confidence: 0.8 };
    }
  }

  const englishTimePatterns = [
    { pattern: /(\d{1,2}):(\d{2})\s*(am|a\.m\.|上午)/i, hourAdjust: 0 },
    { pattern: /(\d{1,2}):(\d{2})\s*(pm|p\.m\.|下午)/i, hourAdjust: 12 },
    { pattern: /(\d{1,2})\s*(am|a\.m\.|上午)/i, hourAdjust: 0, defaultMinute: 0 },
    { pattern: /(\d{1,2})\s*(pm|p\.m\.|下午)/i, hourAdjust: 12, defaultMinute: 0 },
  ];

  for (const { pattern, hourAdjust, defaultMinute } of englishTimePatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      let hour = parseInt(match[1], 10);
      if (hourAdjust === 12 && hour < 12) hour += 12;
      if (hourAdjust === 0 && hour === 12) hour = 0;
      const minute = match[2] ? parseInt(match[2], 10) : (defaultMinute ?? 0);
      if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
        return { hour, minute, confidence: 0.85 };
      }
    }
  }

  const pureHourMinute = normalizedText.match(/(\d{1,2}):(\d{2})/);
  if (pureHourMinute) {
    const hour = parseInt(pureHourMinute[1], 10);
    const minute = parseInt(pureHourMinute[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute, confidence: 0.75 };
    }
  }

  return null;
};

export const parseRelativeTime = (text: string): TimeParseResult => {
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const normalizedText = text.trim().toLowerCase();

  let dateTimestamp: number | null = null;
  let dateConfidence = 0;

  const absoluteDatePatterns = [
    /(\d{4})年(\d{1,2})月(\d{1,2})日?/,
    /(\d{1,2})月(\d{1,2})日?/,
    /(\d{1,2})[\/\-](\d{1,2})/,
  ];

  for (const pattern of absoluteDatePatterns) {
    const match = normalizedText.match(pattern);
    if (match) {
      let year: number, month: number, day: number;

      if (match.length === 4) {
        year = parseInt(match[1], 10);
        month = parseInt(match[2], 10) - 1;
        day = parseInt(match[3], 10);
      } else if (match.length === 3) {
        year = today.getFullYear();
        month = parseInt(match[1], 10) - 1;
        day = parseInt(match[2], 10);
      } else {
        continue;
      }

      const parsedDate = new Date(year, month, day);
      if (parsedDate.getFullYear() === year &&
          parsedDate.getMonth() === month &&
          parsedDate.getDate() === day) {
        dateTimestamp = parsedDate.getTime();
        dateConfidence = 0.95;
        break;
      }
    }
  }

  if (!dateTimestamp) {
    const dayRelativeMap: Record<string, number> = {
      '今天': 0, '昨天': -1, '前天': -2, '大前天': -3,
      '明天': 1, '后天': 2, '大后天': 3,
    };

    const englishDayMap: Record<string, number> = {
      'today': 0, 'yesterday': -1, 'two days ago': -2, 'three days ago': -3,
      'tomorrow': 1, 'in two days': 2, 'in three days': 3,
    };

    for (const [key, offset] of Object.entries(dayRelativeMap)) {
      if (normalizedText.includes(key)) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + offset);
        dateTimestamp = targetDate.getTime();
        dateConfidence = 0.9;
        break;
      }
    }

    if (!dateTimestamp) {
      for (const [key, offset] of Object.entries(englishDayMap)) {
        if (normalizedText.includes(key)) {
          const targetDate = new Date(today);
          targetDate.setDate(targetDate.getDate() + offset);
          dateTimestamp = targetDate.getTime();
          dateConfidence = 0.9;
          break;
        }
      }
    }
  }

  if (!dateTimestamp) {
    const weekRelativePatterns = [
      { pattern: /上周(?:一|周一|星期一)/, offset: -7, dayOfWeek: 1 },
      { pattern: /上周(?:二|周二|星期二)/, offset: -7, dayOfWeek: 2 },
      { pattern: /上周(?:三|周三|星期三)/, offset: -7, dayOfWeek: 3 },
      { pattern: /上周(?:四|周四|星期四)/, offset: -7, dayOfWeek: 4 },
      { pattern: /上周(?:五|周五|星期五)/, offset: -7, dayOfWeek: 5 },
      { pattern: /上周(?:六|周六|星期六)/, offset: -7, dayOfWeek: 6 },
      { pattern: /上周(?:日|周日|星期日|天|星期天)/, offset: -7, dayOfWeek: 0 },
      { pattern: /本周(?:一|周一|星期一)/, offset: 0, dayOfWeek: 1 },
      { pattern: /本周(?:二|周二|星期二)/, offset: 0, dayOfWeek: 2 },
      { pattern: /本周(?:三|周三|星期三)/, offset: 0, dayOfWeek: 3 },
      { pattern: /本周(?:四|周四|星期四)/, offset: 0, dayOfWeek: 4 },
      { pattern: /本周(?:五|周五|星期五)/, offset: 0, dayOfWeek: 5 },
      { pattern: /本周(?:六|周六|星期六)/, offset: 0, dayOfWeek: 6 },
      { pattern: /本周(?:日|周日|星期日|天|星期天)/, offset: 0, dayOfWeek: 0 },
      { pattern: /下周(?:一|周一|星期一)/, offset: 7, dayOfWeek: 1 },
      { pattern: /下周(?:二|周二|星期二)/, offset: 7, dayOfWeek: 2 },
      { pattern: /下周(?:三|周三|星期三)/, offset: 7, dayOfWeek: 3 },
      { pattern: /下周(?:四|周四|星期四)/, offset: 7, dayOfWeek: 4 },
      { pattern: /下周(?:五|周五|星期五)/, offset: 7, dayOfWeek: 5 },
      { pattern: /下周(?:六|周六|星期六)/, offset: 7, dayOfWeek: 6 },
      { pattern: /下周(?:日|周日|星期日|天|星期天)/, offset: 7, dayOfWeek: 0 },
    ];

    for (const { pattern, offset, dayOfWeek } of weekRelativePatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const targetDate = new Date(today);
        const currentDayOfWeek = today.getDay();
        const daysToTarget = dayOfWeek - currentDayOfWeek;
        targetDate.setDate(targetDate.getDate() + offset + daysToTarget);
        dateTimestamp = targetDate.getTime();
        dateConfidence = 0.85;
        break;
      }
    }
  }

  if (!dateTimestamp) {
    const relativeNumberPatterns = [
      { pattern: /(\d+)天前/, unit: 'day', direction: -1 },
      { pattern: /(\d+)\s*days\s*ago/, unit: 'day', direction: -1 },
      { pattern: /(\d+)周前/, unit: 'week', direction: -1 },
      { pattern: /(\d+)\s*weeks\s*ago/, unit: 'week', direction: -1 },
      { pattern: /(\d+)个月前/, unit: 'month', direction: -1 },
      { pattern: /(\d+)\s*months\s*ago/, unit: 'month', direction: -1 },
      { pattern: /(\d+)年前/, unit: 'year', direction: -1 },
      { pattern: /(\d+)\s*years\s*ago/, unit: 'year', direction: -1 },
    ];

    for (const { pattern, unit, direction } of relativeNumberPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const amount = parseInt(match[1], 10);
        const targetDate = new Date(today);

        switch (unit) {
          case 'day': targetDate.setDate(targetDate.getDate() + direction * amount); break;
          case 'week': targetDate.setDate(targetDate.getDate() + direction * amount * 7); break;
          case 'month': targetDate.setMonth(targetDate.getMonth() + direction * amount); break;
          case 'year': targetDate.setFullYear(targetDate.getFullYear() + direction * amount); break;
        }

        dateTimestamp = targetDate.getTime();
        dateConfidence = 0.8;
        break;
      }
    }
  }

  if (!dateTimestamp) {
    const simpleWeekMap: Record<string, number> = {
      '上周': -7, 'last week': -7,
      '本周': 0, 'this week': 0,
      '下周': 7, 'next week': 7,
    };

    for (const [key, offset] of Object.entries(simpleWeekMap)) {
      if (normalizedText.includes(key)) {
        const targetDate = new Date(today);
        targetDate.setDate(targetDate.getDate() + offset - (today.getDay() || 7) + 1);
        dateTimestamp = targetDate.getTime();
        dateConfidence = 0.7;
        break;
      }
    }
  }

  const timeResult = parseTimeOfDay(text);

  if (dateTimestamp && timeResult) {
    const finalDate = new Date(dateTimestamp);
    finalDate.setHours(timeResult.hour, timeResult.minute, 0, 0);
    return {
      timestamp: finalDate.getTime(),
      originalText: text,
      confidence: Math.max(dateConfidence, timeResult.confidence),
      type: dateConfidence >= 0.9 ? 'absolute' : 'relative',
    };
  }

  if (timeResult) {
    const finalDate = new Date();
    finalDate.setHours(timeResult.hour, timeResult.minute, 0, 0);
    return {
      timestamp: finalDate.getTime(),
      originalText: text,
      confidence: timeResult.confidence,
      type: 'relative',
    };
  }

  if (dateTimestamp) {
    return {
      timestamp: dateTimestamp,
      originalText: text,
      confidence: dateConfidence,
      type: dateConfidence >= 0.9 ? 'absolute' : 'relative',
    };
  }

  return {
    timestamp: now,
    originalText: text,
    confidence: 0,
    type: 'unknown',
  };
};

export const extractAndParseTimeFromTags = (suggestedTags: string[]): TimeParseResult => {
  const timeTags = suggestedTags.filter(tag => tag.startsWith('time:'));
  if (timeTags.length === 0) {
    return {
      timestamp: Date.now(),
      originalText: '',
      confidence: 0,
      type: 'unknown',
    };
  }

  const timeText = timeTags[0].replace('time:', '');
  return parseRelativeTime(timeText);
};

export const parseMultipleTimes = (texts: string[]): TimeParseResult[] => {
  return texts.map(text => parseRelativeTime(text));
};

export const formatTimestamp = (timestamp: number, includeTime: boolean = true): string => {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (!includeTime) {
    return `${year}年${month}月${day}日`;
  }

  const hour = date.getHours();
  const minute = date.getMinutes();
  const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
  const minuteStr = minute < 10 ? `0${minute}` : `${minute}`;

  return `${year}年${month}月${day}日 ${hourStr}:${minuteStr}`;
};

export const formatTimeOnly = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hour = date.getHours();
  const minute = date.getMinutes();
  const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
  const minuteStr = minute < 10 ? `0${minute}` : `${minute}`;
  return `${hourStr}:${minuteStr}`;
};

export default {
  parseRelativeTime,
  extractAndParseTimeFromTags,
  parseMultipleTimes,
  formatTimestamp,
  formatTimeOnly,
};