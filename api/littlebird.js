const { TASKS_TABLE, sendError, listAll, isOpenTask } = require('./_airtable');

// Accepts Little Bird's daily activity text, compares it against open Airtable
// tasks with Claude, and returns a summary + which tasks appear to be done.
module.exports = async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not set in Vercel env — add it in the Vercel project settings to enable Little Bird review.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const text = (body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'No Little Bird text provided' });
    if (text.length > 60000) return res.status(400).json({ error: 'Text too long (60k char max)' });

    const openTasks = (await listAll(TASKS_TABLE)).filter(isOpenTask).map(r => ({
      id: r.id,
      name: r.cellValuesByFieldId.fldUUx7BkHssWLeRG || '',
      notes: (r.cellValuesByFieldId.fld9kkcuI7FZqdlt7 || '').slice(0, 200),
    })).filter(t => t.name);

    const prompt = `You are reviewing Sean Wilson's day. Below is (1) the activity log from Little Bird (an app that watches his computer and reports what he actually did) and (2) his open task list from Airtable.

Return ONLY valid JSON, no markdown fences, with this shape:
{
  "summary": "2-3 warm, direct sentences about what Sean actually accomplished today",
  "accomplishments": ["short bullet", ...],
  "taskMatches": [{"id": "<airtable record id>", "name": "<task name>", "evidence": "one sentence of evidence from the log"}],
  "loose_ends": ["things he started but did not finish, or worked on that have no task", ...]
}

Rules:
- taskMatches: ONLY tasks from the list below where the log shows clear evidence the task was completed. When unsure, leave it out — a wrong auto-complete is worse than a miss.
- accomplishments: real work only (creating, writing, recording, fixing, sending). Ignore idle browsing.
- loose_ends: max 4, only genuinely useful ones.

OPEN TASKS:
${JSON.stringify(openTasks)}

LITTLE BIRD LOG:
${text}`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    const data = await anthropicRes.json();
    if (!anthropicRes.ok) {
      return res.status(502).json({ error: data.error?.message || `Claude API error (${anthropicRes.status})` });
    }

    const raw = (data.content || []).map(b => b.text || '').join('');
    let parsed;
    try {
      parsed = JSON.parse(raw.replace(/^```json?\s*|\s*```$/g, ''));
    } catch (_) {
      return res.status(502).json({ error: 'Claude returned unparseable output', raw: raw.slice(0, 500) });
    }

    // Only pass through matches that reference real open-task ids.
    const validIds = new Set(openTasks.map(t => t.id));
    parsed.taskMatches = (parsed.taskMatches || []).filter(m => validIds.has(m.id));

    return res.status(200).json(parsed);
  } catch (err) {
    return sendError(res, err);
  }
};
