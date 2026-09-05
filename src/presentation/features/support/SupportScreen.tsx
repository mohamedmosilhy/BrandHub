import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { isAppError } from '@core/errors';

import type { GetOrdersUseCase } from '@domain/orders';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  type CreateTicketUseCase,
  type GetTicketsUseCase,
  type Ticket,
  type TicketCategory,
  type TicketDraft,
  type TicketField,
  type TicketPriority,
} from '@domain/support';

import {
  Button,
  Chip,
  Input,
  Select,
  TextArea,
  type Choice,
} from '@presentation/components/controls';
import {
  EmptyState,
  ErrorState,
  Skeleton,
  useToast,
} from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { Pressable, Text } from '@presentation/components/primitives';
import { StatusPill } from '@presentation/components/surfaces';
import { formatRelativeTime } from '@presentation/formatting';
import { mobile, useTheme } from '@presentation/theme';

import { statusTone, TICKET_STATUS_KEY } from './ticketStatus';
import { useCreateTicket, useTickets } from './useSupportQueries';

/** The prototype's six category chips and three priority blocks, in its order. */
const CATEGORY_KEY: Record<TicketCategory, string> = {
  ORDER: 'catOrder',
  PAYMENT: 'catPayment',
  DELIVERY: 'catDelivery',
  RETURN: 'catReturn',
  WALLET: 'catWallet',
  OTHER: 'catOther',
};

/** The contract's middle priority is `NORMAL`; the prototype labels it "Medium". */
export const PRIORITY_KEY: Record<TicketPriority, string> = {
  LOW: 'priLow',
  NORMAL: 'priMed',
  HIGH: 'priHigh',
};

const BLANK = (orderId: string | null): TicketDraft => ({
  category: 'ORDER',
  priority: 'NORMAL',
  orderId,
  subject: '',
  description: '',
});

export function TicketRow({
  ticket,
  onPress,
}: {
  ticket: Ticket;
  onPress: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  return (
    <Pressable
      accessibilityLabel={ticket.subject}
      onPress={onPress}
      style={[
        styles.row,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.mobile.support.rowRadius,
          padding: theme.mobile.support.rowPadding,
        },
      ]}
    >
      <View style={styles.rowTop}>
        <Text
          color={theme.colors.textMuted}
          latin
          variant="micro"
          weight="bold"
        >
          {ticket.ticketNumber}
        </Text>
        <View style={styles.pill}>
          <StatusPill
            label={t(TICKET_STATUS_KEY[ticket.status])}
            tone={statusTone(ticket.status)}
          />
        </View>
      </View>
      <Text variant="xs" weight="bold">
        {ticket.subject}
      </Text>
      <Text color={theme.colors.textMuted} variant="micro">
        {`${t(CATEGORY_KEY[ticket.category])} · ${t(PRIORITY_KEY[ticket.priority])} · ${formatRelativeTime(ticket.updatedAt, locale)}`}
      </Text>
    </Pressable>
  );
}

/**
 * `design-reference/BRANDHUB App.dc.html`: the new-ticket form — six category pills, three
 * priority blocks, the related-order select, subject and description — over the my-tickets list.
 */
