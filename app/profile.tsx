import { Stack } from 'expo-router';
import { StyleSheet, View, Text, Image } from 'react-native';

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Profile' }} />
      <Image
        source={{ uri: 'https://placehold.co/120x120/png' }}
        style={styles.avatar}
      />
      <Text style={styles.name}>Your Name</Text>
      <View style={styles.comingSoonBadge}>
        <Text style={styles.comingSoonText}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
  },
  comingSoonBadge: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#edf2f7',
  },
  comingSoonText: {
    color: '#4a5568',
    fontWeight: '500',
  },
});


