import React, { useEffect, useState } from 'react';
import { Modal, View, StyleSheet, Text, Pressable, FlatList, ScrollView } from 'react-native';
import type { Place } from '@/lib/places';
import { useNearbyPlaces } from '@/hooks/useNearbyPlaces';
import { useCreateCheckIn } from '@/hooks/useCreateCheckIn';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  center: { latitude: number; longitude: number };
  userId: string;
};

export default function CheckInModal({ visible, onRequestClose, center, userId }: Props) {
  const [step, setStep] = useState<'choose' | 'post'>('choose');
  const { data: places, isLoading, error } = useNearbyPlaces({
    enabled: visible && step === 'choose',
    center,
    radiusMeters: 250,
    includedTypes: ['bar', 'restaurant'],
    limit: 20,
  });
  const createCheckInMutation = useCreateCheckIn();

  // Reset local state when the modal closes
  useEffect(() => {
    if (!visible) {
      setStep('choose');
      createCheckInMutation.reset();
    }
  }, [visible]);

  const handleClose = () => {
    setStep('choose');
    createCheckInMutation.reset();
    onRequestClose();
  };

  const onSelectPlace = (place: Place) => {
    createCheckInMutation.mutate(
      {
        userId,
        location: place.displayName,
        time: Math.floor(Date.now() / 1000),
        users: [],
      },
      {
        onSuccess: () => setStep('post'),
      }
    );
  };

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={styles.backdropTouchable} onPress={handleClose} />
        <Pressable accessibilityLabel="Close check-in" onPress={handleClose} style={styles.floatingClose}>
          <Text style={styles.floatingCloseText}>×</Text>
          {/* <Text style={styles.floatingCloseText}>x</Text> */}
        </Pressable>
        <View style={styles.sheetContainer}>
          <View style={styles.headerRow}>
          </View>
          {step === 'choose' ? (
            <View style={{ flex: 1, minHeight: 0 }}>
              <Text style={styles.sheetTitle}>Nearby places</Text>
              {error ? <Text style={styles.error}>{String(error)}</Text> : null}
              {isLoading ? (
                <Text style={styles.infoText}>Loading…</Text>
              ) : (
                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 24 }}>
                  {(places ?? []).length === 0 ? (
                    <Text style={styles.infoText}>No places found.</Text>
                  ) : null}
                  {(places ?? []).map((item) => (
                    <View key={item.id} style={styles.card}>
                      <View style={{ flex: 1, marginRight: 12 }}>
                        <Text style={styles.cardTitle}>{item.displayName}</Text>
                        {('address' in (item as any) && (item as any).address) ? (
                          <Text style={{ color: '#4a5568', fontSize: 12, marginTop: 2 }} numberOfLines={1}>{(item as any).address}</Text>
                        ) : null}
                      </View>
                      <Pressable style={styles.cardCta} onPress={() => onSelectPlace(item)}>
                        <Text style={styles.cardCtaText}>{createCheckInMutation.status === 'pending' ? 'Working…' : 'Check in'}</Text>
                      </Pressable>
                    </View>
                  ))}
                </ScrollView>
              )}
            </View>
          ) : (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={styles.sheetTitle}>Check-in details</Text>
              <Text style={styles.infoText}>This step is under construction.</Text>
              <Pressable style={[styles.cardCta, { marginTop: 16 }]} onPress={handleClose}>
                <Text style={styles.cardCtaText}>Close</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-start',
    paddingTop: '20%',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject as any,
  },
  sheetContainer: {
    width: '92%',
    height: '50%',
    alignSelf: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderRadius: 16,
    padding: 16,
  },
  headerRow: { display: 'none' },
  floatingClose: {
    position: 'absolute',
    top: '5%',
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
  },
  floatingCloseText: { color: '#fff', fontSize: 34, fontWeight: '800', lineHeight: 34 },
  sheetTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  infoText: { color: '#4a5568', textAlign: 'center' },
  error: { color: '#E53E3E', marginBottom: 8, textAlign: 'center' },
  card: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f7fafc',
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: { fontWeight: '600', flex: 1, marginRight: 12 },
  cardCta: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#5A67D8',
    borderRadius: 8,
  },
  cardCtaText: { color: '#fff', fontWeight: '600' },
});


