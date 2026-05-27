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
      scanned_at TEXT NOT NULL
    );
  `);
}

export async function insertTag(tag: Tag): Promise<void> {
  await db.runAsync(
    'INSERT OR IGNORE INTO tags (id, content, tag_type, scanned_at) VALUES (?, ?, ?, ?)',
    [tag.id, tag.content, tag.tag_type, tag.scanned_at]
  );
}

export async function getAllTags(): Promise<Tag[]> {
  const rows = await db.getAllAsync<Tag>(
    'SELECT * FROM tags ORDER BY scanned_at DESC'
  );
  return rows;
}