# SWP Morning Briefing

Static dashboard plus Vercel API routes for Airtable.

## Vercel environment variables

Set these in Vercel Project Settings:

- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TASKS_TABLE_ID`
- `AIRTABLE_PROJECTS_TABLE_ID`

Optional:

- `DASHBOARD_PASSWORD`

If `DASHBOARD_PASSWORD` is set, the browser prompts once and stores it in localStorage. The Airtable token is only used by API routes and is never exposed in browser source.

## API routes

- `GET /api/tasks` returns open Airtable tasks.
- `GET /api/projects` returns Airtable projects.
- `PATCH /api/tasks/:id` updates an Airtable task.
- `POST /api/tasks` creates an Airtable task, including linked project IDs.
