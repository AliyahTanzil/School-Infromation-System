import { useState } from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, radii, spacing } from '../../constants/theme';
import { uploadProfileImage } from '../../services/uploads';

export function ProfileImagePicker({ userId, currentImageUrl, onUploaded }: { userId: string; currentImageUrl?: string | null; onUploaded?: (url: string) => void }) {
  const [uri, setUri] = useState(currentImageUrl ?? '');
  const [busy, setBusy] = useState(false);
  async function chooseImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permission required', 'Allow photo access to choose a profile image.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setBusy(true);
    try { const response = await uploadProfileImage(userId, { uri: asset.uri, name: asset.fileName ?? `profile-${Date.now()}.jpg`, type: asset.mimeType ?? 'image/jpeg' }); setUri(response.imageUrl); onUploaded?.(response.imageUrl); }
    catch (error) { Alert.alert('Upload failed', error instanceof Error ? error.message : 'Unable to upload image.'); }
    finally { setBusy(false); }
  }
  return <View style={styles.container}><Pressable accessibilityRole="button" accessibilityLabel="Choose profile image" onPress={chooseImage} disabled={busy} style={styles.avatar}>{uri ? <Image source={{ uri }} accessibilityLabel="Profile image" style={styles.image} /> : <Text style={styles.initial}>+</Text>}</Pressable><Text style={styles.label}>{busy ? 'Uploading…' : uri ? 'Change profile image' : 'Add profile image'}</Text></View>;
}
const styles = StyleSheet.create({ container: { alignItems: 'center', gap: spacing.sm }, avatar: { alignItems: 'center', backgroundColor: colors.white, borderColor: colors.line, borderRadius: radii.lg, borderWidth: 1, height: 96, justifyContent: 'center', overflow: 'hidden', width: 96 }, image: { height: '100%', width: '100%' }, initial: { color: colors.blue, fontSize: 32, fontWeight: '800' }, label: { color: colors.muted, fontSize: 14, fontWeight: '700' } });
