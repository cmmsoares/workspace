# Workspace — Cowork Instructions

## What this is
This folder contains a personal productivity workspace served by a local Node.js server at `localhost:3000`. The tools are user-agnostic — infer the user's name, role, and relevant topics from the workspace data (`userName` / `userRole` in `data/plan-and-track.json`) and from the content of files under `files/`. Do **not** assume a specific person, company, domain, or product area unless you see it in the data.

## Tools
- **Plan & Track** (`plan-and-track.html`) — weekly task and meeting tracker: this week's tasks, next steps, sessions, and a Timeline of weekly summary reports. Data lives in `data/plan-and-track.json`; weekly reports are markdown files in `files/weekly-summaries/` (listed on the Timeline page).
- **Show & Note** (`show-and-note.html`) — Artifact presentation with feedback/decisions/next steps capture. Data lives in `data/sessions.json`.
- **Context Catch-up** (`context-catchup.html`) — Post-absence triage. Reads `files/Context-catch-up/` and writes a single importance-ordered flat list of items to `data/context-catchup.json` (no priority buckets — the UI shows one list and the user triages from there).

## Data format
Both core tools store data as JSON in the `data/` directory. The server backs up every save to `data/backups/` (last 20 rolling versions per file, timestamped) and additionally writes a permanent daily snapshot to `data/vault/` on the first save of each date (one file per name per day, no retention cap). Use `vault/` for long-horizon recovery; `backups/` for recent undos.

### sessions.json (Show & Note)
Array of session objects:
```json
[{
  "key": "session-name__timestamp",
  "fileName": "Session Name",
  "fileType": "notes|jsx|html|md|svg",
  "createdAt": 1234567890,
  "updatedAt": 1234567890,
  "feedback": "text",
  "decisions": "text",
  "nextSteps": "text",
  "downloaded": false,
  "_wsSessionId": "abc123"
}]
```

### plan-and-track.json
Schema version: 17. Full structure:
```json
{
  "_schemaVersion": 17,
  "theme": "light|dark",
  "userName": "<inferred or set via Welcome modal>",
  "userRole": "<inferred or set via Welcome modal>",
  "archivedSections": [],
  "focusAreas": [
    { "id": "f1", "text": "Delivery" }
  ],
  "thisWeek": [
    { "id": "tw1", "text": "Task name", "detail": "Context", "done": false, "source": "", "owner": "Me", "createdAt": "2026-04-15T09:12:34.567Z" }
  ],
  "nextSteps": [
    { "id": "ns1", "text": "Action item", "owner": "Me", "due": "", "source": "Session: Meeting Name", "done": false, "createdAt": "2026-04-15T09:12:34.567Z" }
  ],
  "timeline": [],
  "weeklyReports": [
    { "id": "wr1", "year": 2026, "week": 16, "filename": "weekly-report-2026-W16.md", "content": "# Weekly Report ...", "createdAt": "2026-04-17" }
  ],
  "initiatives": [
    { "id": "i1", "name": "Initiative name", "phase": 1, "status": "active|waiting|planned|done", "note": "Context", "notes": "", "priority": "high|medium|low|null", "tags": ["<free-form tags inferred from the user's work>"] }
  ],
  "contextItems": [
    { "id": "c1", "text": "Topic", "done": false }
  ],
  "sessions": [
    { "id": "s1", "date": "2026-04-15", "label": "Meeting title", "type": "meeting|show-note", "blocks": [
      { "id": "b1", "title": "Topic discussed", "time": "5 min", "covered": false, "notes": "Key points..." }
    ], "file": null }
  ]
}
```

## How to interact with data
- **Read**: `cat data/plan-and-track.json` or `cat data/sessions.json`
- **Write**: Edit the JSON files directly. The HTML tools will pick up changes on next page load.
- **Server API**: `GET /data/sessions` and `POST /data/sessions` (same for `plan-and-track`)

## ID generation
Use random 6-char alphanumeric strings for all IDs: `Math.random().toString(36).slice(2, 8)`

