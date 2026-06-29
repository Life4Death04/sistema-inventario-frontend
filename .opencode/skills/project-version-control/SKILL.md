---
name: project-version-control
description: "Trigger: git, commit, branch, pr, versionado, control de versiones, issue, reviewer, chain. Use when working on repository organization, commit strategy, branch naming, PR slicing, issue-first workflow, or human-facing review comments in this project."
license: Apache-2.0
metadata:
  author: OpenCode
  version: "1.0"
---

## Purpose

This project-local skill adapts the global skills `work-unit-commits`, `chained-pr`, `branch-pr`, `issue-creation`, and `comment-writer` to the inventory frontend project.

Use it whenever the work touches git workflow, commit planning, branch naming, PR preparation, issue linkage, or review communication.

## Active Rules For This Project

1. Prefer one commit per deliverable work unit.
2. Use Conventional Commits.
3. Use branch names in the form `type/description` once the repo starts using branches.
4. If a future PR exceeds roughly 400 changed lines, split it into chained or stacked slices.
5. Use concise human comments for PRs, issues, and review notes.

## Commit Rules

- Required format: `type(scope): description` or `type: description`
- Allowed types: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`, `build`, `ci`, `perf`, `revert`
- Prefer outcome-focused messages, not file lists.

Examples:

- `feat(products): add TanStack catalog table`
- `fix(layout): hide mobile shell on downward scroll`
- `chore(repo): initialize version control workflow`

## Branch Rules

When branches are used, follow:

- `feat/<description>`
- `fix/<description>`
- `chore/<description>`
- `refactor/<description>`

Descriptions must be lowercase and use only `a-z0-9._-`.

## PR Sizing Rules

- Up to 400 changed lines: one focused PR is acceptable.
- Over 400 changed lines: split unless the user explicitly accepts a larger review unit.
- Keep tests and docs with the behavior they verify.

## GitHub Workflow Rules

These become active once the repo is connected to GitHub:

1. Create or reuse an approved issue before opening a PR.
2. Link the PR to the issue.
3. Add exactly one PR type label.
4. Use `comment-writer` tone for review-facing text.

## Local Bootstrap Exception

Before GitHub exists for this repo, the initial local commit is allowed without:

- issue linkage
- PR labels
- chain metadata

But it still must use:

- a clean worktree scope
- a conventional commit message
- a coherent work-unit boundary

## Suggested Workflow

1. Group work into a single reviewable unit.
2. Run build/tests before committing.
3. Inspect `git status`, `git diff`, and recent commit style.
4. Create the commit with a conventional message.
5. Once GitHub is configured, switch to issue-first and PR slicing rules.

## Skills To Pair

- `work-unit-commits` for commit planning
- `chained-pr` for oversized changes
- `branch-pr` for PR creation discipline
- `issue-creation` for issue-first workflow
- `comment-writer` for PR and issue text
