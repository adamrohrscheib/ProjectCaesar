import { Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function FeedScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Feed' }} />
      <Ionicons name="newspaper-outline" size={48} color="#718096" />
      <Text style={styles.title}>Your friends' check-ins will appear here.</Text>
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
  title: {
    fontSize: 16,
    color: '#4a5568',
    textAlign: 'center',
  },
});


