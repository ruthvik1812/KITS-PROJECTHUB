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
  console.log('✓ Verification tests passed cleanly.');
  process.exit(0);
} catch (err: any) {
  console.error('✗ Verification test failed:', err.message);
  process.exit(1);
}
