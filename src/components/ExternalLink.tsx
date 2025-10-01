import { openURL } from 'expo-linking';
import { Text, TextProps } from 'react-native';

interface ExternalLinkProps extends TextProps {
  href: string;
  children: React.ReactNode;
}

export function ExternalLink({ href, children, ...props }: ExternalLinkProps) {
  return (
    <Text
      {...props}
      onPress={() => openURL(href)}
    >
      {children}
    </Text>
  );
}
