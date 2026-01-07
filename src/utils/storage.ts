import { StorageData, UserScript, DEFAULT_STORAGE } from '@/types/userscript';

export async function getStorage(): Promise<StorageData> {
  const data = await chrome.storage.local.get(['scripts', 'enabled']);
  return {
    scripts: data.scripts ?? DEFAULT_STORAGE.scripts,
    enabled: data.enabled ?? DEFAULT_STORAGE.enabled,
  };
}

export async function setStorage(data: Partial<StorageData>): Promise<void> {
  await chrome.storage.local.set(data);
}

export async function getAllScripts(): Promise<UserScript[]> {
  const { scripts } = await getStorage();
  return Object.values(scripts);
}

export async function getScriptsOnly(): Promise<UserScript[]> {
  const all = await getAllScripts();
  return all.filter((s) => s.type !== 'library');
}

export async function getLibraries(): Promise<UserScript[]> {
  const all = await getAllScripts();
  return all.filter((s) => s.type === 'library');
}

export async function getLibraryByName(name: string): Promise<UserScript | null> {
  const libraries = await getLibraries();
  return libraries.find((lib) => lib.name === name) ?? null;
}

export async function getScript(id: string): Promise<UserScript | null> {
  const { scripts } = await getStorage();
  return scripts[id] ?? null;
}

export async function saveScript(script: UserScript): Promise<void> {
  const { scripts } = await getStorage();
  scripts[script.id] = script;
  await setStorage({ scripts });
}

export async function deleteScript(id: string): Promise<void> {
  const { scripts } = await getStorage();
  delete scripts[id];
  await setStorage({ scripts });
}

export async function isExtensionEnabled(): Promise<boolean> {
  const { enabled } = await getStorage();
  return enabled;
}

export async function setExtensionEnabled(enabled: boolean): Promise<void> {
  await setStorage({ enabled });
}

export function generateId(): string {
  return crypto.randomUUID();
}
