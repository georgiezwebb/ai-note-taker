export type CollectionDTO = {
  id: string;
  name: string;
  noteIds: string[];
  noteCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CollectionsListDTO = {
  collections: CollectionDTO[];
  suggestedCollectionName: string;
};
