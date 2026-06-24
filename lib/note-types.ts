export type NoteDTO = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  collectionIds: string[];
  createdAt: string;
  updatedAt: string;
};
