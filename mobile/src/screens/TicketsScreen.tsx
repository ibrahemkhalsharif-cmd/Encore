import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { api, type Ticket } from '../api';
import { shortDate, time } from '../format';
import { colors } from '../theme';
import type { RootStackParamList } from '../navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Tickets'>;

export function TicketsScreen({ navigation }: Props) {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await api.get<{ tickets: Ticket[] }>('/api/tickets/mine');
      setTickets(data.tickets);
    } catch {
      setTickets([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const refresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (tickets === null) {
    return (
      <View style={styles.center}>
        <Text style={styles.mutedText}>Loading your tickets…</Text>
      </View>
    );
  }

  if (tickets.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No tickets yet</Text>
        <Text style={styles.mutedText}>
          Book something on the Encore website and it'll show up here.
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={tickets}
      keyExtractor={(t) => String(t.id)}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={refresh} />
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
          onPress={() => navigation.navigate('Ticket', { ticket: item })}
        >
          <View style={styles.cardTop}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {item.checked_in_at ? (
              <Text style={styles.usedBadge}>used</Text>
            ) : null}
          </View>
          <Text style={styles.mutedText}>
            {shortDate(item.starts_at)} · {time(item.starts_at)} — {item.venue},{' '}
            {item.city}
          </Text>
          <View style={styles.cardBottom}>
            <Text style={styles.tier}>{item.tier}</Text>
            <Text style={styles.code}>{item.code}</Text>
          </View>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    backgroundColor: colors.bg,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 22,
    color: colors.ink,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  cardPressed: {
    opacity: 0.8,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Fraunces_600SemiBold',
    fontSize: 18,
    color: colors.ink,
    flexShrink: 1,
  },
  usedBadge: {
    color: colors.muted,
    borderColor: colors.line,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 2,
    fontSize: 12,
    overflow: 'hidden',
  },
  mutedText: {
    color: colors.muted,
    marginTop: 4,
    textAlign: 'left',
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  tier: {
    color: colors.ink,
    fontWeight: '600',
  },
  code: {
    color: colors.muted,
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
});
