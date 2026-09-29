/**
 * Validates and normalizes GitHub repository URLs for KITS ProjectHub submissions.
 */

export interface GitHubValidationResult {
  valid: boolean;
  normalized?: string;
  error?: string;
  owner?: string;
  repo?: string;
}

export function validateGitHubRepoUrl(input?: string): GitHubValidationResult {
  if (!input || !input.trim()) {
    return {
      valid: false,
      error: 'GitHub repository link is required.',
    };
  }

  let clean = input.trim();

  // Auto-prepend https:// if missing
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = 'https://' + clean;
  }

  try {
    const parsed = new URL(clean);
    const hostname = parsed.hostname.toLowerCase().replace(/^www\./, '');

    if (hostname !== 'github.com') {
      return {
        valid: false,
        error: 'Repository link must be on GitHub (e.g. https://github.com/username/repository).',
      };
    }

    // Split pathname into non-empty segments
    const segments = parsed.pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return {
        valid: false,
        error: 'Please enter a complete GitHub repository URL (not just github.com).',
      };
    }

    if (segments.length === 1) {
      return {
        valid: false,
        error: `Please include the repository name after the username: https://github.com/${segments[0]}/<repository-name>`,
      };
    }

    const owner = segments[0];
    const rawRepo = segments[1];
    const repoName = rawRepo.replace(/\.git$/i, '');

    // Disallow reserved GitHub words as owner
    const reservedWords = [
      'explore', 'topics', 'trending', 'collections', 'events', 'sponsors',
      'features', 'enterprise', 'pricing', 'login', 'join', 'signup',
      'settings', 'notifications', 'marketplace', 'organizations', 'orgs',
      'new', 'contact', 'about', 'security', 'customer-stories', 'readme',
      'site', 'pulls', 'issues'
    ];

    if (reservedWords.includes(owner.toLowerCase()) && segments.length === 2) {
      return {
        valid: false,
        error: `"${owner}" is a generic GitHub page, not a student project repository.`,
      };
    }

    // Validate owner format: alphanumeric or single hyphens, 1-39 chars
    const validOwnerPattern = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;
    if (!validOwnerPattern.test(owner)) {
      return {
        valid: false,
        error: `"${owner}" is not a valid GitHub username or organization name.`,
      };
    }

    // Validate repo name: alphanumeric, hyphens, underscores, dots, 1-100 chars
    const validRepoPattern = /^[a-zA-Z0-9_.-]{1,100}$/;
    if (!validRepoPattern.test(repoName)) {
      return {
        valid: false,
        error: `"${repoName}" is not a valid GitHub repository name.`,
      };
    }

    const normalized = `https://github.com/${owner}/${repoName}`;
    return {
      valid: true,
      normalized,
      owner,
      repo: repoName,
    };
  } catch {
    return {
      valid: false,
      error: 'Please enter a valid URL in the format: https://github.com/username/repository',
    };
  }
}
