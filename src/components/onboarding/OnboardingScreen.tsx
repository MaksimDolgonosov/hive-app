import { LinearGradient } from 'expo-linear-gradient';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { LanguageSelect } from '@/src/components/ui/LanguageSelect';

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
  showLanguagePicker?: boolean;
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
  showLanguagePicker = false,
  showPagination = true,
  illustration,
  children,
}: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <LinearGradient
      colors={['#FFF8ED', '#FFE8B8', '#FFD54F33']}
      locations={[0, 0.6, 1]}
      style={styles.root}
    >
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {onSkip ? (
          <View style={styles.skipRow}>
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={onSkip}
              style={({ pressed }) => [styles.skipButton, pressed && styles.skipPressed]}
            >
              <Text style={styles.skipLabel}>{skipLabel}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.skipSpacer} />
        )}

        <View style={styles.illustrationSection}>{illustration}</View>

        <View style={styles.contentSection}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <Text style={styles.description}>{description}</Text>

          {showLanguagePicker ? <LanguageSelect className="mt-4 w-full" /> : null}
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
                    style={[styles.paginationDot, isActive ? styles.paginationDotActive : null]}
                  />
                );
              })}
            </View>
          ) : null}

          <AuthButton loading={loading} title={actionLabel} onPress={onAction} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  skipRow: {
    height: 44,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  skipSpacer: {
    height: 44,
  },
  skipButton: {
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  skipPressed: {
    opacity: 0.7,
  },
  skipLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    fontWeight: '600',
    color: '#8B7355',
  },
  illustrationSection: {
    minHeight: 320,
    paddingHorizontal: 32,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentSection: {
    paddingHorizontal: 28,
    paddingTop: 8,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    width: '100%',
    maxWidth: 334,
    fontFamily: 'Inter-Bold',
    fontSize: 26,
    fontWeight: '700',
    lineHeight: 32,
    color: '#2C1810',
    textAlign: 'center',
  },
  subtitle: {
    width: '100%',
    maxWidth: 334,
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    color: '#F5A623',
    textAlign: 'center',
  },
  description: {
    width: '100%',
    maxWidth: 334,
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    color: '#8B7355',
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
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
    backgroundColor: '#F5A62344',
  },
  paginationDotActive: {
    width: 24,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F5A623',
  },
});
