import type { NavigatorScreenParams } from '@react-navigation/native';

export type AppTabParamList = {
  Home: undefined;
  Search: undefined;
  /** Center action tab — intercepted to open the editor. */
  New: undefined;
  /** Action tab — intercepted to launch the document scanner. */
  Scan: undefined;
  Notebooks: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Tabs: NavigatorScreenParams<AppTabParamList> | undefined;
  /** noteId omitted = create a new note (optionally inside notebookId). */
  NoteEditor: { noteId?: string; notebookId?: string } | undefined;
  /** notebookId null = the virtual "General" bucket (unfiled notes). */
  NotebookDetail: { notebookId: string | null; name: string };
  Settings: undefined;
  Support: undefined;
};

declare global {
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
