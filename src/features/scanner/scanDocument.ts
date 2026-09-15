/**
 * Document-scanner adapter — the ONLY module that knows which scanning library
 * is in use. Everything downstream (editor Scan button, sandbox, attachments)
 * consumes the lib-agnostic {@link ScanResult} contract, so swapping scanners
 * is a rewrite of this file's internals only.
 *
 * CURRENT IMPL (interim): @dariyd/react-native-document-scanner (Google ML Kit
 * on Android; supports RN 0.85 + new arch) → JPEG pages → react-native-images-to-pdf
 * → a single multi-page PDF in the cache dir.
 *
 * PLANNED SWAP → @infinitered/react-native-mlkit-document-scanner v6 (Expo SDK 56
 * / RN 0.85). When v6 ships on npm, replace the body of `scanDocument()` with a
 * single `launchDocumentScannerAsync({ resultFormats: [PDF] })` call that returns
 * the PDF uri directly, drop the images-to-pdf step, and remove both deps below.
 * The exported signature MUST stay identical so no caller changes.
 *
 * Native config this impl relies on (remove when swapping to v6):
 *   - @dariyd/react-native-document-scanner  (autolinked; needs CAMERA permission)
 *   - react-native-images-to-pdf             (autolinked)
 *   - app.json android.permissions: "android.permission.CAMERA"
 *
 * NOTE: native module → requires a fresh dev/preview build to run; cannot
 * hot-reload. v5 of the infinitered lib is NOT usable here (SDK 54 / RN 0.81).
 */
import { File, Paths } from 'expo-file-system';
import { launchScanner } from '@dariyd/react-native-document-scanner';
import { createPdf } from 'react-native-images-to-pdf';

import { runProtected } from '@core/security/appLockController';
import { newId } from '@core/utils/ids';

/**
 * Lib-agnostic result: a single multi-page PDF in the app cache, plus the raw
 * JPEG page images the scanner produced (one per page, in the cache). The PDF is
 * the primary artifact everything downstream consumes; `pageImages` lets the
 * post-scan flow offer "save as JPG" without re-rendering the PDF. The images are
 * cache-lived — only reliable in the moment right after a scan.
 */
export type ScanResult = { pdfUri: string; mime: 'application/pdf'; pageImages: string[] };

/**
 * Launch the OS document scanner and return one multi-page PDF, or `null` if
 * the user cancelled or produced no pages. Wrapped in `runProtected` so the
 * biometric app-lock gate behaves like the image/file pickers.
 *
 * @throws if the scanner reports an error or the PDF cannot be built.
 */
export async function scanDocument(): Promise<ScanResult | null> {
  return runProtected(async () => {
    const result = await launchScanner({ quality: 0.8 });
    if (result.didCancel) return null;
    if (result.error) throw new Error(result.errorMessage ?? 'Document scan failed');

    const pages = (result.images ?? []).filter((img) => !!img.uri);
    if (pages.length === 0) return null;

    const out = new File(Paths.cache, `scan-${newId()}.pdf`);
    await createPdf({
      outputPath: out.uri,
      pages: pages.map((img) => ({ imagePath: img.uri, imageFit: 'contain' as const })),
    });

    // NB: createPdf resolves with a scheme-stripped path (Uri.getPath()); the rest
    // of the pipeline (expo-file-system File) needs a file:// URI, so return the
    // URI of the file we created rather than createPdf's return value.
    return {
      pdfUri: out.uri,
      mime: 'application/pdf',
      pageImages: pages.map((img) => img.uri),
    };
  });
}