## Inferring user context
When a task requires judgment about what matters to the user (prioritizing items, tagging initiatives, filtering noise, writing weekly reports, processing transcripts, triaging catch-up content), do not assume. Pull signal from whatever is available to you, in this order:

1. **Memory / skills** — any personal skill or memory file you have access to (e.g. user skills under `.claude/skills/`, CLAUDE.md, or a personal work-context skill) that describes the user's role, products, or stakeholders.
2. **Plan & Track** — `userName`, `userRole`, `initiatives[].name` / `tags`, `focusAreas[].text`, recent `sessions[].label`, and any files under `files/`.
3. **Past Claude sessions** — if you can list or read prior session transcripts, skim the most recent ones for recurring project names, people, and themes.
4. **The task input itself** — as a fallback or to fill gaps (e.g. the transcript being processed, the catch-up files being read).

Use that inferred picture to drive prioritization, tagging, and language choices across all tasks. Keep tags and titles grounded in what you actually see — never invent categories. If the signal is too thin to infer confidently, say so and ask the user.

## Common tasks

### Process a meeting transcript
1. Read the `.vtt` file from `files/transcripts/`
2. Parse the VTT: strip timestamps and `-->` lines, extract speaker text, deduplicate consecutive identical lines
3. Analyze the conversation to extract:
   - **Title**: short descriptive meeting name
   - **Date**: from the file or content if mentioned
   - **Topics**: 3-7 major discussion blocks with concise notes
   - **Decisions**: anything agreed upon
   - **Action items**: concrete next steps with owner if identifiable
4. Read `data/plan-and-track.json`
5. Add a new session to the `sessions` array:
   ```json
   { "id": "<uid>", "date": "<YYYY-MM-DD>", "label": "<title>", "type": "meeting", "blocks": [...topics as blocks...], "file": "<filename>" }
   ```
6. Add action items to the `nextSteps` array:
   ```json
   { "id": "<uid>", "text": "<action>", "owner": "<person or Me>", "due": "", "source": "Session: <title>", "done": false, "createdAt": "<today>" }
   ```
7. Write the updated JSON back to `data/plan-and-track.json`

### Process all unprocessed transcripts
1. List files in `files/transcripts/`
2. Read current `data/plan-and-track.json`
3. Check which transcripts already have a session (match by `file` field in sessions)
4. Process only the new ones using the steps above
5. Write once at the end with all new sessions and next steps merged

### Other tasks
- "Pull tickets from my issue tracker and add them to plan-and-track.json" — Read the current JSON, merge new items, write back.
- "Push next steps to a wiki page" — Read nextSteps from both JSON files, format as a wiki/markdown page.
- "Export weekly summary" / "Run the weekly report" — Read both JSONs, generate the markdown report using the format below, then: (1) display it inline in the chat, (2) save as `files/weekly-summaries/weekly-report-YYYY-WNN.md`, (3) add an entry to `weeklyReports` in `plan-and-track.json` with `{id, year, week, filename, content, createdAt}`. The JSON entry is the source of truth for the Timeline page; the `.md` file is a convenience copy for direct sharing. If an entry for that year+week already exists, update its `content` rather than creating a duplicate.

### Weekly Report Format (canonical)

Display inline in chat. Do not use a markdown file link as the primary output — show it directly.
Save the file to `files/weekly-summaries/weekly-report-YYYY-WNN.md` as a side effect.

**Personalisation:** Before generating the report, read `userName` and `userRole` from `plan-and-track.json` and substitute them into the title line (`{userName}` and `{userRole}` below). If either is missing or still equals the default `"Name"` / `"Role"`, drop the "— {userName}, {userRole}" suffix and render just `# Weekly Report`.

```
# Weekly Report — {userName}, {userRole}
**Week of [Date range]**

---

## What Shipped

[1-2 sentence framing — tone, overall score e.g. "Clean week — 6 of 6 items done."]

[One paragraph per major theme/initiative with activity this week. Bold the initiative name. Prose, no bullets. Include decisions made, feedback received, and what moved forward.]

---

## Open / Concerns

[Group by: "Pending decisions that block progress", "Open next steps by [nearest deadline]", "Accumulating threads", "Strategic items still not started". Prose intro + bullet list per group. Only include groups that have items.]

---

## Priorities for Next Week

[Numbered list, 4-6 items max. Actionable, specific.]

---

[Optional one-line flag if a cognitive/scope pattern is worth naming.]

---

*Generated: [date] | Source: plan-and-track.json + sessions.json*
```

