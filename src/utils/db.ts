import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ModelMedDB extends DBSchema {
  userProgress: {
    key: string;
    value: any;
  };
  modelResults: {
    key: string;
    value: any;
  };
  assessmentResults: {
    key: string;
    value: any;
  };
}

const DB_NAME = 'modelmed-db';
const DB_VERSION = 1;

let dbInstance: IDBPDatabase<ModelMedDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<ModelMedDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ModelMedDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('userProgress')) {
        db.createObjectStore('userProgress');
      }
      if (!db.objectStoreNames.contains('modelResults')) {
        db.createObjectStore('modelResults');
      }
      if (!db.objectStoreNames.contains('assessmentResults')) {
        db.createObjectStore('assessmentResults');
      }
    },
  });

  return dbInstance;
}

type StoreNames = 'userProgress' | 'modelResults' | 'assessmentResults';

export async function saveToIndexedDB(storeName: StoreNames, key: string, value: any) {
  const db = await getDB();
  await db.put(storeName, value, key);
}

export async function getFromIndexedDB(storeName: StoreNames, key: string) {
  const db = await getDB();
  return await db.get(storeName, key);
}

export async function deleteFromIndexedDB(storeName: StoreNames, key: string) {
  const db = await getDB();
  await db.delete(storeName, key);
}

export async function clearStore(storeName: StoreNames) {
  const db = await getDB();
  await db.clear(storeName);
}