export function SupportScreen({
  orderId,
  getTickets,
  getOrders,
  createTicket,
  onBack,
  onOpenTicket,
}: {
  /** Present when support was opened from an order (AC12.10); it preselects that order. */
  orderId?: string;
  getTickets: GetTicketsUseCase;
  getOrders: GetOrdersUseCase;
  createTicket: CreateTicketUseCase;
  onBack: () => void;
  onOpenTicket: (ticketId: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const geometry = theme.mobile.support;

  const tickets = useTickets(getTickets, locale);
  // AC12.2 — the related-order select lists the account's own orders. Only the first page is
  // needed: a ticket is raised about a recent order, and the select is not a browsing surface.
  const orders = useQuery({
    queryKey: ['support', 'order-options'],
    queryFn: async () => {
      const result = await getOrders.execute();
      if (!result.ok) throw result.error;
      return result.value;
    },
  });
  const create = useCreateTicket({ createTicket, locale });

  const [draft, setDraft] = useState<TicketDraft>(() => BLANK(orderId ?? null));
  const [invalid, setInvalid] = useState<readonly TicketField[]>([]);
  const [failed, setFailed] = useState('');

  function change<K extends keyof TicketDraft>(key: K, value: TicketDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setInvalid([]);
    setFailed('');
  }

  const orderChoices: readonly Choice[] = [
    { label: t('noRelatedOrder'), value: '' },
    ...(orders.data ?? []).map((order) => ({
      label: order.orderNumber,
      value: order.id,
    })),
  ];

  async function submit() {
    setInvalid([]);
    setFailed('');
    const result = await create.mutateAsync(draft).then(
      (ticket) => ({ ok: true as const, ticket }),
      (error: unknown) => ({ ok: false as const, error }),
    );
    if (result.ok) {
      showToast({ message: t('ticketSent'), tone: 'success' });
      setDraft(BLANK(orderId ?? null));
      return;
    }
    // AC12.3 — the use case names every empty field at once, so both messages appear together.
    const fields =
      isAppError(result.error) && result.error.code === 'TICKET_INCOMPLETE'
        ? ((result.error.details?.['fields'] ?? []) as readonly TicketField[])
        : [];
    if (fields.length > 0) setInvalid(fields);
    else setFailed(t('ticketFailed'));
  }

  return (
    <Screen
      accessibilityLabel={t('support')}
      edgeToEdge
      gap={0}
      keyboardAware
      paddingTop={0}
    >
      <ScreenHeader
        title={t('support')}
        backLabel={t('back')}
        onBack={onBack}
      />
      <View style={styles.page}>
        <Text variant="sm" weight="extrabold">
          {t('newTicket')}
        </Text>

        <View style={styles.field}>
          <Text color={theme.colors.textSecondary} variant="xs" weight="bold">
            {t('category')}
          </Text>
          <View accessibilityRole="radiogroup" style={styles.chips}>
            {TICKET_CATEGORIES.map((category) => (
              <Chip
                key={category}
                label={t(CATEGORY_KEY[category])}
                selected={draft.category === category}
                onPress={() => change('category', category)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text color={theme.colors.textSecondary} variant="xs" weight="bold">
            {t('priority')}
          </Text>
          <View accessibilityRole="radiogroup" style={styles.priorities}>
            {TICKET_PRIORITIES.map((priority) => (
              <View key={priority} style={styles.flex}>
                <Chip
                  label={t(PRIORITY_KEY[priority])}
                  shape="block"
                  selected={draft.priority === priority}
                  onPress={() => change('priority', priority)}
                />
              </View>
            ))}
          </View>
        </View>

        <Select
          label={t('relatedOrder')}
          placeholder={t('noRelatedOrder')}
          options={orderChoices}
          value={draft.orderId ?? ''}
          onChange={(value) => change('orderId', value || null)}
        />
        <Input
          label={t('subject')}
          placeholder={t('subject')}
          value={draft.subject}
          onChangeText={(value) => change('subject', value)}
          {...(invalid.includes('subject')
            ? { error: t('subjectRequired') }
            : {})}
        />
        <TextArea
          label={t('description')}
          placeholder={t('description')}
          value={draft.description}
          onChangeText={(value) => change('description', value)}
          {...(invalid.includes('description')
            ? { error: t('descriptionRequired') }
            : failed
              ? { error: failed }
              : {})}
        />
        <Button
          fullWidth
          label={t('submitTicket')}
          loading={create.isPending}
          onPress={() => void submit()}
        />

        <Text
          style={{ marginTop: geometry.fieldGap }}
          variant="sm"
          weight="extrabold"
        >
          {t('myTickets')}
        </Text>
        {tickets.isPending ? (
          <>
            <Skeleton accessibilityLabel={t('loading')} height={92} />
            <Skeleton accessibilityLabel={t('loading')} height={92} />
          </>
        ) : tickets.isError ? (
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void tickets.refetch()}
          />
        ) : (tickets.data ?? []).length === 0 ? (
          <EmptyState
            title={t('states:ticketsEmptyTitle')}
            body={t('states:ticketsEmptyBody')}
            icon="shield"
          />
        ) : (
          (tickets.data ?? []).map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              onPress={() => onOpenTicket(ticket.id)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobile.support.chipGap,
  },
  field: { gap: mobile.support.fieldGap },
  flex: { flex: 1 },
  page: { gap: mobile.support.formGap, padding: mobile.support.formPadding },
  pill: { marginInlineStart: 'auto' },
  priorities: { flexDirection: 'row', gap: mobile.support.chipGap },
  row: { borderWidth: 1, gap: mobile.support.rowGap },
  rowTop: { alignItems: 'center', flexDirection: 'row', gap: 8 },
});
