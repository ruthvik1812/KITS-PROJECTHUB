import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../../data/kits_projecthub.db');

const db = new Database(dbPath);

console.log('='.repeat(70));
console.log('  KITS ProjectHub — SQLite Database Inspector');
console.log('  Database file:', dbPath);
console.log('='.repeat(70));

// List tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all() as { name: string }[];

console.log('\n📌 ACTIVE TABLES IN DATABASE:');
tables.forEach((t, i) => {
  const count = (db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get() as { count: number }).count;
  console.log(`  ${i + 1}. ${t.name.padEnd(25)} [${count} records]`);
});

// Show sample rows from primary tables
for (const t of tables) {
  console.log('\n' + '-'.repeat(70));
  console.log(`🔍 TABLE: ${t.name}`);
  console.log('-'.repeat(70));
  const rows = db.prepare(`SELECT * FROM ${t.name} LIMIT 5`).all();
  if (rows.length === 0) {
    console.log('  (Table is currently empty)');
  } else {
    console.table(rows);
  }
}

console.log('\n' + '='.repeat(70));
db.close();
