# Architecture

## Responsibility

This plugin presents Learn-Monitor result data in an Arcanum-specific results
and Schatzkammer interface.

## Boundaries

- Source data and authoritative calculations come from the Learn-Monitor
  backend.
- This plugin transforms backend responses into presentation models only.
- It owns its HTML template, CSS, JavaScript, path metadata, and decorative
  assets.
- It must not read or alter the production database directly.
- Deployment into the runtime is a separate, explicitly approved operation.
