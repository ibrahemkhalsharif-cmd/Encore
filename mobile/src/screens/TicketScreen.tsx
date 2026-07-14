import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { shortDate, time } from '../format';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Ticket'>;

export function TicketScreen({ route }: Props) {
  const { ticket } = route.params;
  const used = !!ticket.checked_in_at;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.stub}>
        <Text style={styles.title}>{ticket.title}</Text>
        <Text style={styles.muted}>
          {shortDate(ticket.starts_at)} · {time(ticket.starts_at)}
        </Text>
        <Text style={styles.muted}>
          {ticket.venue}, {ticket.city}
        </Text>

        <View style={styles.tear} />

        <View style={styles.qrWrap}>
          <QRCode
            value={ticket.code}
            size={200}
            color={colors.ink}
            backgroundColor={colors.card}
          />
        </View>
        <Text style={styles.code}>{ticket.code}</Text>
        <Text style={styles.tier}>{ticket.tier}</Text>

        {used ? (
          <Text style={styles.used}>
            Checked in — {new Date(ticket.checked_in_at!).toLocaleString()}
          </Text>
        ) : (
          <Text style={styles.hint}>Show this at the door</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 20,
  },
  stub: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 24,
    color: colors.ink,
    textAlign: 'center',
  },
  muted: {
    color: colors.muted,
    marginTop: 4,
    textAlign: 'center',
  },
  tear: {
    alignSelf: 'stretch',
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.line,
    marginVertical: 20,
  },
  qrWrap: {
    padding: 16,
    backgroundColor: colors.card,
    borderRadius: 12,
  },
  code: {
    marginTop: 12,
    fontSize: 18,
    letterSpacing: 3,
    color: colors.ink,
    fontVariant: ['tabular-nums'],
  },
  tier: {
    marginTop: 4,
    color: colors.muted,
  },
  used: {
    marginTop: 16,
    color: colors.good,
    fontWeight: '600',
  },
  hint: {
    marginTop: 16,
    color: colors.muted,
  },
});
