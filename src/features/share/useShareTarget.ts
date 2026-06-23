import { useEffect, useRef } from 'react';
import { useShareIntentContext } from 'expo-share-intent';

import { toast } from '@core/components/Toast';
import { navigationRef } from '@navigation/navigationRef';

import { createNoteFromShare } from './createNoteFromShare';

/**
 * Handle content shared into Jotji via the Android share sheet: build a note
 * from it and open that note in the editor. `enabled` gates processing until the
 * database is open (bootstrap) and the navigator is ready, so we never navigate
 * or write before the app can handle it.
 */
export function useShareTarget(enabled: boolean): void {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  // Guards against re-entry while the async create/navigate is in flight.
  const processing = useRef(false);

  useEffect(() => {
    if (!enabled || !hasShareIntent || processing.current) return;
    processing.current = true;
    (async () => {
      try {
        const noteId = await createNoteFromShare(shareIntent);
        if (noteId) {
          if (navigationRef.isReady()) navigationRef.navigate('NoteEditor', { noteId });
        } else {
          // Nothing usable: distinguish an unsupported file from an empty share.
          const hadFiles = (shareIntent.files?.length ?? 0) > 0;
          toast.error(
            hadFiles
              ? 'That file type isn’t supported. Jotji accepts JPEG/PNG images and PDF, Word, or Excel files.'
              : 'There was nothing to save from that share.',
          );
        }
      } catch {
        toast.error('Could not import the shared content');
      } finally {
        resetShareIntent();
        processing.current = false;
      }
    })();
  }, [enabled, hasShareIntent, shareIntent, resetShareIntent]);
}
