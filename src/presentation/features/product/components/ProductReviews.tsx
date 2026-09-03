import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type { Review } from '@domain/catalog';

import { Button, RatingStars } from '@presentation/components/controls';
import { Text } from '@presentation/components/primitives';
import { formatRelativeTime } from '@presentation/formatting';
import { useTheme } from '@presentation/theme';

/**
 * Also an addition — the reference never drew reviews. AC7.14 fixes the content: reviewer,
 * stars, relative time and text, with an empty state when a product has never been reviewed.
 */
export function ProductReviews({
  reviews,
  total,
  locale,
  hasMore,
  isLoadingMore,
  onLoadMore,
}: {
  reviews: readonly Review[];
  total: number;
  locale: 'ar' | 'en';
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
}) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text variant="sm" weight="extrabold">
          {t('reviews')}
        </Text>
        {total > 0 ? (
          <Text color={theme.colors.textMuted} variant="micro">
            {t('reviewCount', { count: total })}
          </Text>
        ) : null}
      </View>

      {reviews.length === 0 ? (
        <Text color={theme.colors.textMuted} variant="xs">
          {t('noReviewsYet')}
        </Text>
      ) : (
        reviews.map((review) => (
          <View
            key={review.id}
            style={[
              styles.review,
              { borderColor: theme.colors.border, borderRadius: 14 },
            ]}
          >
            <View style={styles.meta}>
              <Text variant="xs" weight="bold">
                {review.authorName || t('anonymousReviewer')}
              </Text>
              <Text
                color={theme.colors.textMuted}
                style={styles.time}
                variant="micro"
              >
                {formatRelativeTime(review.createdAt, locale)}
              </Text>
            </View>
            <RatingStars
              accessibilityLabel={t('ratingValue', {
                value: review.rating.toFixed(1),
              })}
              rating={review.rating}
            />
            <Text color={theme.colors.textSecondary} variant="xs">
              {review.comment}
            </Text>
          </View>
        ))
      )}

      {hasMore ? (
        <Button
          label={t('loadMoreReviews')}
          loading={isLoadingMore}
          size="sm"
          variant="ghost"
          onPress={onLoadMore}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { alignItems: 'baseline', flexDirection: 'row', gap: 8 },
  meta: { alignItems: 'baseline', flexDirection: 'row', gap: 8 },
  review: { borderWidth: 1, gap: 7, padding: 12 },
  section: { gap: 9 },
  time: { marginInlineStart: 'auto' },
});
