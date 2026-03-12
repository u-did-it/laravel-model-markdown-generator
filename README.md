# Laravel Model Markdown Generator

Laravel Model Markdown Generator helps you document older Laravel projects by scanning models and migrations and turning them into readable Markdown. The generated documentation makes it easier for developers, AI agents, and code assistants to understand table structure, foreign keys, and model relationships without manually tracing the entire codebase.

## What It Does

- Scans `app/Models` recursively for Laravel model classes.
- Scans `database/migrations` recursively for table definitions.
- Extracts table columns from `Schema::create(...)` migrations.
- Extracts foreign keys defined with the standard Laravel `foreign(...)->references(...)->on(...)` syntax.
- Detects common Eloquent relationships such as `hasOne`, `hasMany`, `belongsTo`, `belongsToMany`, `morphTo`, `morphOne`, and `morphMany`.
- Opens a generated Markdown document directly in VS Code.

## Command

Open the Command Palette and run:

`Laravel: Generate Model Relationships Markdown`

The extension analyzes the currently opened Laravel workspace and opens a Markdown document containing:

- tables
- columns
- foreign keys
- detected Eloquent relationships

## Expected Laravel Structure

The current version expects a conventional Laravel project layout:

- `artisan` at the workspace root
- models inside `app/Models`
- migrations inside `database/migrations`

If the workspace is not recognized as a Laravel project, the command stops and shows an error.

## Example Output

```md
# Database Documentation

## Table: posts

### Columns

- id (id)
- user_id (foreignId)
- title (string)

### Foreign Keys

- user_id -> users.id

### Eloquent Relationships

- belongsTo -> User
```

## Current Limitations

This extension is intentionally lightweight. At the moment it:

- assumes model table names using a simple pluralization strategy like `Post -> posts`
- does not evaluate custom `$table`, guarded models, or advanced pluralization rules
- reads migrations based on `Schema::create(...)` and standard foreign key syntax only
- opens the generated Markdown in an editor instead of automatically saving a physical `.md` file

## Why Use It

- useful for onboarding into an existing Laravel codebase
- helps visualize how tables connect without opening every model and migration
- provides a lightweight documentation starting point you can copy into project docs

## Release Notes

### 0.0.1

Initial public release.

## Contributing

Issues and improvements are welcome. If you find a relationship pattern or migration syntax that is not detected yet, open an issue with a minimal Laravel example so support can be added safely.
