# Workspace · Getting Started

A local productivity workspace. Three tools that run in your browser, backed by a small Node.js server on your Mac. No cloud, no accounts, your data stays on your machine.

---

## Get the files

1. Go to the repo's **[Releases](https://github.com/your-username/workspace-tool/releases) page**.
2. Under the latest release, download **`workspace.zip`**.
3. Unzip it. You'll get a folder called `workspace`.

---

## What you'll do

1. Put the folder in the right place.
2. Make sure Node.js is installed.
3. Double-click `Workspace.app`.
4. Connect Claude (via Cowork) to the workspace folder.

Total time: ~3 minutes.

---

## Step 1 · Put the folder in the right place

After unzipping, move the `workspace` folder to:

```
~/Documents/claude/workspace
```

"`~`" is a shortcut for your home folder (`/Users/yourname`). So the full path will look like `/Users/yourname/Documents/claude/workspace`.

If the `claude` folder doesn't exist yet, create it first:

- Open **Finder** → go to **Documents** → right-click → **New Folder** → name it `claude`
- Drag the unzipped `workspace` folder into `~/Documents/claude/`

You can put the folder anywhere you like. This location is just a recommendation to keep things tidy.

---

## Step 2 · Check that Node.js is installed

The server runs on Node.js. To check if you already have it, open **Terminal** (⌘+Space → type "Terminal" → press Enter) and type:

```
node --version
```

If you see a version number (e.g. `v20.11.0`), you're set. Skip to Step 3.

If you see `command not found`, install Node from https://nodejs.org (pick the "LTS" download), then run the check again.

---

## Step 3 · Start the workspace

Double-click **`Workspace.app`** inside the workspace folder.

> **First time only:** macOS may say *"Workspace.app can't be opened because Apple cannot check it for malicious software."* Right-click the app → **Open** → click **Open** on the security prompt. You only need to do this once.

Here's what happens:
- A Terminal window opens and starts the server
- Chrome opens automatically at `http://localhost:3000`
- You'll see a hub page with three tools

The first time you open **Plan & Track**, a Welcome modal will ask for your name and role. That's used in your weekly reports.

> **Note:** Keep the Terminal window open in the background. Closing it stops the server. Minimize it if it's in the way.

---

## Step 4 · Connect Claude to your workspace

The browser tools are where you capture and view things. Claude is what makes them run: processing meeting transcripts, writing weekly reports, and building your catch-up list after time off.

1. Open **Claude Cowork** on your Mac.
2. Start a new chat.
3. When it asks you to select a folder, pick the `workspace` folder you just set up.

Claude automatically reads `CLAUDE.md` at the root of the folder, so it already knows how the workspace is organized. No setup message needed.

**As your first message, send:**

> Schedule the tasks for the workspace tools

Claude will check which of the three weekly automations aren't set up yet and offer to schedule them:

- Transcript processing (Mon–Fri afternoon)
- Weekly calendar import (Monday morning)
- Weekly report + rollover (Friday evening)

Accept the ones you want. You can also run any automation manually later by copying its prompt from the **Automations** card inside the Plan & Track tool or the Context Catch-up page and pasting it into Cowork.

> **Tip:** Keep one Cowork chat per workspace. If the chat gets long, start a new one and select the same folder. `CLAUDE.md` is loaded automatically again.

---

## The three tools

- **Plan & Track** · weekly tasks, next steps, sessions, and a timeline of weekly reports
- **Show & Note** · present artifacts and capture feedback, decisions, and next steps
- **Context Catch-up** · triage after time off

Drop meeting transcripts (`.vtt` or `.txt`) in `files/transcripts/` and Claude can process them into Sessions. Drop a weekly calendar screenshot in `files/calendar/` and Claude can import the meetings as Sessions.

---

## How to stop the server

Two ways, use whichever is easier:

**A) From the hub page** (`http://localhost:3000`). Click the **···** (three-dot) icon in the top-right corner, then choose **Stop server**. The server shuts itself down cleanly.

**B) From the Terminal window** the applet opened. Press `Ctrl+C`.

To start it again, just double-click `Workspace.app` again.

---

## Your data

Lives in three JSON files under `data/`:
- `plan-and-track.json`
- `sessions.json`
- `context-catchup.json`

The server keeps 20 rolling backups per file in `data/backups/` and a daily snapshot in `data/vault/`, so you can always recover recent work.

---

## If something goes wrong

- **Double-clicking `Workspace.app` does nothing** → right-click it → Open → confirm the security prompt (first run only).
- **"node: command not found" in Terminal** → install Node.js from https://nodejs.org and try again.
- **Browser shows "can't connect to localhost:3000"** → the server didn't start or was stopped. Double-click `Workspace.app` again.
- **Tool shows old data** → hard-refresh the browser (⌘+Shift+R).
- **Port 3000 already in use** → something else is running on the same port. Find and stop it: `lsof -i :3000`.

---

## What's in this folder

```
workspace/
├── README.md              ← you are here
├── CLAUDE.md              ← how Claude should interact with the data (auto-loaded by Cowork)
├── index.html             ← the hub page (with Stop button)
├── plan-and-track.html    ← Plan & Track tool
├── show-and-note.html     ← Show & Note tool
├── context-catchup.html   ← Context Catch-up tool
├── about.html             ← in-app documentation for the tools
├── server.js              ← the local Node.js server
├── Workspace.app          ← double-click this to start
├── data/                  ← your data (JSON + backups + daily snapshots)
├── files/                 ← drop zones (transcripts, calendar, weekly reports, etc.)
└── logs/                  ← server logs
```
