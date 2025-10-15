import { Stack } from 'expo-router';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { useCreateFollow } from '@/hooks/useCreateFollow';
import { useGetFollowingByFollower } from '@/hooks/useGetFollowing';
import { CURRENT_USER_ID } from '@/constants/currentUser';
import SearchAutocomplete from '@/components/SearchAutocomplete';

export default function SearchScreen() {
  const [q, setQ] = useState('');
  const { data: myFollowing } = useGetFollowingByFollower(CURRENT_USER_ID);
  const followMutation = useCreateFollow();

  const followingSet = new Set((myFollowing ?? []).map((f) => f.userId));
  const onFollow = (userId: string) => {
    if (followingSet.has(userId)) return;
    followMutation.mutate({ userId, followerId: CURRENT_USER_ID });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Search' }} />
      <SearchAutocomplete
        mode="users"
        placeholder="Search by name or username..."
        query={q}
        onQueryChange={setQ}
        renderTrailing={(u) => (
          followingSet.has(u.id) ? (
            <View style={[styles.followBtn, styles.followingBtn]}>
              <Text style={styles.followingText}>Following</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => onFollow(u.id)}
              disabled={followMutation.status === 'pending'}
              style={[styles.followBtn, followMutation.status === 'pending' ? styles.followBtnDisabled : null]}
            >
              <Text style={styles.followText}>{followMutation.status === 'pending' ? '...' : 'Follow'}</Text>
            </Pressable>
          )
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 12,
    padding: 16,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#CBD5E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  helper: { color: '#4a5568' },
  row: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: { fontWeight: '700' },
  username: { color: '#718096' },
  email: { color: '#4a5568' },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#5A67D8',
  },
  followBtnDisabled: { opacity: 0.6 },
  followText: { color: '#fff', fontWeight: '700' },
  followingBtn: {
    backgroundColor: '#EDF2F7',
  },
  followingText: { color: '#2D3748', fontWeight: '700' },
});


