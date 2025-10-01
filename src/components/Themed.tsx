import { Text as DefaultText, View as DefaultView, TextProps, ViewProps } from 'react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from './useColorScheme';

interface ThemedTextProps extends TextProps {
  lightColor?: string;
  darkColor?: string;
}

interface ThemedViewProps extends ViewProps {
  lightColor?: string;
  darkColor?: string;
}

export function Text({ lightColor, darkColor, style, ...props }: ThemedTextProps) {
  const colorScheme = useColorScheme();

  const color = lightColor && darkColor
    ? (colorScheme === 'dark' ? darkColor : lightColor)
    : Colors[colorScheme].text;

  return <DefaultText style={[{ color }, style]} {...props} />;
}

export function View({ lightColor, darkColor, style, ...props }: ThemedViewProps) {
  const colorScheme = useColorScheme();

  const backgroundColor = lightColor && darkColor
    ? (colorScheme === 'dark' ? darkColor : lightColor)
    : Colors[colorScheme].background;

  return <DefaultView style={[{ backgroundColor }, style]} {...props} />;
}
