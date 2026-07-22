import type { NavigatorScreenParams } from '@react-navigation/native';

export type AppTabParamList = {
  Home: undefined;
  /** Action tab — intercepted to launch the document scanner. */
  Scan: undefined;
  /** Center action tab — intercepted to open the editor. */
  New: undefined;
  Notebooks: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList> | undefined;
  /** Full-text / tag search — pushed from the Home top-bar search icon. */
  Search: undefined;
  /** Device-local library of standalone scans — pushed from the top-bar icon. */
  ScannedFiles: undefined;
  /** noteId omitted = create a new note (optionally inside notebookId). */
  NoteEditor: { noteId?: string; notebookId?: string } | undefined;
  /** notebookId null = the virtual "General" bucket (unfiled notes). */
  NotebookDetail: { notebookId: string | null; name: string };
  Settings: undefined;
  Support: undefined;
  /** Static Help / FAQ (Profile → Help & FAQ). */
  Faq: undefined;
  /** First-launch walkthrough. `fromProfile` = replayed from Profile (goes back, not into Tabs). */
  Onboarding: { fromProfile?: boolean } | undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
