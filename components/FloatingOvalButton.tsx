import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type FloatingOvalButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
};

export default function FloatingOvalButton({ label, onPress, disabled }: FloatingOvalButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && !disabled ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    minWidth: 220,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: '#5A67D8',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  label: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pressed: {
    backgroundColor: '#4C51BF',
  },
  disabled: {
    opacity: 0.5,
  },
});


