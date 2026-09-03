import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import type { Category, CategoryRepository } from '@domain/catalog';

import {
  AsyncBoundary,
  EmptyState,
  ErrorState,
  Spinner,
} from '@presentation/components/feedback';
import { Screen } from '@presentation/components/layout';
import { Text } from '@presentation/components/primitives';
import { useCategoryDebug } from '@presentation/features/diagnostics/viewmodels/useCategoryDebug';
import { useTheme } from '@presentation/theme';

export function CategoryDebugScreen({
  repository,
}: {
  repository: CategoryRepository;
}) {
  const { t } = useTranslation();
  const query = useCategoryDebug(repository);

  return (
    <Screen accessibilityLabel={t('categoryDebugTitle')}>
      <Text variant="h1" weight="bold">
        {t('categoryDebugTitle')}
      </Text>
      <Text>{t('categoryDebugSubtitle')}</Text>
      <AsyncBoundary
        status={query.status}
        isEmpty={query.data?.length === 0}
        loading={<Spinner accessibilityLabel={t('loading')} />}
        empty={
          <EmptyState
            title={t('categoryDebugEmpty')}
            body={t('categoryDebugEmptyBody')}
          />
        }
        error={
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void query.refetch()}
          />
        }
      >
        <View>
          {query.data?.map((category) => (
            <CategoryRow key={category.id} category={category} depth={0} />
          ))}
        </View>
      </AsyncBoundary>
    </Screen>
  );
}

function CategoryRow({
  category,
  depth,
}: {
  category: Category;
  depth: number;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={{
        borderBottomColor: theme.colors.border,
        borderBottomWidth: 1,
        paddingStart: depth * theme.spacing.x4,
        paddingVertical: theme.spacing.x2,
      }}
    >
      <Text
        testID={`category-${category.id}`}
        weight={depth === 0 ? 'semibold' : 'regular'}
      >
        {category.title}
      </Text>
      {category.children.map((child) => (
        <CategoryRow key={child.id} category={child} depth={depth + 1} />
      ))}
    </View>
  );
}
