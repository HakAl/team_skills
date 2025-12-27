# Team Status Dashboard
# Displays live team state from TEAM.md, plans, and retros

param(
    [switch]$NoColor,
    [switch]$Json
)

$ErrorActionPreference = "SilentlyContinue"

# Get script directory and project root
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# Paths
$TeamMdPath = Join-Path $ProjectRoot "TEAM.md"
$PlansDir = Join-Path $ScriptDir "plans"
$RetroDir = Join-Path $ScriptDir "retro"

# Colors
function Write-Color {
    param(
        [string]$Text,
        [string]$Color = "White",
        [switch]$NoNewline
    )
    if ($script:NoColor) {
        if ($NoNewline) {
            Write-Host $Text -NoNewline
        } else {
            Write-Host $Text
        }
    } else {
        if ($NoNewline) {
            Write-Host $Text -ForegroundColor $Color -NoNewline
        } else {
            Write-Host $Text -ForegroundColor $Color
        }
    }
}

function Write-Header {
    param([string]$Text)
    $line = "=" * 50
    Write-Host ""
    Write-Color $line "Cyan"
    Write-Color "  $Text" "Cyan"
    Write-Color $line "Cyan"
    Write-Host ""
}

function Write-Section {
    param([string]$Title, [int]$Count = -1)
    $countStr = if ($Count -ge 0) { " ($Count)" } else { "" }
    Write-Color "$Title$countStr" "Yellow"
    Write-Color ("-" * ($Title.Length + $countStr.Length)) "DarkGray"
}

# Parse TEAM.md
function Get-TeamData {
    if (-not (Test-Path $TeamMdPath)) {
        return @{
            Status = "Unknown"
            LastRetro = "Unknown"
            Roster = @()
        }
    }

    $lines = Get-Content $TeamMdPath

    # Extract status
    $status = "Unknown"
    foreach ($line in $lines) {
        if ($line -match '^\*\*Status\*\*:\s*(.+)$') {
            $status = $Matches[1].Trim()
            break
        }
    }

    # Extract last retro
    $lastRetro = "Unknown"
    foreach ($line in $lines) {
        if ($line -match '^\*\*Last Retro\*\*:\s*(.+)$') {
            $lastRetro = $Matches[1].Trim()
            break
        }
    }

    # Extract roster table
    $roster = @()
    $inRoster = $false
    foreach ($line in $lines) {
        if ($line -match '^## The Team') {
            $inRoster = $true
            continue
        }
        if ($inRoster -and $line -match '^---') {
            break
        }
        if ($inRoster -and $line -match '^\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|') {
            $roster += @{
                Skill = $Matches[1]
                Role = $Matches[2].Trim()
                Description = $Matches[3].Trim()
            }
        }
    }

    return @{
        Status = $status
        LastRetro = $lastRetro
        Roster = $roster
    }
}

# Get plans
function Get-Plans {
    $plans = [System.Collections.ArrayList]@()

    # Check plans directory
    if (Test-Path $PlansDir) {
        Get-ChildItem -Path $PlansDir -Filter "*.md" | ForEach-Object {
            $planLines = Get-Content $_.FullName
            $status = "Unknown"

            foreach ($line in $planLines) {
                if ($line -match '^\*\*Status\*\*:\s*(.+)$') {
                    $status = $Matches[1].Trim()
                    break
                }
            }

            [void]$plans.Add(@{
                Name = $_.Name
                Status = $status
                Path = $_.FullName
            })
        }
    }

    # Also check for plans in .team root (like PLAN-*.md)
    Get-ChildItem -Path $ScriptDir -Filter "PLAN-*.md" | ForEach-Object {
        $planLines = Get-Content $_.FullName
        $status = "Unknown"

        foreach ($line in $planLines) {
            if ($line -match '^\*\*Status\*\*:\s*(.+)$') {
                $status = $Matches[1].Trim()
                break
            }
        }

        [void]$plans.Add(@{
            Name = $_.Name
            Status = $status
            Path = $_.FullName
        })
    }

    return $plans
}

# Get retros
function Get-Retros {
    if (-not (Test-Path $RetroDir)) {
        New-Item -ItemType Directory -Path $RetroDir -Force | Out-Null
        return @()
    }

    $retros = @()
    Get-ChildItem -Path $RetroDir -Filter "*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 5 | ForEach-Object {
        $content = Get-Content $_.FullName -Raw
        $date = $_.LastWriteTime.ToString("yyyy-MM-dd")

        # Try to extract title
        $titleMatch = $content | Select-String -Pattern '(?m)^#\s+(.+)'
        $title = if ($titleMatch) { $titleMatch.Matches[0].Groups[1].Value } else { $_.BaseName }

        $retros += @{
            Name = $_.Name
            Title = $title
            Date = $date
        }
    }

    return $retros
}

# JSON output mode
if ($Json) {
    $data = @{
        Team = Get-TeamData
        Plans = Get-Plans
        Retros = Get-Retros
        Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
    }
    $data | ConvertTo-Json -Depth 4
    exit 0
}

# Display dashboard
$teamData = Get-TeamData
$plans = Get-Plans
$retros = Get-Retros

Write-Header "TEAM STATUS DASHBOARD"

# Team status
Write-Color "Status: " "Gray" -NoNewline
Write-Host $teamData.Status -NoNewline
Write-Host ""
Write-Color "Last Retro: " "Gray" -NoNewline
Write-Host $teamData.LastRetro
Write-Host ""

# Roster
Write-Section "ROSTER" $teamData.Roster.Count
if ($teamData.Roster.Count -eq 0) {
    Write-Color "  No roster data found." "DarkGray"
} else {
    foreach ($member in $teamData.Roster) {
        $skill = $member.Skill.PadRight(18)
        $role = $member.Role.PadRight(18)
        Write-Host "  " -NoNewline
        Write-Color $skill "Green" -NoNewline
        Write-Color $role "Magenta" -NoNewline
        Write-Host $member.Description
    }
}
Write-Host ""

# Plans
$planCount = @($plans).Count
Write-Section "ACTIVE PLANS" $planCount
if ($planCount -eq 0) {
    Write-Color "  No plans found." "DarkGray"
} else {
    foreach ($plan in @($plans)) {
        $statusColor = switch -Wildcard ($plan.Status) {
            "*APPROVED*" { "Green" }
            "*READY*" { "Yellow" }
            "*PROGRESS*" { "Cyan" }
            default { "Gray" }
        }
        Write-Host "  * " -NoNewline
        Write-Host $plan.Name -NoNewline
        Write-Host " [" -NoNewline
        Write-Color $plan.Status $statusColor -NoNewline
        Write-Host "]"
    }
}
Write-Host ""

# Retros
$retroCount = @($retros).Count
Write-Section "RECENT RETROS" $retroCount
if ($retroCount -eq 0) {
    Write-Color "  No retros yet." "DarkGray"
} else {
    foreach ($retro in $retros) {
        Write-Host "  * " -NoNewline
        Write-Color $retro.Date "DarkGray" -NoNewline
        Write-Host " - $($retro.Title)"
    }
}
Write-Host ""

# Footer
Write-Color ("-" * 50) "DarkGray"
$timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
Write-Color "LAST UPDATED: $timestamp" "DarkGray"
Write-Host ""
