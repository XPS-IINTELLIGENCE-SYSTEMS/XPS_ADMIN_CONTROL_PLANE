// Vercel serverless function: GET /api/github
// Proxies GitHub REST API calls using GITHUB_TOKEN from server-side env.
// Token is NEVER sent to the client — all requests proxy through this route.
//
// Query params:
//   action  = repos | issues | prs | commits | workflows | releases | checks
//   repo    = owner/repo  (required for most actions)
//   owner   = org/user    (used for repos list)
//   state   = open|closed|all (for issues/prs)
//   branch  = branch name (for commits)
//   per_page = 1-100
//   page    = page number

const GITHUB_API = 'https://api.github.com';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_API_TOKEN;

  if (!token) {
    return res.status(200).json({
      blocked: true,
      reason:  'GITHUB_TOKEN not configured — set in Vercel project environment variables.',
      data:    null,
    });
  }

  const { action, repo, owner, state = 'open', branch, per_page = '20', page = '1' } = req.query || {};

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept:        'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent':  'XPS-Admin-Control-Plane/1.0',
  };

  try {
    let url;
    switch (action) {
      case 'repos': {
        const target = owner || process.env.GITHUB_OWNER || process.env.GITHUB_ORG;
        if (!target) {
          return res.status(200).json({ blocked: false, action, data: [], note: 'Set GITHUB_OWNER or GITHUB_ORG env var to list repos.' });
        }
        // Try org first, fall back to user
        url = `${GITHUB_API}/orgs/${target}/repos?sort=updated&per_page=${per_page}&page=${page}`;
        break;
      }
      case 'issues': {
        if (!repo) return res.status(400).json({ error: 'repo param required' });
        url = `${GITHUB_API}/repos/${repo}/issues?state=${state}&per_page=${per_page}&page=${page}`;
        break;
      }
      case 'prs': {
        if (!repo) return res.status(400).json({ error: 'repo param required' });
        url = `${GITHUB_API}/repos/${repo}/pulls?state=${state}&per_page=${per_page}&page=${page}`;
        break;
      }
      case 'commits': {
        if (!repo) return res.status(400).json({ error: 'repo param required' });
        const branchParam = branch ? `&sha=${encodeURIComponent(branch)}` : '';
        url = `${GITHUB_API}/repos/${repo}/commits?per_page=${per_page}&page=${page}${branchParam}`;
        break;
      }
      case 'workflows': {
        if (!repo) return res.status(400).json({ error: 'repo param required' });
        url = `${GITHUB_API}/repos/${repo}/actions/workflows?per_page=${per_page}`;
        break;
      }
      case 'workflow_runs': {
        if (!repo) return res.status(400).json({ error: 'repo param required' });
        url = `${GITHUB_API}/repos/${repo}/actions/runs?per_page=${per_page}&page=${page}`;
        break;
      }
      case 'releases': {
        if (!repo) return res.status(400).json({ error: 'repo param required' });
        url = `${GITHUB_API}/repos/${repo}/releases?per_page=${per_page}&page=${page}`;
        break;
      }
      case 'checks': {
        if (!repo) return res.status(400).json({ error: 'repo param required' });
        // Get latest commit SHA first
        const commitsRes = await fetch(`${GITHUB_API}/repos/${repo}/commits?per_page=1`, { headers });
        const commits = await commitsRes.json();
        if (!commits[0]) return res.status(200).json({ blocked: false, action, data: [] });
        url = `${GITHUB_API}/repos/${repo}/commits/${commits[0].sha}/check-runs`;
        break;
      }
      case 'repo_info': {
        if (!repo) return res.status(400).json({ error: 'repo param required' });
        url = `${GITHUB_API}/repos/${repo}`;
        break;
      }
      case 'branches': {
        if (!repo) return res.status(400).json({ error: 'repo param required' });
        url = `${GITHUB_API}/repos/${repo}/branches?per_page=${per_page}`;
        break;
      }
      default:
        return res.status(400).json({ error: `Unknown action: ${action}. Valid: repos, issues, prs, commits, workflows, workflow_runs, releases, checks, repo_info, branches` });
    }

    const ghRes = await fetch(url, { headers });

    if (!ghRes.ok) {
      const errText = await ghRes.text();
      // For org repos, fall back to user repos
      if (action === 'repos' && ghRes.status === 404) {
        const target = owner || process.env.GITHUB_OWNER || process.env.GITHUB_ORG;
        const userUrl = `${GITHUB_API}/users/${target}/repos?sort=updated&per_page=${per_page}&page=${page}`;
        const userRes = await fetch(userUrl, { headers });
        if (userRes.ok) {
          const userData = await userRes.json();
          return res.status(200).json({ blocked: false, action, data: userData, source: 'user' });
        }
      }
      return res.status(200).json({
        blocked: false,
        action,
        error:  `GitHub API ${ghRes.status}`,
        detail: errText.slice(0, 200),
        data:   null,
      });
    }

    const data = await ghRes.json();
    return res.status(200).json({ blocked: false, action, data });

  } catch (err) {
    console.error('[github proxy] error:', err.message);
    return res.status(500).json({ blocked: false, action, error: err.message, data: null });
  }
}
