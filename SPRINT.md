# ARC-CODEX-1B — Portable Results-Plugin build

## Goal

Remove the machine-specific backend JAR path from `build.gradle.kts` while
preserving the currently working plugin behavior.

## Tasks

1. Read `AGENTS.md`, `CODING_RULES.md`, and the documents under `docs/`.
2. Inspect the current Gradle configuration and compare its dependency handling
   with the established frontend plugin pattern.
3. Make `build.gradle.kts` honor the Gradle property `studentDatabaseJar`.
4. Remove the absolute `/home/lo/.../student-database.jar` path from the build
   file.
5. Keep a Maven dependency fallback only if the repository evidence supports
   its coordinates and version; otherwise fail with a clear configuration
   message when no local JAR is supplied.
6. Update the development/testing documentation to match the implemented
   behavior.
7. Run `scripts/check`.
8. Do not change Schatzkammer behavior, coin calculations, grading thresholds,
   visual design, runtime files, or services.
9. Do not commit or push.

## Completion report

Report changed files, commands executed, build/test results, and remaining
risks.
