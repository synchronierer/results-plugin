# Testing

The binding local verification command is:

```bash
STUDENT_DATABASE_JAR=/absolute/path/student-database.jar scripts/check
```

It checks whitespace errors, runs the complete Gradle build and tests, and
prints the final Git status. `scripts/build-project`, which is called by the
check, forwards `STUDENT_DATABASE_JAR` as the Gradle property
`studentDatabaseJar`. On the established development server it can detect the
backend JAR automatically. Direct Gradle invocations must pass the property
explicitly, for example:

```bash
./gradlew test \
  -PstudentDatabaseJar=/absolute/path/student-database.jar
```

Gradle configuration fails with a clear message if `studentDatabaseJar` is
not set.

A successful build does not authorize a commit, push, or deployment. Visual
changes must additionally be checked in the intended tablet and desktop
layouts with test data only.
