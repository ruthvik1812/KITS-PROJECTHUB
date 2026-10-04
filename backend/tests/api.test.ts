import { db, initDatabase } from '../src/db/database.js';

console.log('Running API & Database integrity verification test...');

try {
  initDatabase();
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
  const tableNames = tables.map(t => t.name);
  
  const expectedTables = ['departments', 'users', 'official_groups', 'official_group_members', 'projects', 'project_ratings', 'project_comments'];
  for (const expected of expectedTables) {
    if (!tableNames.includes(expected)) {
      throw new Error(`Missing expected table: ${expected}`);
    }
  }

  // Verify presentation_url column in projects
  const projectCols = db.prepare("PRAGMA table_info(projects)").all() as any[];
  const projectColNames = projectCols.map(c => c.name);
  if (!projectColNames.includes('presentation_url')) {
    throw new Error('Missing presentation_url column in projects table');
  }

  // Import and test GitHub validator
  const { validateGitHubRepoUrl } = await import('../src/services/githubValidator.js');
  
  // Test valid URLs
  const valid1 = validateGitHubRepoUrl('https://github.com/kits-college/smart-grid');
  if (!valid1.valid || valid1.normalized !== 'https://github.com/kits-college/smart-grid') {
    throw new Error('Valid GitHub repo URL failed validation');
  }

  const valid2 = validateGitHubRepoUrl('github.com/user/project.git');
  if (!valid2.valid || valid2.normalized !== 'https://github.com/user/project') {
    throw new Error('Normalization of github.com/user/project.git failed');
  }

  // Test invalid URLs
  const invalidEmpty = validateGitHubRepoUrl('');
  if (invalidEmpty.valid) throw new Error('Empty URL should fail');

  const invalidDomain = validateGitHubRepoUrl('https://gitlab.com/user/project');
  if (invalidDomain.valid) throw new Error('Non-GitHub URL should fail');

  const invalidGeneric = validateGitHubRepoUrl('https://github.com/explore');
  if (invalidGeneric.valid) throw new Error('Generic GitHub path should fail');

  const invalidProfile = validateGitHubRepoUrl('https://github.com/username');
  if (invalidProfile.valid) throw new Error('Profile without repository should fail');

  console.log('✓ All database tables and columns (including presentation_url) verified successfully:', tableNames.filter(t => !t.startsWith('sqlite_')).join(', '));
  console.log('✓ GitHub validator unit tests passed cleanly (valid repos normalized, invalid/generic repos rejected).');

  // Test Error Sanitizer & Handler
  const { isSensitiveError, sanitizeClientErrorMessage } = await import('../src/middleware/errorHandler.js');

  // Verify detection of sensitive errors
  if (!isSensitiveError('SqliteError: UNIQUE constraint failed: users.email')) {
    throw new Error('Failed to detect SQLite UNIQUE constraint error as sensitive');
  }
  if (!isSensitiveError('SqliteError: near "SELECT": syntax error in E:\\kits-projecthub\\backend\\src\\db\\database.ts:42')) {
    throw new Error('Failed to detect SQL syntax error / file path as sensitive');
  }
  if (!isSensitiveError('Error: ENOENT: no such file or directory, open \'C:\\Users\\admin\\file.pdf\'')) {
    throw new Error('Failed to detect filesystem path error as sensitive');
  }
  if (!isSensitiveError('    at Module._compile (internal/modules/cjs/loader.js:723:30)')) {
    throw new Error('Failed to detect stack trace as sensitive');
  }

  // Verify safe validation errors pass through cleanly
  const safeMsg = 'Full Name must be at least 2 characters.';
  if (sanitizeClientErrorMessage(new Error(safeMsg), 'Fallback') !== safeMsg) {
    throw new Error('Safe validation message was incorrectly altered');
  }

  // Verify sensitive errors are sanitized to fallback
  const fallback = 'Registration failed. Please check your details and try again.';
  const sanitized = sanitizeClientErrorMessage(new Error('SqliteError: table users has no column named pw'), fallback);
  if (sanitized !== fallback) {
    throw new Error(`Sensitive error leaked: ${sanitized}`);
  }
  console.log('✓ Error sanitization tests passed cleanly (stack traces, file paths, and SQLite details shielded).');

  console.log('✓ All verification tests passed cleanly.');
  process.exit(0);
} catch (err: any) {
  console.error('✗ Verification test failed:', err.message);
  process.exit(1);
}
