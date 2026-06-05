# SWP Morning Briefing

Static dashboard plus Vercel API routes for Airtable.

## Operating model

- GitHub `main` is the canonical dashboard/API source. Vercel deploys from this branch automatically.
- Codex changes made in this repo should be committed and pushed to `main`; Sean should not need to repeat those instructions to Claude Cowork.
- Claude Cowork owns only scheduled data injection: calendar JSON, email JSON, source notes, Fathom/chat summary, and morning snapshots.
- Claude Dispatch should follow the same Airtable task rules as the live dashboard and the scheduled Cowork skill at `~/Documents/Claude/Scheduled/morning-briefing/SKILL.md`.
- If a change requires Cowork, say so explicitly. Otherwise, pushed repo changes are enough.
- Routine Airtable data work belongs to Cowork/Dispatch: create linked tasks, add small task batches under a project, update planning buckets/dates/statuses, and add project context. Codex should only be needed for dashboard functionality, API behavior, deployment, or UI changes.

## Scheduled push

The scheduled Cowork morning run should call:

```bash
~/morning-briefing-push.sh
```

That script commits the current dashboard snapshot/version into this repo and pushes `main`, which triggers Vercel.

## Vercel environment variables

Set these in Vercel Project Settings:

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TASKS_TABLE_ID`
- `AIRTABLE_PROJECTS_TABLE_ID`

Dashboard password protection is temporarily disabled while Airtable loading is verified. The Airtable token is only used by API routes and is never exposed in browser source.

## API routes

- `GET /api/tasks` returns open Airtable tasks.
- `GET /api/projects` returns Airtable projects.
- `PATCH /api/tasks/:id` updates an Airtable task.
- `POST /api/tasks` creates an Airtable task, including linked project IDs.
