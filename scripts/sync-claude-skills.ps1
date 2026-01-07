# Sync repo-tracked skills/ into Claude Code's project skills directory (.claude/skills/)
$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path | Split-Path -Parent
$src = Join-Path $repoRoot "skills"
$dst = Join-Path $repoRoot ".claude\skills"

if (!(Test-Path $src)) {
  Write-Error "Missing repo skills directory: $src"
}

New-Item -ItemType Directory -Force -Path $dst | Out-Null

# Mirror copy SKILL.md files
Get-ChildItem -Path $src -Directory | ForEach-Object {
  $skillName = $_.Name
  $srcSkill = Join-Path $_.FullName "SKILL.md"
  if (!(Test-Path $srcSkill)) {
    Write-Warning "Skipping $skillName (no SKILL.md)"
    return
  }

  $dstSkillDir = Join-Path $dst $skillName
  New-Item -ItemType Directory -Force -Path $dstSkillDir | Out-Null

  Copy-Item -Force $srcSkill (Join-Path $dstSkillDir "SKILL.md")
  Write-Host "Synced skill: $skillName"
}

Write-Host "Done. Restart Claude Code to reload skills."
