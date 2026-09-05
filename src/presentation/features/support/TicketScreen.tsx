import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import type {
  GetTicketUseCase,
  ReplyToTicketUseCase,
  Ticket,
  TicketMessage,
} from '@domain/support';
import { ticketThread } from '@domain/support';

import { Button, TextArea } from '@presentation/components/controls';
import {
  ErrorState,
  Skeleton,
  useToast,
} from '@presentation/components/feedback';
import { Screen, ScreenHeader } from '@presentation/components/layout';
import { Text } from '@presentation/components/primitives';
import { Pill, StatusPill } from '@presentation/components/surfaces';
import { formatRelativeTime } from '@presentation/formatting';
import { mobile, useTheme } from '@presentation/theme';

import { PRIORITY_KEY } from './SupportScreen';
import { statusTone, TICKET_STATUS_KEY } from './ticketStatus';
import { useReplyToTicket, useTicket } from './useSupportQueries';

const CATEGORY_KEY: Record<Ticket['category'], string> = {
  ORDER: 'catOrder',
  PAYMENT: 'catPayment',
  DELIVERY: 'catDelivery',
  RETURN: 'catReturn',
  WALLET: 'catWallet',
  OTHER: 'catOther',
};

/**
 * The prototype's bubble: the customer's own messages sit at the reading start on `#EEEDF9`,
 * support's at the reading end on `#F5F5F7`, both capped at 84% of the column. `alignSelf` takes
 * `flex-start` / `flex-end`, which Yoga resolves against the reading direction — so the two sides
 * swap correctly under RTL without naming a physical edge.
 */
export function ThreadMessage({ message }: { message: TicketMessage }) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const mine = message.author === 'CUSTOMER';
  return (
    <View
      accessibilityLabel={message.body}
      style={[styles.message, { alignSelf: mine ? 'flex-start' : 'flex-end' }]}
    >
      <Text color={theme.colors.textMuted} variant="nano" weight="bold">
        {`${mine ? t('you') : t('supportAgent')} · ${formatRelativeTime(message.createdAt, locale)}`}
      </Text>
      <Text
        style={[
          styles.bubble,
          {
            backgroundColor: mine
              ? theme.colors.accentLight
              : theme.colors.background,
            borderRadius: theme.mobile.support.bubbleRadius,
          },
        ]}
        variant="xs"
      >
        {message.body}
      </Text>
    </View>
  );
}

export function TicketScreen({
  ticketId,
  getTicket,
  replyToTicket,
  onBack,
}: {
  ticketId: string;
  getTicket: GetTicketUseCase;
  replyToTicket: ReplyToTicketUseCase;
  onBack: () => void;
}) {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const { showToast } = useToast();
  const locale = i18n.resolvedLanguage ?? i18n.language;
  const dateLocale = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const query = useTicket(getTicket, locale, ticketId);
  const reply = useReplyToTicket({ replyToTicket, locale, ticketId });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const ticket = query.data;

  async function send() {
    setError('');
    const sent = await reply.mutateAsync(message).then(
      () => true,
      () => false,
    );
    if (!sent) {
      // AC12.9 — an empty reply is the use case's block; anything else is a transport failure.
      setError(message.trim() ? t('replyFailed') : t('replyRequired'));
      return;
    }
    setMessage('');
    showToast({ message: t('replySent'), tone: 'success' });
  }

  return (
    <Screen
      accessibilityLabel={ticket?.ticketNumber ?? t('support')}
      background={theme.colors.surface}
      bottomInset
      edgeToEdge
      gap={0}
      keyboardAware
      paddingTop={0}
    >
      <ScreenHeader
        title={ticket?.ticketNumber ?? t('support')}
        backLabel={t('back')}
        onBack={onBack}
        actions={
          ticket ? (
            <StatusPill
              label={t(TICKET_STATUS_KEY[ticket.status])}
              tone={statusTone(ticket.status)}
            />
          ) : null
        }
      />

      {query.isPending ? (
        <View style={styles.states}>
          <Skeleton accessibilityLabel={t('loading')} height={120} />
          <Skeleton accessibilityLabel={t('loading')} height={80} />
        </View>
      ) : query.isError || !ticket ? (
        <View style={styles.states}>
          <ErrorState
            title={t('states:genericErrorTitle')}
            body={t('states:genericErrorBody')}
            actionLabel={t('retry')}
            onAction={() => void query.refetch()}
          />
        </View>
      ) : (
        <>
          <View
            style={[styles.header, { borderBottomColor: theme.colors.border }]}
          >
            <Text variant="body" weight="extrabold">
              {ticket.subject}
            </Text>
            <View style={styles.metaChips}>
              <Pill label={t(CATEGORY_KEY[ticket.category])} tone="accent" />
              <Pill label={t(PRIORITY_KEY[ticket.priority])} tone="neutral" />
              {ticket.orderId ? (
                <Pill label={ticket.orderId} tone="neutral" />
              ) : null}
            </View>
            <Text color={theme.colors.textMuted} variant="xxs">
              {`${t('lastUpdate')}: ${formatRelativeTime(ticket.updatedAt, dateLocale)}`}
            </Text>
          </View>

          <View style={styles.thread}>
            {ticketThread(ticket).map((entry) => (
              <ThreadMessage key={entry.id} message={entry} />
            ))}
          </View>

          <View
            style={[styles.replyBar, { borderTopColor: theme.colors.border }]}
          >
            <View style={styles.flex}>
              <TextArea
                label={t('reply')}
                placeholder={t('reply')}
                value={message}
                onChangeText={(value) => {
                  setMessage(value);
                  setError('');
                }}
                {...(error ? { error } : {})}
              />
            </View>
            <Button
              label={t('sendReply')}
              loading={reply.isPending}
              onPress={() => void send()}
              size="sm"
            />
          </View>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bubble: {
    paddingHorizontal: mobile.support.bubblePaddingX,
    paddingVertical: mobile.support.bubblePaddingY,
  },
  flex: { flex: 1 },
  header: {
    borderBottomWidth: 1,
    gap: mobile.support.headerGap,
    paddingBottom: mobile.support.headerPaddingBottom,
    paddingHorizontal: mobile.support.headerPaddingX,
    paddingTop: mobile.support.headerPaddingTop,
  },
  message: { gap: 4, maxWidth: mobile.support.bubbleMaxWidth },
  metaChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: mobile.support.chipGap,
  },
  replyBar: {
    alignItems: 'flex-end',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: mobile.support.replyGap,
    marginTop: 'auto',
    paddingHorizontal: mobile.support.replyPaddingX,
    paddingVertical: mobile.support.replyPaddingY,
  },
  states: { gap: mobile.gapItem, padding: mobile.screenPaddingX },
  thread: {
    gap: mobile.support.threadGap,
    padding: mobile.support.threadPadding,
  },
});
