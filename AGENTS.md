# AGENTS.md

## Scope

This repository contains the optional Arcanum results plugin, including the
student results view and Schatzkammer presentation. It is not the Learn-Monitor
backend and not the complete school-specific frontend.

## Mandatory boundaries

- Work only inside this repository.
- The only permitted outside-repository read is a configured
  `student-database.jar` used as a compile dependency.
- Never read, copy, alter, or inspect production databases, keystores, keys,
  credentials, backups, logs containing student data, or other real school
  data.
- Never write into a runtime directory or replace a deployed JAR.
- Never start, stop, or restart the production service.
- Never commit, push, create branches, merge, rebase, tag, or deploy unless the
  user explicitly authorizes that exact action.
- Before editing, run `git status --short --branch`.
- Do not discard or overwrite pre-existing user changes.

## Domain and architecture

- Do not recreate backend business logic in the plugin.
- Use existing Learn-Monitor routes and data contracts.
- The semester scale is based on a maximum of 100 coins. Do not change grading
  thresholds, coin calculations, or task semantics without an explicit product
  decision and supporting tests.
- Open/unearned coins must remain visually distinct from earned coins.
- Animations may reveal earned coins only and must not change calculated data.
- Preserve existing Arcanum terminology and the Schatzkammer design.
- Dynamic student data must not be baked into image assets.

## Quality

- Keep changes focused and auditable.
- Update documentation when behavior or architecture changes.
- Run `scripts/check` before reporting completion.
- Do not weaken checks to make a failing change pass.
- In the final report, list changed files, checks run, results, and remaining
  risks. Do not claim deployment or GitHub publication unless it actually
  happened.

## Automated sprint handoff

- Codex itself must not perform Git write operations.
- Only `scripts/codex-sprint` may create and push branches matching
  `codex/<sprint-id>`.
- These branches are review branches only. The runner must never merge into the
  working branch, deploy artifacts, alter runtime data, or restart services.
- Signed commits and pushes made by the runner are authorized only for those
  isolated sprint branches.
