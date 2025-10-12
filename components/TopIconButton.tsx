import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TopIconButtonProps = {
  iconName: keyof typeof Ionicons.glyphMap;
  accessibilityLabel: string;
  onPress: () => void;
  style?: ViewStyle;
};

export default function TopIconButton({ iconName, accessibilityLabel, onPress, style }: TopIconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => [styles.button, style, pressed && styles.pressed]}
      hitSlop={8}
    >
      <Ionicons name={iconName} size={22} color="#111" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  pressed: {
    opacity: 0.85,
  },
});


