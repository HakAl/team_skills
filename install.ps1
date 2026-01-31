# Team Skills Installer for Claude Code (Windows)
# https://github.com/HakAl/team_skills
#
# Usage:
#   irm https://raw.githubusercontent.com/HakAl/team_skills/master/install.ps1 | iex
#
# Or download and run:
#   .\install.ps1

$ErrorActionPreference = "Stop"

$Repo = "https://github.com/HakAl/team_skills.git"
$SkillsDir = if ($env:CLAUDE_SKILLS_DIR) { $env:CLAUDE_SKILLS_DIR } else { Join-Path $HOME ".claude\skills" }
$TempDir = Join-Path ([System.IO.Path]::GetTempPath()) "team_skills_install_$(Get-Random)"
$ScriptVersion = "1.0.0"

# Skills to install (directories containing SKILL.md)
$Skills = @("team", "planning-peter", "nifty-neo", "research-reba", "meticulous-matt", "greenfield-gary", "grizzly-gabe", "zen-runner", "codebase-cleanup")

Write-Host ""
Write-Host "Team Skills Installer v$ScriptVersion" -ForegroundColor Blue
Write-Host "======================================"
Write-Host ""

# Check for git
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Host "Error: git is required but not installed." -ForegroundColor Red
    exit 1
}

# Create skills directory if needed
if (-not (Test-Path $SkillsDir)) {
    Write-Host "Creating skills directory: " -NoNewline
    Write-Host $SkillsDir -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $SkillsDir -Force | Out-Null
}

# Clone repo to temp directory
Write-Host "Fetching latest from GitHub..."
try {
    git clone --depth 1 --quiet $Repo "$TempDir\team_skills" 2>$null
} catch {
    Write-Host "Error: Failed to clone repository." -ForegroundColor Red
    if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
    exit 1
}

if (-not (Test-Path "$TempDir\team_skills")) {
    Write-Host "Error: Failed to clone repository." -ForegroundColor Red
    if (Test-Path $TempDir) { Remove-Item -Recurse -Force $TempDir }
    exit 1
}

Write-Host ""
Write-Host "Installing skills:"

# Copy each skill
$installed = 0
$updated = 0
foreach ($skill in $Skills) {
    $src = Join-Path "$TempDir\team_skills" $skill
    $dst = Join-Path $SkillsDir $skill
    if (Test-Path $src) {
        if (Test-Path $dst) {
            Remove-Item -Recurse -Force $dst
            Copy-Item -Recurse $src $dst
            Write-Host "  " -NoNewline
            Write-Host "[~]" -ForegroundColor Green -NoNewline
            Write-Host " $skill (updated)"
            $updated++
        } else {
            Copy-Item -Recurse $src $dst
            Write-Host "  " -NoNewline
            Write-Host "[+]" -ForegroundColor Green -NoNewline
            Write-Host " $skill"
            $installed++
        }
    }
}

# Copy TEAM.md to ~/.team/
$TeamDir = Join-Path $HOME ".team"
if (-not (Test-Path $TeamDir)) {
    New-Item -ItemType Directory -Path $TeamDir -Force | Out-Null
}
if (-not (Test-Path "$TeamDir\TEAM.md")) {
    Copy-Item "$TempDir\team_skills\TEAM.md" "$TeamDir\"
    Write-Host "  " -NoNewline
    Write-Host "[+]" -ForegroundColor Green -NoNewline
    Write-Host " ~/.team/TEAM.md"
} else {
    Write-Host "  " -NoNewline
    Write-Host "[.]" -ForegroundColor Yellow -NoNewline
    Write-Host " ~/.team/TEAM.md (kept existing)"
}

# Always update ENVIRONMENT.md
Copy-Item "$TempDir\team_skills\ENVIRONMENT.md" "$SkillsDir\"
Write-Host "  " -NoNewline
Write-Host "[+]" -ForegroundColor Green -NoNewline
Write-Host " ENVIRONMENT.md"

# Copy .team directory only if it doesn't exist
$DotTeamDst = Join-Path $SkillsDir ".team"
if (-not (Test-Path $DotTeamDst)) {
    New-Item -ItemType Directory -Path $DotTeamDst -Force | Out-Null
    $changelog = Join-Path "$TempDir\team_skills" ".team\changelog.md"
    if (Test-Path $changelog) {
        Copy-Item $changelog "$DotTeamDst\"
    }
    Write-Host "  " -NoNewline
    Write-Host "[+]" -ForegroundColor Green -NoNewline
    Write-Host " .team/"
} else {
    Write-Host "  " -NoNewline
    Write-Host "[.]" -ForegroundColor Yellow -NoNewline
    Write-Host " .team/ (kept existing)"
}

# Cleanup
Remove-Item -Recurse -Force $TempDir

Write-Host ""
Write-Host "Done!" -ForegroundColor Green -NoNewline
Write-Host " Skills installed to $SkillsDir"
Write-Host ""

if ($installed -gt 0 -and $updated -eq 0) {
    Write-Host "Next steps:"
    Write-Host "  1. Open Claude Code"
    Write-Host "  2. Run: /team genesis"
    Write-Host ""
    Write-Host "This bootstraps the team protocols. Then try:"
    Write-Host "  /team `"your task here`""
} elseif ($updated -gt 0) {
    Write-Host "Skills updated. Your TEAM.md and .team/ were preserved."
    Write-Host ""
    Write-Host "To see what's new, check:"
    Write-Host "  https://github.com/HakAl/team_skills/releases"
}

Write-Host ""
Write-Host "Documentation: https://hakal.github.io/team_skills/"
Write-Host "Environment:   See ENVIRONMENT.md for recommended MCP servers"
Write-Host "Issues: https://github.com/HakAl/team_skills/issues"
Write-Host ""
