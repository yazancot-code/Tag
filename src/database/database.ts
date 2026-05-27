import * as SQLite from 'expo-sqlite';
import { Tag } from '../types';

let db: SQLite.SQLiteDatabase;

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync('tags.db');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      tag_type TEXT NOT NULL DEFAULT 'text/plain',
      scanned_at TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1
    );
  `);
  // Migration for existing databases that lack the quantity column
  try {
    await db.execAsync('ALTER TABLE tags ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1');
  } catch {
    // Column already exists — ignore
  }
}

export async function insertTag(tag: Tag): Promise<void> {
  await db.runAsync(
    'INSERT OR IGNORE INTO tags (id, content, tag_type, scanned_at, quantity) VALUES (?, ?, ?, ?, ?)',
    [tag.id, tag.content, tag.tag_type, tag.scanned_at, tag.quantity]
  );
}

export async function getAllTags(): Promise<Tag[]> {
  const rows = await db.getAllAsync<Tag>(
    'SELECT * FROM tags ORDER BY scanned_at DESC'
  );
  return rows;
}

export async function updateQuantity(id: string, quantity: number): Promise<void> {
  await db.runAsync('UPDATE tags SET quantity = ? WHERE id = ?', [quantity, id]);
}

export async function deleteTag(id: string): Promise<void> {
  await db.runAsync('DELETE FROM tags WHERE id = ?', [id]);
}