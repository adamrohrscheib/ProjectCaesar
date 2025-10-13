import { Stack } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';

export default function SearchScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Search' }} />
      <Text style={styles.title}>Search is under construction.</Text>
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


