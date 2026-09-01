import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { JournalEntry } from "../types";

/**
 * Strict Undefined-Stripping (Zero-Crash Payload Hygiene)
 * Recursively removes all keys with undefined values before saving to Firestore.
 */
export function sanitizePayload<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_key, value) => (value === undefined ? null : value))
  );
}

/**
 * Helper to calculate approximate word count from messages
 */
export function calculateWordCount(entry: Partial<JournalEntry>): number {
  if (!entry.messages || entry.messages.length === 0) return 0;
  return entry.messages.reduce((total, msg) => {
    const words = (msg.content || "").trim().split(/\s+/).filter(Boolean).length;
    return total + words;
  }, 0);
}

/**
 * Saves or updates a journal entry in Firestore under the isolated user collection:
 * `/users/${userId}/entries/${entryId}`
 */
export async function saveJournalEntry(
  userId: string,
  entry: Partial<JournalEntry>
): Promise<string> {
  if (!userId) {
    throw new Error("User ID is required to persist journal entries.");
  }

  const entriesRef = collection(db, "users", userId, "entries");
  const entryId = entry.id || doc(entriesRef).id;
  const docRef = doc(db, "users", userId, "entries", entryId);

  const now = Date.now();
  const wordCount = calculateWordCount(entry);

  const payload: Partial<JournalEntry> & { serverUpdatedAt?: any } = {
    id: entryId,
    userId,
    title: entry.title || "Untitled Reflection",
    category: entry.category || "reflection",
    initialPrompt: entry.initialPrompt || "",
    messages: entry.messages || [],
    summary: entry.summary || "",
    keyInsights: entry.keyInsights || [],
    actionItems: entry.actionItems || [],
    sentimentTag: entry.sentimentTag || "Reflective",
    tags: entry.tags || [],
    createdAt: entry.createdAt || now,
    updatedAt: now,
    isFavorite: Boolean(entry.isFavorite),
    wordCount,
  };

  const cleanData = sanitizePayload(payload);

  try {
    await setDoc(docRef, {
      ...cleanData,
      serverUpdatedAt: serverTimestamp(),
    }, { merge: true });

    return entryId;
  } catch (error: any) {
    console.error("[Firestore Error] Failed to save journal entry:", error);
    throw new Error(`Failed to save entry to Firestore: ${error.message || error}`);
  }
}

/**
 * Subscribes to real-time updates for all journal entries belonging to a user.
 */
export function subscribeToUserEntries(
  userId: string,
  onUpdate: (entries: JournalEntry[]) => void,
  onError?: (error: Error) => void
): () => void {
  if (!userId) return () => {};

  const entriesRef = collection(db, "users", userId, "entries");
  const q = query(entriesRef, orderBy("updatedAt", "desc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as JournalEntry;
        entries.push({
          ...data,
          id: docSnap.id,
        });
      });
      onUpdate(entries);
    },
    (err) => {
      console.error("[Firestore Snapshot Error]:", err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetches all journal entries for a user once.
 */
export async function fetchUserEntries(userId: string): Promise<JournalEntry[]> {
  if (!userId) return [];
  const entriesRef = collection(db, "users", userId, "entries");
  const q = query(entriesRef, orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  const entries: JournalEntry[] = [];
  snapshot.forEach((docSnap) => {
    entries.push({
      ...(docSnap.data() as JournalEntry),
      id: docSnap.id,
    });
  });
  return entries;
}

/**
 * Deletes a single journal entry from Firestore.
 */
export async function deleteJournalEntry(
  userId: string,
  entryId: string
): Promise<void> {
  if (!userId || !entryId) throw new Error("User ID and Entry ID are required to delete.");
  const docRef = doc(db, "users", userId, "entries", entryId);
  try {
    await deleteDoc(docRef);
  } catch (error: any) {
    console.error("[Firestore Error] Failed to delete entry:", error);
    throw new Error(`Failed to delete entry: ${error.message || error}`);
  }
}

/**
 * Toggles the favorite status of a journal entry.
 */
export async function toggleFavorite(
  userId: string,
  entryId: string,
  isFavorite: boolean
): Promise<void> {
  if (!userId || !entryId) return;
  const docRef = doc(db, "users", userId, "entries", entryId);
  try {
    await setDoc(docRef, { isFavorite: !isFavorite, updatedAt: Date.now() }, { merge: true });
  } catch (error: any) {
    console.error("[Firestore Error] Failed to toggle favorite:", error);
    throw error;
  }
}
