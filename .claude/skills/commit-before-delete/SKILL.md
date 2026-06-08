---
name: commit-before-delete
description: Snapshot files with a git commit before deleting them, so any deletion is recoverable from history. Use whenever about to delete, remove, or rm one or more tracked files, or right after a file-delete permission is granted.
---

# Commit before delete

When you are about to delete one or more files, create a safety commit first so the
deletion can be undone via git history.

## When to use

- Any time you will run `rm`, a delete tool, or otherwise remove tracked file(s).
- Right after the user grants file-delete permission.
- Before destructive moves/overwrites that effectively discard a file's contents.

Skip the snapshot only when: the target is not a git repo, or the file is untracked /
ignored / a temporary or generated artifact with no value.

## Procedure

1. Confirm you are in a git repo and check what's tracked:
   - `git rev-parse --is-inside-work-tree`
   - `git status --porcelain` and verify the delete target is tracked (`git ls-files <path>`).
2. If the target is tracked, snapshot the current state BEFORE deleting:
   - `git add -A`
   - `git commit -m "chore: snapshot before deleting <path>"`
   - If there is nothing else to stage, committing the current tracked state is still fine — the point is that `<path>` exists in this commit.
3. Delete the file(s).
4. Record the deletion as its own commit:
   - `git add -A`
   - `git commit -m "chore: delete <path>"`

## Recovery

If a deletion needs to be undone, restore from the snapshot commit:
- `git checkout <snapshot-commit> -- <path>` (restore a single file), or
- `git revert <delete-commit>` (undo the delete commit).

## Notes

- Keep snapshot commits small and clearly messaged so history stays readable.
- Never amend or force-push over a snapshot commit — its value is that it preserves the pre-delete state.
- If the working tree has unrelated uncommitted changes, mention that to the user before bundling them into the snapshot commit.
