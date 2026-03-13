import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { useTranslation } from 'react-i18next';
import { useColorScheme, DynamicColorIOS } from 'react-native';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';

export default function TabLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();

  // 金色主题色
  const goldColor = '#c9a962';

  // iOS 动态颜色（支持 Liquid Glass）
  const tintColor = DynamicColorIOS({
    dark: goldColor,
    light: goldColor,
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <NativeTabs
        tintColor={tintColor}
        labelStyle={{
          color: tintColor,
        }}
      >
        <NativeTabs.Trigger name="index">
          <Icon sf="house.fill" />
          <Label>{t('tabs.index')}</Label>
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="contacts">
          <Icon sf="person.2.fill" />
          <Label>{t('tabs.contacts')}</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
    </ThemeProvider>
  );
}
