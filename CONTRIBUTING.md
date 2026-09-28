# Contributing to Embed Generator

Thanks for helping out! To keep reviews fast, please follow these rules. PRs that don't will get closed or sent back without a detailed review.

## Before you start

- You don't need permission to start, but not every feature will be accepted. If you're unsure whether something is wanted, open an issue and ask first.
- Keep each PR to one feature or fix.
- Check that the feature doesn't already exist.

## Writing the code

[AGENTS.md](./AGENTS.md) describes the repo layout, the checks, and the rules the code has to follow. Read it, and if you use an AI coding tool, make sure it reads it too.

Using AI tools is fine, but you're responsible for the result. You should be able to explain every line of your PR. If you can't, it's not ready.

## Before opening a PR

- All checks in [AGENTS.md](./AGENTS.md#checks) pass locally. CI runs the same checks and a PR with failing CI won't be reviewed.
- Generated files (`wire.ts`, `pgmodel`) were regenerated, not edited.
- The diff contains nothing unrelated to the change.
- The PR description says what the change does and includes a screenshot or video of it working.

If a review asks for changes and there's no update for two weeks, the PR will be closed. You can always reopen it once it's ready.
