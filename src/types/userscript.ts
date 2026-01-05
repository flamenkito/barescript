export interface UserScript {
  id: string;
  name: string;
  enabled: boolean;
  matches: string[];
  runAt: 'document-start' | 'document-end';
  code: string;
  updatedAt: number;
}

export interface StorageData {
  scripts: Record<string, UserScript>;
  enabled: boolean;
}

export const DEFAULT_STORAGE: StorageData = {
  scripts: {},
  enabled: true,
};
