import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { ScreenGradient } from '@/src/components/ui/ScreenGradient';
import { useAppColorScheme, useHiveTheme } from '@/src/hooks/useHiveTheme';

export const ONBOARDING_CONTENT_STEPS = 4;

type OnboardingScreenProps = PropsWithChildren<{
  title: string;
  subtitle?: string;
  description: string;
  step?: number;
  totalSteps?: number;
  actionLabel: string;
  onAction: () => void;
  onSkip?: () => void;
  skipLabel?: string;
  loading?: boolean;
  showPagination?: boolean;
  illustration?: ReactNode;
}>;

export function OnboardingScreen({
  title,
  subtitle,
  description,
  step,
  totalSteps = ONBOARDING_CONTENT_STEPS,
  actionLabel,
  onAction,
  onSkip,
  skipLabel = 'Skip',
  loading = false,
  showPagination = true,
  illustration,
  children,
}: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useHiveTheme();
  const colorScheme = useAppColorScheme();
  const inactiveDot = `${theme.accent}44`;

  const content = (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <View style={styles.header}>
        {onSkip ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={onSkip}
            style={({ pressed }) => [styles.skipButton, pressed && styles.skipPressed]}
          >
            <Text
              style={[
                styles.skipLabel,
                { color: theme.textMuted, fontFamily: theme.fontBodySemiBold },
              ]}
            >
              {skipLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {illustration ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.illustrationSection}
        >
          {illustration}
        </View>
      ) : (
        <View style={styles.illustrationSpacer} />
      )}

      <View style={styles.contentSection}>
        <Text style={[styles.title, { color: theme.text, fontFamily: theme.fontBodyBold }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={[styles.subtitle, { color: theme.accent, fontFamily: theme.fontBodySemiBold }]}
          >
            {subtitle}
          </Text>
        ) : null}
        <Text style={[styles.description, { color: theme.textMuted, fontFamily: theme.fontBody }]}>
          {description}
        </Text>
        {children}
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 16 }]}>
        {showPagination && step !== undefined ? (
          <View style={styles.pagination}>
            {Array.from({ length: totalSteps }, (_, index) => {
              const isActive = index + 1 === step;

              return (
                <View
                  key={index}
                  style={[
                    styles.paginationDot,
                    { backgroundColor: isActive ? theme.accent : inactiveDot },
                    isActive ? styles.paginationDotActive : null,
                  ]}
                />
              );
            })}
          </View>
        ) : null}

        <AuthButton loading={loading} showArrow={false} title={actionLabel} onPress={onAction} />
      </View>
    </SafeAreaView>
  );

  if (colorScheme === 'light') {
    return <View style={styles.root}>{content}</View>;
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      <ScreenGradient style={StyleSheet.absoluteFill} />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    height: 44,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  skipPressed: {
    opacity: 0.7,
  },
  skipLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  illustrationSection: {
    flex: 1,
    minHeight: 200,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationSpacer: {
    flex: 1,
    minHeight: 120,
  },
  contentSection: {
    paddingHorizontal: 28,
    paddingTop: 8,
    gap: 12,
    alignItems: 'center',
  },
  title: {
    width: '100%',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    textAlign: 'center',
  },
  subtitle: {
    width: '100%',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'center',
  },
  description: {
    width: '100%',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 28,
    paddingTop: 24,
    gap: 20,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  paginationDotActive: {
    width: 24,
  },
});
