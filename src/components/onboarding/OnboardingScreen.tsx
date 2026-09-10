import { Image, type ImageSource } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import type { PropsWithChildren, ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AuthButton } from '@/src/components/auth/AuthButton';
import { useHiveTheme } from '@/src/hooks/useHiveTheme';

export const ONBOARDING_CONTENT_STEPS = 4;

const PHOTO_TITLE = '#F6F2EA';
const PHOTO_BODY = '#C2B8AC';
const PHOTO_SKIP = '#9C9287';
const PHOTO_DOT_INACTIVE = '#FFFFFF33';
const SCRIM_COLORS = ['#0B0A08A6', '#0B0A0866', '#0B0A08FA'] as const;

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
  backgroundSource?: ImageSource;
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
  backgroundSource,
  children,
}: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useHiveTheme();
  const isPhoto = Boolean(backgroundSource);
  const titleColor = isPhoto ? PHOTO_TITLE : theme.text;
  const bodyColor = isPhoto ? PHOTO_BODY : theme.textMuted;
  const skipColor = isPhoto ? PHOTO_SKIP : theme.textMuted;
  const inactiveDot = isPhoto ? PHOTO_DOT_INACTIVE : `${theme.text}33`;

  return (
    <View style={styles.root}>
      {backgroundSource ? (
        <>
          <Image contentFit="cover" source={backgroundSource} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={[...SCRIM_COLORS]}
            end={{ x: 0.5, y: 1 }}
            locations={[0, 0.34, 0.8]}
            pointerEvents="none"
            start={{ x: 0.5, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <StatusBar style="light" />
        </>
      ) : (
        <LinearGradient
          colors={[...theme.gradients.screen]}
          locations={theme.gradients.screenLocations}
          style={StyleSheet.absoluteFill}
        />
      )}

      <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
        {illustration ? <View style={styles.illustrationSection}>{illustration}</View> : <View style={styles.photoSpacer} />}

        <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
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
          ) : (
            <View style={styles.paginationSpacer} />
          )}

          <View style={styles.contentSection}>
            <Text
              style={[
                styles.title,
                {
                  color: titleColor,
                  fontFamily: theme.fontDisplay,
                  letterSpacing: isPhoto ? -1.5 : 0,
                },
              ]}
            >
              {title}
            </Text>
            {subtitle ? (
              <Text
                style={[
                  styles.subtitle,
                  { color: theme.accent, fontFamily: theme.fontBodySemiBold },
                ]}
              >
                {subtitle}
              </Text>
            ) : null}
            <Text style={[styles.description, { color: bodyColor, fontFamily: theme.fontBody }]}>
              {description}
            </Text>
            {children}
          </View>

          <View style={styles.footer}>
            <AuthButton loading={loading} title={actionLabel} onPress={onAction} />
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
                    { color: skipColor, fontFamily: theme.fontBodySemiBold },
                  ]}
                >
                  {skipLabel}
                </Text>
              </Pressable>
            ) : (
              <View style={styles.skipSpacer} />
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B0A08',
  },
  safeArea: {
    flex: 1,
  },
  photoSpacer: {
    flex: 1,
  },
  illustrationSection: {
    flex: 1,
    minHeight: 240,
    paddingHorizontal: 28,
    paddingTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: {
    paddingHorizontal: 24,
    gap: 26,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationSpacer: {
    height: 4,
  },
  paginationDot: {
    width: 8,
    height: 4,
    borderRadius: 2,
  },
  paginationDotActive: {
    width: 26,
    height: 4,
    borderRadius: 2,
  },
  contentSection: {
    gap: 14,
  },
  title: {
    width: '100%',
    fontSize: 40,
    fontWeight: '700',
    lineHeight: 44,
    textAlign: 'left',
  },
  subtitle: {
    width: '100%',
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    textAlign: 'left',
  },
  description: {
    width: '100%',
    fontSize: 15,
    fontWeight: '400',
    lineHeight: 22,
    textAlign: 'left',
  },
  footer: {
    gap: 16,
    alignItems: 'center',
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
  skipSpacer: {
    height: 26,
  },
});
