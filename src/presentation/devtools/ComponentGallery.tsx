import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
  AsyncBoundary,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Divider,
  EmptyState,
  ErrorState,
  GradientPanel,
  Grid,
  HorizontalRail,
  Icon,
  IconButton,
  Image,
  Input,
  Modal,
  OfflineBanner,
  PasswordInput,
  Pill,
  Pressable,
  PriceText,
  QuantityStepper,
  Radio,
  RatingStars,
  Screen,
  ScreenHeader,
  SearchField,
  SectionHeader,
  SegmentedControl,
  Select,
  Sheet,
  Skeleton,
  Spinner,
  StatusPill,
  StickyBottomBar,
  Switch,
  TabBar,
  Text,
  TextArea,
  useToast,
} from '@presentation/components';
import { useTheme } from '@presentation/theme';

function GallerySection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ gap: theme.spacing.x3 }}>
      <SectionHeader title={title} />
      {children}
    </View>
  );
}

export function ComponentGallery() {
  const { t, i18n } = useTranslation();
  const { theme, isRTL, setPreviewRTL } = useTheme();
  const { showToast } = useToast();
  const [text, setText] = useState('');
  const [selected, setSelected] = useState('one');
  const [enabled, setEnabled] = useState(true);
  const [checked, setChecked] = useState(true);
  const [quantity, setQuantity] = useState(2);
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState('home');
  const choices = [
    { label: t('optionOne'), value: 'one' },
    { label: t('optionTwo'), value: 'two' },
  ];

  return (
    <Screen accessibilityLabel={t('galleryTitle')} bottomInset>
      <ScreenHeader
        title={t('galleryTitle')}
        onBack={() => undefined}
        backLabel={t('back')}
      />
      <Text color={theme.colors.textSecondary}>{t('gallerySubtitle')}</Text>

      <Card>
        <View style={{ gap: theme.spacing.x3 }}>
          <SegmentedControl
            accessibilityLabel={t('language')}
            options={[
              { label: t('arabic'), value: 'ar' },
              { label: t('english'), value: 'en' },
            ]}
            value={i18n.language === 'ar' ? 'ar' : 'en'}
            onChange={(locale) => void i18n.changeLanguage(locale)}
          />
          <SegmentedControl
            accessibilityLabel={t('direction')}
            options={[
              { label: t('rtl'), value: 'rtl' },
              { label: t('ltr'), value: 'ltr' },
            ]}
            value={isRTL ? 'rtl' : 'ltr'}
            onChange={(direction) => setPreviewRTL(direction === 'rtl')}
          />
        </View>
      </Card>

      <GallerySection title={t('primitives')}>
        <Card>
          <View style={{ gap: theme.spacing.x3 }}>
            <Text variant="h3" weight="bold">
              {t('typography')}
            </Text>
            <Text>{t('sampleBody')}</Text>
            <Box
              accessibilityLabel={t('sampleTitle')}
              style={{
                backgroundColor: theme.colors.accentLight,
                padding: theme.spacing.x3,
              }}
            >
              <Text color={theme.colors.accent}>{t('sampleTitle')}</Text>
            </Box>
            <Pressable
              accessibilityLabel={t('selected')}
              onPress={() => undefined}
              style={{ justifyContent: 'center' }}
            >
              <Text>{t('selected')}</Text>
            </Pressable>
            <View style={{ flexDirection: 'row', gap: theme.spacing.x3 }}>
              <Icon name="heart" color={theme.colors.pink} />
              <Icon name="cart" />
              <Icon name="arrow-back" />
            </View>
            <Image
              accessibilityLabel="BRANDHUB"
              source={require('../../../assets/icon.png')}
              style={{ height: theme.spacing.x20, width: theme.spacing.x20 }}
            />
          </View>
        </Card>
      </GallerySection>

      <GallerySection title={t('controls')}>
        <Card>
          <View style={{ gap: theme.spacing.x4 }}>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.spacing.x2,
              }}
            >
              <Button label={t('primary')} size="sm" />
              <Button label={t('secondary')} variant="secondary" />
              <Button label={t('ghost')} variant="ghost" />
              <Button label={t('danger')} variant="danger" size="lg" />
              <Button label={t('loadingButton')} loading />
              <Button label={t('disabledButton')} disabled />
              <IconButton
                icon="heart"
                accessibilityLabel={t('wishlist')}
                selected
              />
            </View>
            <Input
              label={t('email')}
              placeholder="name@example.com"
              value={text}
              onChangeText={setText}
            />
            <Input label={t('email')} error={t('states:genericErrorBody')} />
            <PasswordInput label={t('password')} />
            <TextArea label={t('sampleBody')} />
            <SearchField label={t('search')} placeholder={t('searchPh')} />
            <Select
              label={t('select')}
              placeholder={t('select')}
              options={choices}
              value={selected}
              onChange={setSelected}
            />
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.spacing.x2,
              }}
            >
              <Chip label={t('selected')} selected />
              <Chip label={t('remove')} removable />
            </View>
            <SegmentedControl
              accessibilityLabel={t('select')}
              options={choices}
              value={selected}
              onChange={setSelected}
            />
            <Switch
              label={t('enabled')}
              value={enabled}
              onValueChange={setEnabled}
            />
            <Radio
              label={t('optionOne')}
              selected={selected === 'one'}
              onPress={() => setSelected('one')}
            />
            <Checkbox
              label={t('selected')}
              selected={checked}
              onPress={() => setChecked(!checked)}
            />
            <QuantityStepper
              accessibilityLabel={t('quantity')}
              value={quantity}
              onChange={setQuantity}
              onRemove={() => setQuantity(0)}
            />
            <RatingStars rating={4} />
            <PriceText amount={38.9} originalAmount={48} />
          </View>
        </Card>
      </GallerySection>

      <GallerySection title={t('surfaces')}>
        <Card elevated>
          <View style={{ gap: theme.spacing.x3 }}>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: theme.spacing.x2,
              }}
            >
              <Badge label={t('primary')} />
              <Pill label={t('selected')} tone="accent" />
              <StatusPill label={t('enabled')} tone="success" />
            </View>
            <Divider />
            <Avatar accessibilityLabel="Salim" initials="SR" />
            <GradientPanel>
              <Text color={theme.colors.textInverse} weight="bold">
                {t('sampleTitle')}
              </Text>
            </GradientPanel>
            <View style={{ flexDirection: 'row', gap: theme.spacing.x2 }}>
              <Button label={t('openModal')} onPress={() => setModal(true)} />
              <Button
                label={t('openSheet')}
                onPress={() => setSheet(true)}
                variant="secondary"
              />
            </View>
          </View>
        </Card>
        <Modal
          visible={modal}
          title={t('modalTitle')}
          closeLabel={t('close')}
          onClose={() => setModal(false)}
        >
          <Text>{t('sampleBody')}</Text>
        </Modal>
        <Sheet
          visible={sheet}
          title={t('sheetTitle')}
          closeLabel={t('close')}
          onClose={() => setSheet(false)}
        >
          <Text>{t('sampleBody')}</Text>
        </Sheet>
      </GallerySection>

      <GallerySection title={t('feedback')}>
        <OfflineBanner message={t('states:offline')} />
        <View style={{ flexDirection: 'row', gap: theme.spacing.x4 }}>
          <Spinner accessibilityLabel={t('loading')} />
          <Skeleton accessibilityLabel={t('loading')} width="70%" />
        </View>
        <EmptyState
          title={t('states:ordersEmptyTitle')}
          body={t('states:ordersEmptyBody')}
          actionLabel={t('shopNow')}
        />
        <ErrorState
          title={t('states:genericErrorTitle')}
          body={t('states:genericErrorBody')}
          actionLabel={t('retry')}
        />
        <AsyncBoundary
          status="success"
          loading={<Spinner accessibilityLabel={t('loading')} />}
          empty={<Text>{t('states:ordersEmptyTitle')}</Text>}
          error={<Text>{t('states:genericErrorTitle')}</Text>}
        >
          <Text>{t('sampleBody')}</Text>
        </AsyncBoundary>
        <Button
          label={t('showToast')}
          onPress={() =>
            showToast({ message: t('toastMessage'), tone: 'success' })
          }
        />
      </GallerySection>

      <GallerySection title={t('layout')}>
        <HorizontalRail accessibilityLabel={t('todayDeals')}>
          <Chip label={t('optionOne')} />
          <Chip label={t('optionTwo')} />
        </HorizontalRail>
        <Grid>
          <Card>
            <Text>{t('optionOne')}</Text>
          </Card>
          <Card>
            <Text>{t('optionTwo')}</Text>
          </Card>
        </Grid>
        <StickyBottomBar>
          <Button label={t('apply')} fullWidth />
        </StickyBottomBar>
        <TabBar
          items={[
            { key: 'home', label: t('home'), icon: 'home' },
            { key: 'cart', label: t('cart'), icon: 'cart', badge: 3 },
            { key: 'account', label: t('account'), icon: 'person' },
          ]}
          selectedKey={tab}
          onSelect={setTab}
        />
      </GallerySection>
    </Screen>
  );
}
