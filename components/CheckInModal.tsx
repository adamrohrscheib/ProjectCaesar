import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, StyleSheet, Text, Pressable, ScrollView, TextInput, Animated } from 'react-native';
import type { Place } from '@/lib/places';
import { useNearbyPlaces } from '@/hooks/useNearbyPlaces';
import { useCreateCheckIn } from '@/hooks/useCreateCheckIn';
import { useUpdateCheckIn } from '@/hooks/useUpdateCheckIn';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import type { User } from '@/app/interfaces';

type Props = {
  visible: boolean;
  onRequestClose: () => void;
  center: { latitude: number; longitude: number };
  userId: string;
};

export default function CheckInModal({ visible, onRequestClose, center, userId }: Props) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [createdTime, setCreatedTime] = useState<number | null>(null);
  const [checkInSucceeded, setCheckInSucceeded] = useState(false);
  const [companions, setCompanions] = useState<string[]>([]);
  const [companionUsernames, setCompanionUsernames] = useState<Record<string, string | undefined>>({});
  const [lineMinutes, setLineMinutes] = useState<number | undefined>(undefined);
  const [notes, setNotes] = useState('');
  const [friendQuery, setFriendQuery] = useState('');
  const [listContainerHeight, setListContainerHeight] = useState(0);
  const [listContentHeight, setListContentHeight] = useState(0);
  const [hideOthers, setHideOthers] = useState(false);

  const { data: places, isLoading, error } = useNearbyPlaces({
    enabled: visible,
    center,
    radiusMeters: 75,
    includedTypes: ['restaurant', 'bar'],
    limit: 25,
  });
  const createCheckInMutation = useCreateCheckIn();
  const updateCheckInMutation = useUpdateCheckIn();

  // Animations
  const othersOpacity = React.useRef(new Animated.Value(1)).current;
  const selectedSlideY = React.useRef(new Animated.Value(0)).current;
  const detailsOpacity = React.useRef(new Animated.Value(0)).current;
  const backdropExtra = React.useRef(new Animated.Value(0)).current; // 0..1 additional darkness

  // Initialize local state and opening animations when the modal becomes visible
  useEffect(() => {
    if (visible) {
      setSelectedPlaceId(null);
      setCreatedTime(null);
      setCheckInSucceeded(false);
      setCompanions([]);
      setLineMinutes(undefined);
      setNotes('');
      setFriendQuery('');
      setHideOthers(false);
      createCheckInMutation.reset();
      updateCheckInMutation.reset();
      othersOpacity.setValue(1);
      selectedSlideY.setValue(0);
      detailsOpacity.setValue(0);
      backdropExtra.setValue(0);
      // Fade in additional backdrop darkness when modal opens from bottom menu
      Animated.timing(backdropExtra, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handleClose = () => {
    onRequestClose();
  };

  const onSelectPlace = (place: Place) => {
    if (createCheckInMutation.status === 'pending') return;
    const now = Math.floor(Date.now() / 1000);
    setSelectedPlaceId(place.id);
    setCreatedTime(now);
    setCheckInSucceeded(false);
    // Animate UI transitions
    setHideOthers(false);
    Animated.parallel([
      Animated.timing(othersOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(selectedSlideY, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => {
      Animated.timing(detailsOpacity, { toValue: 1, duration: 250, useNativeDriver: true }).start(() => setHideOthers(true));
    });
    createCheckInMutation.mutate(
      {
        userId,
        location: place.displayName,
        time: now,
        users: [],
      },
      {
        onSuccess: () => setCheckInSucceeded(true),
        onError: () => setCheckInSucceeded(false),
      }
    );
  };

  const onToggleCompanion = (user: User | string) => {
    const id = typeof user === 'string' ? user : user.id;
    const username = typeof user === 'string' ? undefined : user.username;
    setCompanions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    if (username !== undefined) {
      setCompanionUsernames((prev) => ({ ...prev, [id]: username }));
    }
  };

  const onSaveDetails = () => {
    if (!createdTime) {
      handleClose();
      return;
    }
    updateCheckInMutation.mutate(
      {
        userId,
        time: createdTime,
        users: companions,
        lineMinutes,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => handleClose(),
      }
    );
  };

  const sortedPlaces = useMemo(() => {
    if (!places || !center) return places ?? [];
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dist = (aLat: number, aLng: number, bLat: number, bLng: number) => {
      const R = 6371000; // meters
      const dLat = toRad(bLat - aLat);
      const dLng = toRad(bLng - aLng);
      const lat1 = toRad(aLat);
      const lat2 = toRad(bLat);
      const sinDLat = Math.sin(dLat / 2);
      const sinDLng = Math.sin(dLng / 2);
      const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
      return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
    };
    const byDistance = [...places].sort((p1, p2) => {
      const d1 = p1.location ? dist(center.latitude, center.longitude, p1.location.latitude, p1.location.longitude) : Number.POSITIVE_INFINITY;
      const d2 = p2.location ? dist(center.latitude, center.longitude, p2.location.latitude, p2.location.longitude) : Number.POSITIVE_INFINITY;
      return d1 - d2;
    });
    if (!selectedPlaceId) return byDistance;
    const selected = byDistance.find((p) => p.id === selectedPlaceId);
    const rest = byDistance.filter((p) => p.id !== selectedPlaceId);
    return selected ? [selected, ...rest] : byDistance;
  }, [places, center, selectedPlaceId]);

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={handleClose}>
      <View style={styles.modalBackdrop}>
        <Animated.View pointerEvents="none" style={[styles.backdropDarkener, { opacity: backdropExtra.interpolate({ inputRange: [0, 1], outputRange: [0, 0.2] }) }]} />
        <Pressable style={styles.backdropTouchable} onPress={handleClose} />
        <Pressable accessibilityLabel="Close check-in" onPress={handleClose} style={styles.floatingClose}>
          <Text style={styles.floatingCloseText}>×</Text>
          {/* <Text style={styles.floatingCloseText}>x</Text> */}
        </Pressable>
        <View style={styles.sheetContainer}>
          <View style={styles.headerRow}>
          </View>
          <View style={{ flex: 1, minHeight: 0 }}>
            {!selectedPlaceId ? <Text style={styles.sheetTitle}>Nearby places</Text> : null}
            {error ? <Text style={styles.error}>{String(error)}</Text> : null}
            {isLoading ? (
              <Text style={styles.infoText}>Loading…</Text>
            ) : (
              <View style={{ flex: 1 }} onLayout={(e) => setListContainerHeight(e.nativeEvent.layout.height)}>
                <ScrollView
                  style={{ flex: 1 }}
                  contentContainerStyle={{ paddingBottom: 24 }}
                  onContentSizeChange={(_w, h) => setListContentHeight(h)}
                  scrollEnabled={listContentHeight > listContainerHeight + 4}
                  showsVerticalScrollIndicator={listContentHeight > listContainerHeight + 4}
                >
                  {(sortedPlaces ?? []).length === 0 ? (
                    <Text style={styles.infoText}>No places found.</Text>
                  ) : null}
                  {(sortedPlaces ?? []).map((item) => {
                    const isSelected = selectedPlaceId === item.id;
                    const nonSelectedFading = selectedPlaceId && !isSelected;
                  if (selectedPlaceId && hideOthers && !isSelected) return null;
                  return (
                    <View key={item.id}>
                      <Animated.View style={[
                        styles.card,
                        isSelected ? { transform: [{ translateY: selectedSlideY }] } : null,
                        nonSelectedFading ? { opacity: hideOthers ? 0 : othersOpacity } : null,
                      ]}>
                          <View style={{ flex: 1, marginRight: 12 }}>
                              <Text style={styles.cardTitle}>{item.displayName}</Text>
                              {('address' in (item as any) && (item as any).address) ? (
                              <Text style={{ color: '#4a5568', fontSize: 12, marginTop: 2 }} numberOfLines={1}>{(item as any).address}</Text>
                              ) : null}
                              {/* Success text removed in favor of button state */}
                          </View>
                          {isSelected && checkInSucceeded ? (
                            <View style={[styles.cardCta, styles.cardCtaChecked]}>
                              <Text style={styles.cardCtaText}>Checked in</Text>
                            </View>
                          ) : (
                            <Pressable
                                style={[styles.cardCta, createCheckInMutation.status === 'pending' || !!selectedPlaceId ? styles.cardCtaDisabled : null]}
                                onPress={() => onSelectPlace(item)}
                                disabled={createCheckInMutation.status === 'pending' || !!selectedPlaceId}
                            >
                                <Text style={styles.cardCtaText}>Check in</Text>
                            </Pressable>
                          )}
                      </Animated.View>

                      {isSelected ? (
                        <Animated.View style={[styles.detailsContainer, { opacity: detailsOpacity }] }>
                          <Text style={styles.encouragingText}>Tell us more about your night!</Text>
                          <Text style={styles.fieldLabel}>Who did you go with?</Text>
                          <SearchAutocomplete
                            mode="friends"
                            placeholder="Search friends by name or username"
                            query={friendQuery}
                            onQueryChange={setFriendQuery}
                            selectedIds={companions}
                            onToggleSelect={(u) => onToggleCompanion(u)}
                          />

                          {companions.length > 0 ? (
                            <View style={styles.chipsRow}>
                              {companions.map((id) => (
                                <View key={id} style={[styles.chip, styles.chipSelected, { flexDirection: 'row', alignItems: 'center' }]}> 
                                  <Pressable onPress={() => onToggleCompanion(id)}>
                                    <Text style={[styles.chipText, { marginRight: 6 }]}>X</Text>
                                  </Pressable>
                                  <Text style={styles.chipText}>{`@${companionUsernames[id] ?? id}`}</Text>
                                </View>
                              ))}
                            </View>
                          ) : null}

                          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>How was the line? (minutes)</Text>
                          <View style={styles.bubblesRow}>
                            {[{ label: 'No line', value: 0 }, { label: '5', value: 5 }, { label: '15', value: 15 }, { label: '30', value: 30 }, { label: '1hr+', value: 60 }].map((opt) => (
                              <Pressable
                                key={String(opt.value)}
                                style={[styles.bubble, lineMinutes === opt.value ? styles.bubbleSelected : null]}
                                onPress={() => setLineMinutes(opt.value)}
                              >
                                <Text style={[styles.bubbleText, lineMinutes === opt.value ? styles.bubbleTextSelected : null]}>{opt.label}</Text>
                              </Pressable>
                            ))}
                          </View>

                          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Notes</Text>
                          <TextInput
                            style={[styles.input, { height: 80 }]}
                            placeholder="Notes..."
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                          />

                          <Pressable
                            style={[styles.saveBtn, (updateCheckInMutation.status === 'pending') ? styles.saveBtnDisabled : null]}
                            onPress={onSaveDetails}
                            disabled={updateCheckInMutation.status === 'pending'}
                          >
                            <Text style={styles.saveBtnText}>{updateCheckInMutation.status === 'pending' ? 'Saving…' : 'Save check in'}</Text>
                          </Pressable>
                        </Animated.View>
                      ) : null}
                    </View>
                  );})}
                </ScrollView>
              </View>
            )}
          </View>
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
  backdropDarkener: {
    ...StyleSheet.absoluteFillObject as any,
    backgroundColor: '#000',
  },
  sheetContainer: {
    width: '92%',
    height: '72%',
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
  cardCtaDisabled: { opacity: 0.6 },
  cardTitle: { fontWeight: '600', flex: 1, marginRight: 12 },
  cardCta: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#5A67D8',
    borderRadius: 8,
  },
  cardCtaChecked: { backgroundColor: '#48BB78' },
  cardCtaText: { color: '#fff', fontWeight: '600' },
  successText: { color: '#38A169', fontSize: 12, marginTop: 6 },
  detailsContainer: { backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 4 },
  encouragingText: { color: '#2D3748', marginBottom: 8, fontWeight: '600' },
  detailsHeader: { fontWeight: '700', marginBottom: 8 },
  fieldLabel: { fontWeight: '600', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9999, backgroundColor: '#EDF2F7' },
  pillSelected: { backgroundColor: '#C6F6D5' },
  pillText: { color: '#2D3748', fontWeight: '600' },
  pillTextSelected: { color: '#22543D' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: { backgroundColor: '#EDF2F7', borderRadius: 9999, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  chipSelected: { backgroundColor: '#E9D8FD' },
  chipText: { color: '#4A5568', fontWeight: '600' },
  bubblesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  bubble: { borderWidth: 1, borderColor: '#CBD5E0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9999, marginRight: 8, marginBottom: 8 },
  bubbleSelected: { backgroundColor: '#5A67D8', borderColor: '#5A67D8' },
  bubbleText: { color: '#2D3748', fontWeight: '600' },
  bubbleTextSelected: { color: '#fff' },
  saveBtn: { marginTop: 16, paddingVertical: 12, borderRadius: 10, backgroundColor: '#2D3748', alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontWeight: '700' },
});


