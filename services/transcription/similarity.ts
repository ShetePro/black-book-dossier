/**
 * 文本相似度算法工具
 * 用于语音识别后处理的纠错匹配
 */

/**
 * 计算编辑距离（Levenshtein Distance）
 * 两个字符串之间最少的单字符编辑操作次数
 */
export const levenshteinDistance = (str1: string, str2: string): number => {
  const m = str1.length;
  const n = str2.length;
  
  // 创建距离矩阵
  const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
  
  // 初始化边界
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // 填充矩阵
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,     // 删除
          dp[i][j - 1] + 1,     // 插入
          dp[i - 1][j - 1] + 1  // 替换
        );
      }
    }
  }
  
  return dp[m][n];
};

/**
 * 计算字符串相似度（0-1之间）
 * 1 表示完全相同，0 表示完全不同
 */
export const calculateSimilarity = (str1: string, str2: string): number => {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;
  
  const distance = levenshteinDistance(str1, str2);
  const maxLength = Math.max(str1.length, str2.length);
  
  return 1 - distance / maxLength;
};

/**
 * 汉字转拼音（简单版，处理常见姓氏和常用字）
 * 实际项目中可以使用 pinyin 库
 */
const charToPinyin: Record<string, string> = {
  '张': 'zhang', '王': 'wang', '李': 'li', '刘': 'liu', '陈': 'chen',
  '杨': 'yang', '黄': 'huang', '赵': 'zhao', '周': 'zhou', '吴': 'wu',
  '徐': 'xu', '孙': 'sun', '马': 'ma', '朱': 'zhu', '胡': 'hu',
  '郭': 'guo', '何': 'he', '高': 'gao', '林': 'lin', '罗': 'luo',
  '郑': 'zheng', '梁': 'liang', '谢': 'xie', '宋': 'song', '唐': 'tang',
  '许': 'xu', '韩': 'han', '冯': 'feng', '邓': 'deng', '曹': 'cao',
  '彭': 'peng', '曾': 'zeng', '肖': 'xiao', '田': 'tian', '董': 'dong',
  '袁': 'yuan', '潘': 'pan', '于': 'yu', '蒋': 'jiang', '蔡': 'cai',
  '余': 'yu', '杜': 'du', '叶': 'ye', '程': 'cheng', '苏': 'su',
  '魏': 'wei', '吕': 'lv', '丁': 'ding', '任': 'ren', '沈': 'shen',
  '姚': 'yao', '卢': 'lu', '姜': 'jiang', '崔': 'cui', '钟': 'zhong',
  '谭': 'tan', '陆': 'lu', '汪': 'wang', '范': 'fan', '金': 'jin',
  '石': 'shi', '廖': 'liao', '贾': 'jia', '夏': 'xia', '韦': 'wei',
  '付': 'fu', '方': 'fang', '白': 'bai', '邹': 'zou', '孟': 'meng',
  '熊': 'xiong', '秦': 'qin', '邱': 'qiu', '江': 'jiang', '尹': 'yin',
  '薛': 'xue', '闫': 'yan', '段': 'duan', '雷': 'lei', '侯': 'hou',
  '龙': 'long', '史': 'shi', '陶': 'tao', '黎': 'li', '贺': 'he',
  '顾': 'gu', '毛': 'mao', '郝': 'hao', '龚': 'gong', '邵': 'shao',
  '万': 'wan', '钱': 'qian', '严': 'yan', '覃': 'qin', '武': 'wu',
  '戴': 'dai', '莫': 'mo', '孔': 'kong', '向': 'xiang', '汤': 'tang',
  // 常见后缀
  '总': 'zong', '经': 'jing', '理': 'li', '事': 'shi', '长': 'zhang',
  '裁': 'cai', '首': 'shou', '席': 'xi', '执': 'zhi', '行': 'xing', '官': 'guan', '技': 'ji', '术': 'shu', '财': 'cai', '务': 'wu',
};

/**
 * 简单的汉字转拼音
 * @param text 中文字符串
 * @returns 拼音字符串
 */
export const toPinyin = (text: string): string => {
  return text.split('').map(char => {
    return charToPinyin[char] || char.toLowerCase();
  }).join('');
};

/**
 * 计算拼音相似度
 * 用于处理同音字或近音字的误识别
 */
export const calculatePinyinSimilarity = (str1: string, str2: string): number => {
  const pinyin1 = toPinyin(str1);
  const pinyin2 = toPinyin(str2);
  
  return calculateSimilarity(pinyin1, pinyin2);
};

/**
 * 综合相似度计算
 * 结合编辑距离和拼音相似度
 * @param str1 待匹配字符串
 * @param str2 目标字符串
 * @param options 权重配置
 * @returns 相似度得分（0-1）
 */
export const calculateCombinedSimilarity = (
  str1: string,
  str2: string,
  options: { textWeight?: number; pinyinWeight?: number } = {}
): number => {
  const { textWeight = 0.6, pinyinWeight = 0.4 } = options;
  
  const textSim = calculateSimilarity(str1, str2);
  const pinyinSim = calculatePinyinSimilarity(str1, str2);
  
  return textSim * textWeight + pinyinSim * pinyinWeight;
};

/**
 * 判断是否为相似词（可用于自动纠正）
 * @param source 源词
 * @param target 目标词
 * @param threshold 相似度阈值（默认0.7）
 * @returns 是否相似
 */
export const isSimilar = (
  source: string,
  target: string,
  threshold: number = 0.7
): boolean => {
  return calculateCombinedSimilarity(source, target) >= threshold;
};

/**
 * 查找最佳匹配
 * @param source 待匹配字符串
 * @param targets 候选字符串数组
 * @param threshold 相似度阈值（默认0.7）
 * @returns 最佳匹配结果
 */
export const findBestMatch = (
  source: string,
  targets: string[],
  threshold: number = 0.7
): { target: string; similarity: number } | null => {
  let bestMatch: { target: string; similarity: number } | null = null;
  
  for (const target of targets) {
    const similarity = calculateCombinedSimilarity(source, target);
    
    if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
      bestMatch = { target, similarity };
    }
  }
  
  return bestMatch;
};
