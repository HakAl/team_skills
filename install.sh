#!/bin/bash
# Team Skills Installer for Claude Code
# https://github.com/HakAl/team_skills
#
# Usage:
#   curl -sL https://raw.githubusercontent.com/HakAl/team_skills/master/install.sh | bash
#
# Or download and run:
#   chmod +x install.sh && ./install.sh

set -e

REPO="https://github.com/HakAl/team_skills.git"
SKILLS_DIR="${CLAUDE_SKILLS_DIR:-$HOME/.claude/skills}"
TEMP_DIR=$(mktemp -d)
SCRIPT_VERSION="1.0.0"

# Skills to install (directories containing SKILL.md)
SKILLS="team planning-peter nifty-neo research-reba meticulous-matt greenfield-gary grizzly-gabe zen-runner codebase-cleanup"

# Colors (if terminal supports them)
if [ -t 1 ]; then
  RED='\033[0;31m'
  GREEN='\033[0;32m'
  YELLOW='\033[0;33m'
  BLUE='\033[0;34m'
  NC='\033[0m' # No Color
else
  RED=''
  GREEN=''
  YELLOW=''
  BLUE=''
  NC=''
fi

echo ""
echo -e "${BLUE}Team Skills Installer v${SCRIPT_VERSION}${NC}"
echo "======================================"
echo ""

# Check for git
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: git is required but not installed.${NC}"
  exit 1
fi

# Create skills directory if needed
if [ ! -d "$SKILLS_DIR" ]; then
  echo -e "Creating skills directory: ${YELLOW}$SKILLS_DIR${NC}"
  mkdir -p "$SKILLS_DIR"
fi

# Clone repo to temp directory
echo "Fetching latest from GitHub..."
if ! git clone --depth 1 --quiet "$REPO" "$TEMP_DIR/team_skills" 2>/dev/null; then
  echo -e "${RED}Error: Failed to clone repository.${NC}"
  rm -rf "$TEMP_DIR"
  exit 1
fi

echo ""
echo "Installing skills:"

# Copy each skill
installed=0
updated=0
for skill in $SKILLS; do
  if [ -d "$TEMP_DIR/team_skills/$skill" ]; then
    if [ -d "$SKILLS_DIR/$skill" ]; then
      # Update existing
      rm -rf "$SKILLS_DIR/$skill"
      cp -r "$TEMP_DIR/team_skills/$skill" "$SKILLS_DIR/"
      echo -e "  ${GREEN}↻${NC} $skill (updated)"
      updated=$((updated + 1))
    else
      # Fresh install
      cp -r "$TEMP_DIR/team_skills/$skill" "$SKILLS_DIR/"
      echo -e "  ${GREEN}✓${NC} $skill"
      installed=$((installed + 1))
    fi
  fi
done

# Copy TEAM.md only if it doesn't exist (preserve user's protocols)
if [ ! -f "$SKILLS_DIR/TEAM.md" ]; then
  cp "$TEMP_DIR/team_skills/TEAM.md" "$SKILLS_DIR/"
  echo -e "  ${GREEN}✓${NC} TEAM.md"
else
  echo -e "  ${YELLOW}·${NC} TEAM.md (kept existing)"
fi

# Copy .team directory only if it doesn't exist (preserve user's handoff)
if [ ! -d "$SKILLS_DIR/.team" ]; then
  mkdir -p "$SKILLS_DIR/.team"
  cp "$TEMP_DIR/team_skills/.team/changelog.md" "$SKILLS_DIR/.team/" 2>/dev/null || true
  echo -e "  ${GREEN}✓${NC} .team/"
else
  echo -e "  ${YELLOW}·${NC} .team/ (kept existing)"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}Done!${NC} Skills installed to $SKILLS_DIR"
echo ""

if [ $installed -gt 0 ] && [ $updated -eq 0 ]; then
  # Fresh install
  echo "Next steps:"
  echo "  1. Open Claude Code"
  echo "  2. Run: /team genesis"
  echo ""
  echo "This bootstraps the team protocols. Then try:"
  echo "  /team \"your task here\""
elif [ $updated -gt 0 ]; then
  # Update
  echo "Skills updated. Your TEAM.md and .team/ were preserved."
  echo ""
  echo "To see what's new, check:"
  echo "  https://github.com/HakAl/team_skills/releases"
fi

echo ""
echo "Documentation: https://hakal.github.io/team_skills/"
echo "Issues: https://github.com/HakAl/team_skills/issues"
echo ""
