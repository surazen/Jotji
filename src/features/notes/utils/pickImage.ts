/** Pickers for note attachments: images (gallery/camera) and documents. */
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

import { runProtected } from '@core/security/appLockController';
import { DOCUMENT_PICKER_TYPES } from '@core/utils/files';

export type PickedMedia = {
  uri: string;
  mime: string;
  width: number | null;
  height: number | null;
};

function toPicked(result: ImagePicker.ImagePickerResult): PickedMedia | null {
  if (result.canceled || result.assets.length === 0) return null;
  const a = result.assets[0];
  return {
    uri: a.uri,
    mime: a.mimeType ?? 'image/jpeg',
    width: a.width ?? null,
    height: a.height ?? null,
  };
}

/** Gallery picker for images (PNG/JPG). */
export async function pickFromGallery(): Promise<PickedMedia | null> {
  return runProtected(async () =>
    toPicked(
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsMultipleSelection: false,
      }),
    ),
  );
}

export async function pickFromCamera(): Promise<PickedMedia | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  return runProtected(async () =>
    toPicked(await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.85 })),
  );
}

/** Document picker for PDF / XLS / DOC files. */
export async function pickDocumentFile(): Promise<PickedMedia | null> {
  return runProtected(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: DOCUMENT_PICKER_TYPES,
      copyToCacheDirectory: true,
      multiple: false,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return null;
    const a = result.assets[0];
    return {
      uri: a.uri,
      mime: a.mimeType ?? 'application/octet-stream',
      width: null,
      height: null,
    };
  });
}
