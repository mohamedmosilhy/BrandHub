import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type {
  FollowInfluencerUseCase,
  GetInfluencerProfileUseCase,
} from '@domain/social';

import { ErrorState, Skeleton } from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Icon, Pressable, Text } from '@presentation/components/primitives';
import { formatCount } from '@presentation/formatting';
import { gradients, mobile, useTheme } from '@presentation/theme';

import { InfluencerAvatar, ShoppablePostCard } from './components';
import { useFollowInfluencer, useInfluencerProfile } from './useSocialQueries';

/**
 * `design-reference/BRANDHUB App.dc.html`: a `#EEEDF9 → #FCEEF3` band carrying a 34 px back
 * control, a 78 px gradient-ringed avatar beside the name, handle and bio, the follow and
 * message actions, and the three unboxed stats — posts, followers, products. The shoppable feed
 * runs underneath it.
 */
export function InfluencerProfileScreen({
  influencerId,
  getInfluencerProfile,
  followInfluencer,
  authenticated,
  onRequireAuth,
  onFollowFailed,
  onMessageUnavailable,
  onBack,
  onOpenProduct,
}: {
  influencerId: string;
  getInfluencerProfile: GetInfluencerProfileUseCase;
  followInfluencer: FollowInfluencerUseCase;
  authenticated: boolean;
  onRequireAuth: () => void;
  onFollowFailed: () => void;
  onMessageUnavailable: () => void;
  onBack: () => void;
  onOpenProduct: (productId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const geometry = theme.mobile.influencer;
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const query = useInfluencerProfile(
    getInfluencerProfile,
    locale,
    influencerId,
  );
  const follow = useFollowInfluencer({
    useCase: followInfluencer,
    locale,
    onFailure: onFollowFailed,
  });
  const influencer = query.data?.influencer;

  const stats = influencer
    ? [
        { value: formatCount(influencer.postCount), label: t('posts') },
        { value: formatCount(influencer.followers), label: t('followers') },
        { value: formatCount(influencer.productCount), label: t('products') },
      ]
    : [];

  return (
    <Screen
      accessibilityLabel={influencer?.name ?? t('influencers')}
      background={theme.colors.surface}
      bottomInset
      edgeToEdge
      gap={0}
      paddingTop={0}
    >
      <LinearGradient
        colors={[...gradients.influencerCover.colors]}
        start={gradients.influencerCover.start}
        end={gradients.influencerCover.end}
        style={styles.cover}
      >
        <Pressable
          accessibilityLabel={t('back')}
          compact
          compactSize={geometry.backSize}
          onPress={onBack}
          style={[
            styles.back,
            {
              backgroundColor: theme.colors.onDarkPrimary,
              borderRadius: theme.radius.full,
              height: geometry.backSize,
              width: geometry.backSize,
            },
          ]}
        >
          <Icon name="arrow-back" size={geometry.backIconSize} />
        </Pressable>

        {query.isPending ? (
          <View style={styles.loading}>
            <Skeleton
              accessibilityLabel={t('loading')}
              height={geometry.avatarSize}
              width="70%"
            />
          </View>
        ) : influencer ? (
          <>
            <View style={styles.identity}>
              <InfluencerAvatar
                influencer={influencer}
                ring={geometry.avatarRing}
                size={geometry.avatarSize}
                variant="h2"
              />
              <View style={styles.identityCopy}>
                <Text variant="bodyLg" weight="extrabold">
                  {influencer.name}
                </Text>
                <Text color={theme.colors.textSecondary} latin variant="xs">
                  {influencer.handle}
                </Text>
                <Text color={theme.colors.textSecondary} variant="xxs">
                  {influencer.bio}
                </Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                accessibilityLabel={
                  influencer.following ? t('followingAction') : t('follow')
                }
                accessibilityState={{ selected: influencer.following }}
                onPress={() => {
                  if (!authenticated) {
                    onRequireAuth();
                    return;
                  }
                  follow.mutate({
                    id: influencer.id,
                    following: influencer.following,
                  });
                }}
                style={[
                  styles.action,
                  {
                    backgroundColor: influencer.following
                      ? theme.colors.accentHover
                      : theme.colors.accent,
                    borderRadius: geometry.actionRadius,
                    height: geometry.actionHeight,
                  },
                ]}
              >
                <Text
                  color={theme.colors.textInverse}
                  variant="sm"
                  weight="bold"
                >
                  {influencer.following ? t('followingAction') : t('follow')}
                </Text>
              </Pressable>
              {/*
                The prototype's second action. Direct messaging has no contract — FA1 covers the
                follow relationship only — so it says so rather than opening a dead screen.
              */}
              <Pressable
                accessibilityLabel={t('message')}
                onPress={onMessageUnavailable}
                style={[
                  styles.action,
                  {
                    borderColor: theme.colors.accent,
                    borderRadius: geometry.actionRadius,
                    borderWidth: geometry.followPillBorder,
                    height: geometry.actionHeight,
                  },
                ]}
              >
                <Text color={theme.colors.accent} variant="sm" weight="bold">
                  {t('message')}
                </Text>
              </Pressable>
            </View>

            <View style={styles.stats}>
              {stats.map((stat) => (
                <View key={stat.label} style={styles.stat}>
                  <Text latin variant="bodyLg" weight="extrabold">
                    {stat.value}
                  </Text>
                  <Text color={theme.colors.textSecondary} variant="nano">
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </LinearGradient>

      {query.isError ? (
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
          onAction={() => void query.refetch()}
        />
      ) : query.data ? (
        <View style={styles.feed}>
          <Text variant="sm" weight="extrabold">
            {t('shoppablePosts')}
          </Text>
          {query.data.posts.map((post) => (
            <ShoppablePostCard
              key={post.id}
              post={post}
              onOpenProduct={onOpenProduct}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  actions: {
    flexDirection: 'row',
    gap: mobile.influencer.actionGap,
    marginTop: mobile.influencer.actionsTop,
  },
  back: { alignItems: 'center', justifyContent: 'center' },
  cover: {
    paddingBottom: mobile.influencer.coverPaddingBottom,
    paddingHorizontal: mobile.influencer.coverPaddingX,
    paddingTop: mobile.influencer.coverPaddingTop,
  },
  feed: {
    gap: mobile.influencer.feedGap,
    paddingBottom: mobile.influencer.feedPaddingBottom,
    paddingHorizontal: mobile.influencer.feedPaddingX,
    paddingTop: mobile.screenPaddingX,
  },
  identity: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: mobile.influencer.identityGap,
    marginTop: mobile.gapRow,
  },
  identityCopy: { flex: 1, gap: mobile.gapMicro },
  loading: { marginTop: mobile.gapRow },
  stat: { gap: 2 },
  stats: {
    flexDirection: 'row',
    gap: mobile.influencer.statGap,
    marginTop: mobile.influencer.statsTop,
  },
});
