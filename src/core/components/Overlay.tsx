import React, { useEffect, useId, type ReactNode } from 'react';
import { create } from 'zustand';

/**
 * A tiny portal so overlays (bottom sheets, the image viewer) render at the
 * navigation root instead of inside a React Native <Modal>. RN's Modal spawns a
 * separate native window, which on Android repeatedly causes swallowed touches
 * (Pressables inside a ScrollView), keyboard/inset glitches, and z-order bugs.
 * Rendering into a single root-level host — the same approach as ToastHost —
 * sidesteps all of that: overlay content is just normal views drawn on top.
 */

type Layer = { id: string; node: ReactNode };

type OverlayState = {
  layers: Layer[];
  set: (id: string, node: ReactNode) => void;
  remove: (id: string) => void;
};

const useOverlayStore = create<OverlayState>((set) => ({
  layers: [],
  set: (id, node) =>
    set((s) => {
      const idx = s.layers.findIndex((l) => l.id === id);
      if (idx === -1) return { layers: [...s.layers, { id, node }] };
      const layers = s.layers.slice();
      layers[idx] = { id, node };
      return { layers };
    }),
  remove: (id) => set((s) => ({ layers: s.layers.filter((l) => l.id !== id) })),
}));

/** Renders its children into the root SheetHost (drawn above all app content). */
export function Portal({ children }: { children: ReactNode }) {
  const id = useId();

  // Push the latest children on every render so content stays in sync.
  useEffect(() => {
    useOverlayStore.getState().set(id, children);
  });
  // Remove the layer when this Portal unmounts.
  useEffect(() => {
    return () => useOverlayStore.getState().remove(id);
  }, [id]);

  return null;
}

/** Mount once at the navigation root; draws every active portal layer on top. */
export function SheetHost() {
  const layers = useOverlayStore((s) => s.layers);
  return (
    <>
      {layers.map((l) => (
        <React.Fragment key={l.id}>{l.node}</React.Fragment>
      ))}
    </>
  );
}
