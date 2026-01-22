# Bot Menu — Interactive Entry Point

You are presenting an interactive menu for the Claude Repo Bot. This skill serves as the main entry point for all bot operations.

## First: Check and Display Last Action

Before showing the menu, read the last action file to inform the user:

1. Check if `.claude/bot-last-action.json` exists
2. If it exists, read it and display:
   ```
   Last action: [ACTION_NAME]
   Run at: [TIMESTAMP]
   Result: [SUCCESS/FAILED/IN_PROGRESS]
   ```
3. If the last action was recent (within 1 hour) and successful, warn the user before they repeat it.

## Then: Present the Menu

Ask the user what they'd like to do using AskUserQuestion with these options:

### Primary Actions
| Option | Description |
|--------|-------------|
| **Discover Issues** | Scan codebase for bugs, improvements, and tech debt. Creates GitHub issues. |
| **Fix Issues** | Pick queued issues and create fix PRs automatically. |
| **Run Verification** | Run smoke/verify checks on the codebase. |
| **Triage Issues** | Review and label/prioritize open issues. |
| **Daily Report** | Generate a summary of bot activity. |

### When User Selects an Action

1. **Update the last action file** BEFORE running:
   ```json
   {
     "action": "discover",
     "started_at": "2024-01-22T12:00:00Z",
     "status": "in_progress"
   }
   ```

2. **Execute the selected action** by invoking the appropriate skill or command:
   - Discover → Run: `python scripts/claude-bot/bot.py discover`
   - Fix Issues → Run: `python scripts/claude-bot/bot.py fix all`
   - Verification → Run: `python scripts/claude-bot/bot.py run-verify`
   - Triage → Invoke skill: `/bot-triage`
   - Daily Report → Invoke skill: `/bot-daily-report`

3. **Update the last action file** AFTER completion:
   ```json
   {
     "action": "discover",
     "started_at": "2024-01-22T12:00:00Z",
     "completed_at": "2024-01-22T12:05:00Z",
     "status": "success",
     "summary": "Found 3 issues, created 3 GitHub issues"
   }
   ```

## Last Action File Format

Location: `.claude/bot-last-action.json`

```json
{
  "action": "discover|fix|verify|triage|report",
  "started_at": "ISO8601 timestamp",
  "completed_at": "ISO8601 timestamp or null",
  "status": "in_progress|success|failed",
  "summary": "Brief description of what happened"
}
```

## Safety Checks

Before running any action:
1. If the same action is already "in_progress", ask user to confirm (previous run may have crashed)
2. If the same action completed successfully within the last 30 minutes, warn and ask to confirm
3. For "fix" actions, remind user this will create PRs

## Example Flow

```
📋 Bot Menu

Last action: Discover Issues
  Run at: 2024-01-22 11:45 AM (15 minutes ago)
  Result: Success - Found 3 issues

⚠️  You ran "Discover Issues" recently. Running again may create duplicate issues.

What would you like to do?
○ Discover Issues - Scan for bugs and improvements
○ Fix Issues - Create PRs for queued issues
○ Run Verification - Run smoke/verify checks
○ Triage Issues - Label and prioritize issues
○ Daily Report - Summarize bot activity
```
