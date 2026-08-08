# Development

## Requirements

- Linux
- Git
- Java 17
- the repository Gradle wrapper
- Codex CLI for the optional local agent workflow

## Start the Codex workflow

From the repository root:

```bash
./dev
```

Use a new session for a new sprint and the resume option only for the same
repository and task. Codex is started with repository-scoped workspace write
access. Project instructions are defined in `AGENTS.md`.

## Build dependency

The build requires a local Learn-Monitor backend JAR. Pass its absolute path
to Gradle with the `studentDatabaseJar` property:

```bash
./gradlew build \
  -PstudentDatabaseJar=/absolute/path/student-database.jar
```

The same configured JAR is used for the `compileOnly` and `runtimeOnly`
configurations. Gradle configuration fails with a clear message when the
property is missing; there is no Maven dependency fallback.

The project build script accepts the path via an environment variable and
forwards it as the Gradle property:

```bash
STUDENT_DATABASE_JAR=/absolute/path/student-database.jar scripts/build-project
```

On the current development server, `scripts/build-project` can detect the
established backend JAR location. It may read that JAR as a build dependency
but must not write to the runtime directory.

## Routine commands

```bash
scripts/status
scripts/build-project
scripts/check
```

## Automatic sprint handoff

After `SPRINT.md` has been prepared, run:

```bash
scripts/codex-sprint
```

For the first workflow commit in a repository that still contains the
untracked bootstrap files, use:

```bash
scripts/codex-sprint --bootstrap
```

The runner creates an isolated `codex/<sprint-id>` branch, runs Codex
non-interactively, repeats the project checks outside the Codex sandbox,
creates a signed report commit, and pushes only that sprint branch. Merge and
deployment remain separate approval steps.

## Runner safety behavior

The sprint runner verifies the repository remote and accepts only the explicitly
approved base branch for that repository. It blocks common secret, credential,
database, key, runtime, Gradle-output, build-output, and symlink additions
before committing.

After a successful normal sprint it returns to the approved base branch. During
the one-time `--bootstrap` run it remains on the sprint branch until that
workflow PR has been reviewed and merged.
