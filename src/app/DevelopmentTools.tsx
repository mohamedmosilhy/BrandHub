import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { SegmentedControl } from '@presentation/components/controls';
import { ComponentGallery } from '@presentation/devtools';
import { CategoryDebugScreen } from '@presentation/features/diagnostics';
import { useTheme } from '@presentation/theme';

import { useContainer } from '@app/di';

type Tool = 'gallery' | 'categories';

export function DevelopmentTools() {
  const [tool, setTool] = useState<Tool>('categories');
  const { t } = useTranslation();
  const { categoryRepository } = useContainer();
  const { theme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.colors.background, flex: 1 }}>
      <View style={{ padding: theme.spacing.x2 }}>
        <SegmentedControl
          accessibilityLabel={t('developerTools')}
          value={tool}
          options={[
            { label: t('categoryDebugTab'), value: 'categories' },
            { label: t('galleryTitle'), value: 'gallery' },
          ]}
          onChange={(value) => setTool(value as Tool)}
        />
      </View>
      {tool === 'categories' ? (
        <CategoryDebugScreen repository={categoryRepository} />
      ) : (
        <ComponentGallery />
      )}
    </View>
  );
}
