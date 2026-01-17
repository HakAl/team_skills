# Why I Make Claude Argue With Itself Before Writing Code

I asked Claude to "make my scraper robust." It generated 200 lines of plausible-looking code: retry logic, logging config, pagination handling.

All garbage.

The retry logic used a pattern that didn't match my codebase. The logging config was global (breaking other modules). The pagination had no max-page guard - infinite loop waiting to happen.

The code *looked* professional. It would have passed a cursory review. But it was built on assumptions, not understanding.

## The Problem With "Just Code It"

Here's what happens when you ask AI to code without planning:

1. **It guesses** - No context about your codebase, so it invents patterns
2. **It confirms itself** - One voice, one blind spot. No challenge.
3. **It ships fast** - The first idea becomes the implementation

By the time you catch the issues, you've already committed to a bad approach. Rework is expensive.

## What I Do Instead

I make Claude argue with itself.

Before any code gets written, I force a structured conversation:

```
Me: "Add input validation to the login form"

Peter (Planner): "Here's the approach: validate email format,
check password strength, sanitize inputs before DB..."

Neo (Critic): "What about rate limiting? You're checking format
but not preventing brute force. Also, the existing auth module
already has a sanitize() function - don't reinvent it."

Peter: "Good catch. Revised plan: reuse auth.sanitize(),
add rate limiting at the route level, then validate format..."
```

Only after the plan survives critique does Gary (the builder) write code. And Reba (QA) reviews before it merges.

**Plan. Critique. Build. Validate.**

## Why This Works

It's not magic. It's just structure:

- **Multiple perspectives** catch blind spots one voice misses
- **Planning before coding** prevents the "first idea ships" trap
- **Explicit critique** surfaces assumptions before they become bugs
- **Review before merge** catches what planning missed

This pattern is emerging everywhere. Devin, Cursor's agent mode, serious AI coding workflows - they're all converging on the same structure. Plan before you build.

## The Implementation

I built a set of Claude Code skills that work as a team:

| Role | What They Do |
|------|--------------|
| **Peter** | Plans the approach, identifies risks |
| **Neo** | Challenges the plan, plays devil's advocate |
| **Gary** | Builds from the approved plan |
| **Reba** | Reviews everything before it ships |

They're personas in the same context - not isolated agents. They can hear each other, interrupt, challenge in real-time.

You give them a task:

```
/team "add input validation to login"
```

They figure out the handoffs. Peter plans, Neo critiques, Gary builds, Reba validates. You get code that's been argued over before you even look at it.

## Try It

The skills are open source: [github.com/HakAl/team_skills](https://github.com/HakAl/team_skills)

```bash
git clone https://github.com/HakAl/team_skills.git
cp -r team_skills/* ~/.claude/skills/
```

Then in Claude Code:

```
/team "your task here"
```

Watch them argue. Ship better code.

---

*The team that wrote this post: Peter planned it, Neo said "don't be preachy," Gary wrote it, Reba approved it. Meta, but true.*
