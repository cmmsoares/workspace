# Workspace · Getting Started

A local productivity workspace. Three tools that run in your browser, backed by a small Node.js server on your computer. No cloud, no accounts, your data stays on your machine. Works on macOS and Windows.

---

## Get the files

1. Go to the repo's **[Releases](https://github.com/cmmsoares/workspace/releases) page**.
2. Under the latest release, download **`workspace.zip`**.
3. Unzip it. You'll get a folder called `workspace`.

---

## What you'll do

1. Put the folder in the right place.
2. Make sure Node.js is installed.
3. Start the workspace.
4. Connect Claude (via Cowork) to the workspace folder.

Total time: ~3 minutes.

---

## Step 1 · Put the folder in the right place

After unzipping, move the `workspace` folder to:

- **macOS:** `~/Documents/claude/workspace` (full path: `/Users/yourname/Documents/claude/workspace`)
- **Windows:** `C:\Users\YourName\Documents\claude\workspace`

If the `claude` folder doesn't exist yet, create it first:

- **macOS:** Open **Finder** → go to **Documents** → right-click → **New Folder** → name it `claude`, then drag the unzipped `workspace` folder into it.
- **Windows:** Open **File Explorer** → go to **Documents** → right-click → **New → Folder** → name it `claude`, then drag the unzipped `workspace` folder into it.

You can put the folder anywhere you like. This location is just a recommendation to keep things tidy.

---

## Step 2 · Check that Node.js is installed

The server runs on Node.js. To check if you already have it:

- **macOS:** Open **Terminal** (⌘+Space → type "Terminal" → Enter).
- **Windows:** Open **PowerShell** (press ⊞ Win → type "PowerShell" → Enter).

Then type:

```
node --version
```

If you see a version number (e.g. `v20.11.0`), you're set. Skip to Step 3.

If you see `command not found` (macOS) or `'node' is not recognized` (Windows), install Node from https://nodejs.org (pick the "LTS" download), then run the check again.

---

## Step 3 (macOS) · Start the workspace

Double-click **`Workspace.app`** inside the workspace folder.

**First-time launch on macOS:** macOS will block the app because it's unsigned. To allow it:

1. Double-click `Workspace.app`. You'll see a warning that it can't be opened.
2. Open **System Settings → Privacy & Security**, scroll to the **Security** section.
3. Click **Open Anyway** next to "Workspace.app was blocked."
4. Double-click `Workspace.app` again and confirm **Open**.

You only do this once. Future launches work with a normal double-click.

Here's what happens:
- A Terminal window opens and starts the server
- Chrome opens automatically at `http://localhost:3000`
- You'll see a hub page with three tools

> **Note:** Keep the Terminal window open in the background. Closing it stops the server. Minimize it if it's in the way.

> **If Terminal shows `Cannot find module '.../server.js'` with an `AppTranslocation` path:** macOS is running the app from a quarantined copy. Fix it once by opening Terminal and running:
> ```
> xattr -dr com.apple.quarantine ~/Documents/claude/workspace
> ```
> Then double-click `Workspace.app` again.

---

## Step 3 (Windows) · Start the workspace

1. Open the `workspace` folder in **File Explorer**.
2. Right-click an empty area inside the folder → **Open in Terminal** (or **Open PowerShell window here** on older Windows versions).
3. In the terminal, run:
   ```
   node server.js
   ```
4. Open your browser and go to **`http://localhost:3000`**.

You'll see the hub page with three tools.

> **Note:** Keep the terminal window open in the background. Closing it stops the server. Minimize it if it's in the way.

---

After the server starts, the first time you open **Plan & Track**, a Welcome modal will ask for your name and role. That's used in your weekly reports.

---

## Step 4 · Connect Claude to your workspace

The browser tools are where you capture and view things. Claude is what makes them run: processing meeting transcripts, writing weekly reports, and building your catch-up list after time off.

Create a Cowork **project** for the workspace. This way the folder is loaded automatically in every chat, so you never have to reselect it.

1. Open **Claude desktop** on your computer.
2. Go to **Cowork → Projects → Create new project**.
3. Name it `Workspace`.
4. When prompted, select the `workspace` folder on your computer.
5. Save the project.

Every new chat you start under this project automatically reads `CLAUDE.md` and has access to the workspace folder — no setup message needed.

**Start your first chat in the project and send:**

> Schedule the tasks for the workspace tools

Claude will check which of the three weekly automations aren't set up yet and offer to schedule them:

- Transcript processing (Mon–Fri afternoon)
- Weekly calendar import (Monday morning)
- Weekly report + rollover (Friday evening)

Accept the ones you want. You can also run any automation manually later by copying its prompt from the **Automations** card inside the Plan & Track tool or the Context Catch-up page and pasting it into Cowork.

> **Tip:** Keep all workspace chats inside this project. If a chat gets long, start a new one in the same project — the folder and `CLAUDE.md` are still loaded automatically.

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

**B) From the terminal window.** Click the terminal window and press `Ctrl+C`.

To start it again: double-click `Workspace.app` (macOS) or re-run `node server.js` in PowerShell (Windows).

---

## Your data

Lives in three JSON files under `data/`:
- `plan-and-track.json`
- `sessions.json`
- `context-catchup.json`

The server keeps 20 rolling backups per file in `data/backups/` and a daily snapshot in `data/vault/`, so you can always recover recent work.

---

## If something goes wrong

**macOS**
- **macOS blocks `Workspace.app` on first launch** → System Settings → Privacy & Security → Security → click **Open Anyway** next to the blocked app.
- **Terminal shows `Cannot find module .../server.js` with an `AppTranslocation` path** → macOS quarantined the app. Run `xattr -dr com.apple.quarantine ~/Documents/claude/workspace` in Terminal, then try again.
- **Port 3000 already in use** → run `lsof -i :3000` to find what's using it, then stop that process.

**Windows**
- **`'node' is not recognized`** → Node.js isn't installed or isn't on PATH. Install it from https://nodejs.org, close and reopen PowerShell, and try again.
- **PowerShell blocks scripts** → you only need to run `node server.js`, which is a binary, not a script. If you still hit an execution-policy error, run PowerShell as Administrator once and execute `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.
- **Windows Firewall prompt** → allow Node.js on Private networks so the browser can reach `localhost:3000`.
- **Port 3000 already in use** → run `netstat -ano | findstr :3000` to find the PID, then `taskkill /PID <pid> /F` to stop it.

**Both**
- **"node: command not found"** → install Node.js from https://nodejs.org and try again.
- **Browser shows "can't connect to localhost:3000"** → the server didn't start or was stopped. Start it again (see Step 3).
- **Tool shows old data** → hard-refresh the browser (⌘+Shift+R on macOS, Ctrl+F5 on Windows).

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
├── Workspace.app          ← double-click this to start (macOS only)
├── data/                  ← your data (JSON + backups + daily snapshots)
├── files/                 ← drop zones (transcripts, calendar, weekly reports, etc.)
└── logs/                  ← server logs
```
