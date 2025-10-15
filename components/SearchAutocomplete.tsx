import React, { useEffect, useMemo, useState } from 'react';
import { View, TextInput, StyleSheet, Text, Pressable } from 'react-native';
import { useSearchUsers } from '@/hooks/useSearchUsers';
import { useGetFollowingByFollower } from '@/hooks/useGetFollowing';
import { CURRENT_USER_ID } from '@/constants/currentUser';
import type { User } from '@/app/interfaces';

export type SearchMode = 'users' | 'friends' | 'locations';

type Props = {
  mode: SearchMode;
  placeholder?: string;
  query: string;
  onQueryChange: (q: string) => void;
  // Default trailing is Add/Added toggle; override with custom trailing if needed
  selectedIds?: string[];
  onToggleSelect?: (user: User) => void;
  renderTrailing?: (user: User, isSelected: boolean) => React.ReactNode;
};

export default function SearchAutocomplete({
  mode,
  placeholder = 'Search…',
  query,
  onQueryChange,
  selectedIds = [],
  onToggleSelect,
  renderTrailing,
}: Props) {
  const [debouncedQ, setDebouncedQ] = useState(query);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const { data: allUsers = [] } = useSearchUsers(debouncedQ);
  const { data: myFollowing = [] } = useGetFollowingByFollower(CURRENT_USER_ID);

  const results = useMemo(() => {
    if (mode === 'friends') {
      const followingSet = new Set((myFollowing ?? []).map((f) => f.userId));
      return (allUsers ?? []).filter((u) => followingSet.has(u.id));
    }
    if (mode === 'users') return allUsers ?? [];
    // 'locations' is not implemented yet here
    return [];
  }, [mode, allUsers, myFollowing]);

  return (
    <View style={{ marginTop: 8 }}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        value={query}
        onChangeText={onQueryChange}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {query.trim().length >= 2 ? (
        <View style={{ marginTop: 8 }}>
          {results.slice(0, 8).map((u) => {
            const isSelected = selectedIds.includes(u.id);
            return (
              <View key={u.id} style={styles.resultRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name}>{u.name}</Text>
                  {u.username ? <Text style={styles.username}>@{u.username}</Text> : null}
                </View>
                {renderTrailing ? (
                  renderTrailing(u, isSelected)
                ) : onToggleSelect ? (
                  <Pressable onPress={() => onToggleSelect(u)} style={[styles.pill, isSelected ? styles.pillSelected : null]}>
                    <Text style={[styles.pillText, isSelected ? styles.pillTextSelected : null]}>{isSelected ? 'Added' : 'Add'}</Text>
                  </Pressable>
                ) : null}
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  name: { fontWeight: '600', color: '#1A202C' },
  username: { color: '#718096', marginTop: 2, fontSize: 12 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999, backgroundColor: '#EDF2F7' },
  pillSelected: { backgroundColor: '#C6F6D5' },
  pillText: { color: '#2D3748', fontWeight: '600' },
  pillTextSelected: { color: '#22543D' },
});