**Rules for report content:**
- Cross-reference `thisWeek[done]` for delivery score — count only confirmed done items
- Cross-reference `nextSteps[done]` for open items — exclude items marked done
- Filter sessions by the requested date range
- Do not flag items as open if they are marked `done: true` in the JSON

## Scheduled tasks (automations)

Three cron jobs back this workspace. Full prompt + setup guidance lives in the Plan & Track UI under the **Automations** section on the relevant page — Sessions or Timeline — so anyone can copy the prompt to run it ad-hoc in a Cowork chat or recreate the cron.

- **`process-transcripts`** — Mon–Fri 16:00 (`0 16 * * 1-5`). Surfaced on the Sessions page. Parses new `.vtt` / `.txt` files in `files/transcripts/` and appends Sessions + nextSteps.
- **`weekly-calendar-import`** — Mondays 09:00 (`0 9 * * 1`). Surfaced on the Sessions page. Reads the latest image in `files/calendar/` and creates Session entries **only for meetings you've accepted**. Tentative, declined, and needs-action events are skipped (they appear as hollow/outlined circles, faded text, or strikethrough in Google Calendar views). All-day OOO blocks and personal reminders are also skipped. Requires a fresh calendar screenshot in `files/calendar/` — either manually dropped in, or via an OS-level automation that saves the screenshot into the project's `files/calendar/` folder.
- **`weekly-report-friday-rollover`** — Fridays 17:00 (`0 17 * * 5`). Surfaced on the Timeline page. Runs the weekly report and rolls completed `thisWeek` items into `previousWeeks`.

When editing these prompts, update both the UI (`SESSIONS_AUTOMATIONS` / `TIMELINE_AUTOMATIONS` in `plan-and-track.html`) and the scheduled task itself so they stay in sync.

### Setting up the scheduled tasks

When a user asks something like **"Schedule the tasks for the workspace tools"** (or any similar phrasing — "set up the automations", "add the weekly schedules", etc.), run this flow:

1. Call `list_scheduled_tasks` to check which of the three (`process-transcripts`, `weekly-calendar-import`, `weekly-report-friday-rollover`) are already registered.
2. For any that are **missing**, briefly describe what they do (one line each) and ask whether the user wants all of them, some, or none.
3. For each one they accept, call `create_scheduled_task` using the cron expression listed above and the full prompt from `SESSIONS_AUTOMATIONS` / `TIMELINE_AUTOMATIONS` in `plan-and-track.html`.
4. If **all three** are already scheduled, confirm that briefly and don't create duplicates.

The README instructs users to send this exact message on their first chat with a fresh workspace, so expect it early in new sessions.

## Language Rules
- When referring to the user's goals or performance context, always use "career goals" or "areas of opportunity" — never use clinical HR terminology. Treat anything performance-related as confidential.

## Rules
- Always preserve existing data when writing. Merge, don't overwrite.
- Always read the current JSON before writing to avoid losing concurrent changes.
- The server keeps 20 rolling backups per file, but don't rely on that — be careful.
- Generate unique IDs for all new items (6-char random alphanumeric).
- Set `createdAt` to a full ISO timestamp (`new Date().toISOString()`, e.g. `2026-04-17T22:15:42.103Z`) for new nextSteps and thisWeek items. Time-aware sort depends on this. Date-only legacy values still work but won't order correctly within a day.
- **Timeline is for weekly reports only.** Do not append individual checked-off items to `timeline[]`. Completed items stay on their own list (`thisWeek[done]` / `nextSteps[done]`) until the Friday weekly wrap-up archives them into the report. The `timeline[]` array is kept in the schema only as a legacy field — ignore it for new work.
- Both HTML files use Inter font; the palette is a warm cream/teal by default and adapts via the theme toggle.
