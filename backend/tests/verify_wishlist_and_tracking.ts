import { initDatabase, db } from '../src/db/database.js';
import { recordProjectView, recordProjectShare } from '../src/services/projectSqlService.js';
import { addToWishlist, getUserWishlist, getWishlistProjectIds, removeFromWishlist } from '../src/services/wishlistService.js';

console.log('Testing Wishlist, Views, and Shares backend logic...');

// 1. Initialize DB
initDatabase();

// Find an approved project to test with
const project = db.prepare(`SELECT id, title, views_count, shares_count FROM projects WHERE status = 'approved' LIMIT 1`).get() as any;
if (!project) {
  throw new Error('No approved project found in database for testing.');
}

console.log(`Using test project: "${project.title}" (${project.id})`);

// Find a test student user
const student = db.prepare(`SELECT id, email, full_name FROM users WHERE role = 'student' LIMIT 1`).get() as any;
if (!student) {
  throw new Error('No student found in database for testing.');
}

console.log(`Using test student: "${student.full_name}" (${student.id})`);

// --- Test 1: Views Tracking & 24h Deduplication ---
console.log('\n--- 1. Testing View Counting & 24h Deduplication ---');
const viewerA = `user:${student.id}`;
const viewerB = 'anon:visitor-uuid-1234';

// Clear previous test views for this project
db.prepare(`DELETE FROM project_views WHERE project_id = ?`).run(project.id);
db.prepare(`UPDATE projects SET views_count = 0 WHERE id = ?`).run(project.id);

// First view from viewer A -> Should count
const v1 = recordProjectView(project.id, viewerA);
if (!v1.counted || v1.views_count !== 1) {
  throw new Error(`Expected v1 to count (1), got counted=${v1.counted}, views_count=${v1.views_count}`);
}
console.log('✓ First view from authenticated student counted (views_count = 1)');

// Second view from same viewer A immediately (refresh/re-entry) -> Should NOT count
const v2 = recordProjectView(project.id, viewerA);
if (v2.counted || v2.views_count !== 1) {
  throw new Error(`Expected v2 to be deduplicated within 24h, got counted=${v2.counted}, views_count=${v2.views_count}`);
}
console.log('✓ Second view within 24 hours deduplicated successfully (views_count remains 1)');

// View from visitor B (anonymous with visitor ID) -> Should count as distinct viewer
const v3 = recordProjectView(project.id, viewerB);
if (!v3.counted || v3.views_count !== 2) {
  throw new Error(`Expected v3 from visitor to count (2), got counted=${v3.counted}, views_count=${v3.views_count}`);
}
console.log('✓ View from anonymous guest counted as distinct viewer (views_count = 2)');

// Immediate repeat from visitor B -> Deduplicated
const v4 = recordProjectView(project.id, viewerB);
if (v4.counted || v4.views_count !== 2) {
  throw new Error('Expected v4 to be deduplicated');
}
console.log('✓ Immediate refresh from anonymous guest deduplicated (views_count remains 2)');

// --- Test 2: Share Action Tracking & Rate Limiting ---
console.log('\n--- 2. Testing Share Action Tracking & Rate Limiting ---');
db.prepare(`DELETE FROM project_shares WHERE project_id = ?`).run(project.id);
db.prepare(`UPDATE projects SET shares_count = 0 WHERE id = ?`).run(project.id);

const s1 = recordProjectShare(project.id, viewerA, 'native');
if (!s1.counted || s1.shares_count !== 1) {
  throw new Error(`Expected share to count (1), got counted=${s1.counted}, shares_count=${s1.shares_count}`);
}
console.log('✓ Share action recorded (shares_count = 1)');

// Rapid repeat share from same user -> Rate limited (30s cooldown)
const s2 = recordProjectShare(project.id, viewerA, 'copy_link');
if (s2.counted || s2.shares_count !== 1) {
  throw new Error('Expected rapid repeated share to be rate-limited within cooldown');
}
console.log('✓ Rapid repeated share from same user rate-limited (shares_count remains 1)');

// --- Test 3: Wishlist Management ---
console.log('\n--- 3. Testing Wishlist Add, Duplicate Prevention, Privacy & Removal ---');
// Clean student wishlist first
db.prepare(`DELETE FROM wishlists WHERE user_id = ?`).run(student.id);

// Add to wishlist
const w1 = addToWishlist(student.id, project.id);
if (!w1.success || w1.alreadySaved) {
  throw new Error(`Expected w1 to succeed, got ${JSON.stringify(w1)}`);
}
console.log('✓ Project added to wishlist successfully');

// Attempt duplicate add
const w2 = addToWishlist(student.id, project.id);
if (!w2.success || !w2.alreadySaved) {
  throw new Error(`Expected duplicate add to indicate alreadySaved, got ${JSON.stringify(w2)}`);
}
console.log('✓ Duplicate save prevented and handled gracefully (alreadySaved = true)');

// Verify getWishlistProjectIds
const ids = getWishlistProjectIds(student.id);
if (!ids.includes(project.id)) {
  throw new Error(`Expected ${project.id} in wishlist ids, got ${JSON.stringify(ids)}`);
}
console.log(`✓ getWishlistProjectIds returned [${ids.join(', ')}]`);

// Verify getUserWishlist
const userWishlist = getUserWishlist(student.id);
if (userWishlist.length !== 1 || userWishlist[0].id !== project.id) {
  throw new Error(`Expected 1 item with id ${project.id}, got ${JSON.stringify(userWishlist)}`);
}
console.log('✓ getUserWishlist returned populated project card with wishlist metadata');

// Verify privacy: Another student does not see student A\'s wishlist
const otherStudent = db.prepare(`SELECT id FROM users WHERE role = 'student' AND id != ? LIMIT 1`).get(student.id) as any;
if (otherStudent) {
  const otherWishlist = getUserWishlist(otherStudent.id);
  if (otherWishlist.length !== 0) {
    throw new Error('Wishlist is NOT private between students!');
  }
  console.log('✓ Wishlist privacy verified: Other student has independent private wishlist');
}

// Remove from wishlist
const r1 = removeFromWishlist(student.id, project.id);
if (!r1.success || r1.removedCount !== 1) {
  throw new Error(`Expected removal to succeed, got ${JSON.stringify(r1)}`);
}
console.log('✓ Project removed from wishlist');

// Verify project itself was NOT deleted
const checkProjectStillExists = db.prepare(`SELECT id, title FROM projects WHERE id = ?`).get(project.id);
if (!checkProjectStillExists) {
  throw new Error('CRITICAL BUG: Removing from wishlist deleted the actual project!');
}
console.log('✓ Verified: Project still exists in repository (only bookmark was removed)');

console.log('\nAll backend views, shares, and wishlist tests passed cleanly!');
