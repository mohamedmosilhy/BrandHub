import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type {
  FollowInfluencerUseCase,
  GetInfluencersUseCase,
  Influencer,
} from '@domain/social';

import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Pressable, Text } from '@presentation/components/primitives';
import { formatCount } from '@presentation/formatting';
import { mobile, useTheme } from '@presentation/theme';

import { InfluencerAvatar } from './components';
import { useFollowInfluencer, useInfluencers } from './useSocialQueries';

/**
 * The prototype's directory row: a 52 px gradient-ringed avatar, the name at `12.5px/700`, the
 * handle and follower count on one LTR line beneath it, and an outline follow pill on the
 * trailing edge.
 */
export function InfluencerRow({
  influencer,
  index,
  onOpen,
  onToggleFollow,
}: {
  influencer: Influencer;
  index: number;
  onOpen: () => void;
  onToggleFollow: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const geometry = theme.mobile.influencer;
  return (
    <Pressable
      accessibilityLabel={influencer.name}
      onPress={onOpen}
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: geometry.rowRadius,
          padding: geometry.rowPadding,
        },
      ]}
    >
      <InfluencerAvatar
        influencer={influencer}
        index={index}
        ring={geometry.rowAvatarRing}
        size={geometry.rowAvatarSize}
        variant="h3"
      />
      <View style={styles.rowCopy}>
        <Text variant="sm" weight="bold">
          {influencer.name}
        </Text>
        <Text color={theme.colors.textMuted} latin variant="micro">
          {`${influencer.handle} · ${formatCount(influencer.followers)}`}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={
          influencer.following ? t('followingAction') : t('follow')
        }
        accessibilityState={{ selected: influencer.following }}
        compact
        onPress={onToggleFollow}
        style={[
          styles.followPill,
          {
            backgroundColor: influencer.following
              ? theme.colors.accent
              : theme.colors.transparent,
            borderColor: theme.colors.accent,
            borderRadius: theme.radius.full,
            borderWidth: geometry.followPillBorder,
            paddingHorizontal: geometry.followPillPaddingX,
            paddingVertical: geometry.followPillPaddingY,
          },
        ]}
      >
        <Text
          color={
            influencer.following
              ? theme.colors.textInverse
              : theme.colors.accent
          }
          variant="xxs"
          weight="bold"
        >
          {influencer.following ? t('followingAction') : t('follow')}
        </Text>
      </Pressable>
    </Pressable>
  );
}

export function InfluencersScreen({
  getInfluencers,
  followInfluencer,
  authenticated,
  onRequireAuth,
  onFollowFailed,
  onOpenInfluencer,
}: {
  getInfluencers: GetInfluencersUseCase;
  followInfluencer: FollowInfluencerUseCase;
  authenticated: boolean;
  onRequireAuth: () => void;
  onFollowFailed: () => void;
  onOpenInfluencer: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const query = useInfluencers(getInfluencers, locale);
  const follow = useFollowInfluencer({
    useCase: followInfluencer,
    locale,
    onFailure: onFollowFailed,
  });
  const influencers = query.data ?? [];

  return (
    <Screen
      accessibilityLabel={t('influencers')}
      edgeToEdge
      gap={0}
      paddingTop={0}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.surface,
            borderBottomColor: theme.colors.border,
          },
        ]}
      >
        <Text variant="h3" weight="extrabold">
          {t('influencers')}
        </Text>
      </View>
      <View style={styles.list}>
        {query.isPending ? (
          Array.from({ length: 6 }, (_, index) => (
            <Skeleton
              key={index}
              accessibilityLabel={t('loading')}
              height={74}
            />
          ))
        ) : query.isError ? (
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void query.refetch()}
          />
        ) : influencers.length === 0 ? (
          <EmptyState
            title={t('noResultsFound')}
            body={t('tryOther')}
            icon="person"
          />
        ) : (
          influencers.map((influencer, index) => (
            <InfluencerRow
              key={influencer.id}
              index={index}
              influencer={influencer}
              onOpen={() => onOpenInfluencer(influencer.id)}
              onToggleFollow={() => {
                // Following is identity-bound (D3). A guest is sent to sign in rather than
                // being shown an optimistic state the server would refuse.
                if (!authenticated) {
                  onRequireAuth();
                  return;
                }
                follow.mutate({
                  id: influencer.id,
                  following: influencer.following,
                });
              }}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  followPill: { alignItems: 'center', justifyContent: 'center' },
  header: {
    borderBottomWidth: 1,
    paddingHorizontal: mobile.homePaddingX,
    paddingVertical: mobile.influencer.coverPaddingTop,
  },
  list: {
    gap: mobile.gapItem,
    paddingHorizontal: mobile.screenPaddingX,
    paddingVertical: 14,
  },
  row: {
    alignItems: 'center',
    borderWidth: 1,
    flexDirection: 'row',
    gap: mobile.influencer.rowGap,
  },
  rowCopy: { flex: 1, gap: 3 },
});
