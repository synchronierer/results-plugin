# Testing

The binding local verification command is:

```bash
scripts/check
```

It checks whitespace errors, runs the complete Gradle build and tests, and
prints the final Git status.

A successful build does not authorize a commit, push, or deployment. Visual
changes must additionally be checked in the intended tablet and desktop
layouts with test data only.
