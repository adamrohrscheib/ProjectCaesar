import { Stack } from 'expo-router';
import { StyleSheet, View, Text, Image, FlatList } from 'react-native';
import { CURRENT_USER_ID } from '@/constants/currentUser';
import { useGetUser } from '@/hooks/useGetUser';
import { useGetCheckIns } from '@/hooks/useGetCheckIns';
import { useGetFollowing, useGetFollowingByFollower } from '@/hooks/useGetFollowing';

export default function ProfileScreen() {
  const userId = CURRENT_USER_ID;
  const { data: user, isLoading: userLoading } = useGetUser(userId);
  const { data: followers } = useGetFollowing(userId); // who follows me
  const { data: following } = useGetFollowingByFollower(userId); // whom I follow
  const { data: checkIns, isLoading: checkInsLoading } = useGetCheckIns(userId);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Account' }} />
      <Image
        source={{ uri: 'https://placehold.co/120x120/png' }}
        style={styles.avatar}
      />
      <Text style={styles.name}>{userLoading ? 'Loading…' : user?.name ?? 'Unknown'}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.phone}>{user?.phone}</Text>

      <View style={styles.countersRow}>
        <View style={styles.counterBox}>
          <Text style={styles.counterNumber}>{followers?.length ?? 0}</Text>
          <Text style={styles.counterLabel}>Followers</Text>
        </View>
        <View style={styles.counterBox}>
          <Text style={styles.counterNumber}>{following?.length ?? 0}</Text>
          <Text style={styles.counterLabel}>Following</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Previous Check-ins</Text>
      </View>

      <FlatList
        style={styles.list}
        data={checkIns ?? []}
        keyExtractor={(item, idx) => `${item.userId}-${item.time}-${idx}`}
        ListEmptyComponent={
          checkInsLoading ? (
            <Text style={styles.rowMeta}>Loading…</Text>
          ) : (
            <Text style={styles.rowMeta}>No check-ins yet.</Text>
          )
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.rowLocation}>{item.location}</Text>
            <Text style={styles.rowMeta}>{new Date(item.time * 1000).toLocaleString()}</Text>
            <Text style={styles.rowMeta}>With {item.users.length}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    padding: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
  email: { textAlign: 'center', color: '#4a5568' },
  phone: { textAlign: 'center', color: '#4a5568' },
  countersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
  },
  counterBox: { alignItems: 'center' },
  counterNumber: { fontSize: 18, fontWeight: '700' },
  counterLabel: { color: '#4a5568' },
  sectionHeader: { marginTop: 16 },
  sectionTitle: { fontWeight: '700' },
  list: { marginTop: 8 },
  row: {
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  rowLocation: { fontWeight: '600' },
  rowMeta: { color: '#4a5568' },
});


