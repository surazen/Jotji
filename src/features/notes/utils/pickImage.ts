/** Thin wrappers around expo-image-picker returning a normalized result. */
import * as ImagePicker from 'expo-image-picker';

export type PickedImage = {
  uri: string;
  mime: string;
  width: number | null;
  height: number | null;
};

function toPicked(result: ImagePicker.ImagePickerResult): PickedImage | null {
  if (result.canceled || result.assets.length === 0) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    mime: a.mimeType ?? 'image/jpeg',
    width: a.width ?? null,
    height: a.height ?? null,
  };
}

export async function pickFromGallery(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsMultipleSelection: false,
  });
  return toPicked(result);
}

export async function pickFromCamera(): Promise<PickedImage | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ['images'],
    quality: 0.85,
  });
  return toPicked(result);
}
