# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Tenant Forge is a desktop application built with Tauri (Rust backend) and React + TypeScript (frontend). It's a SQL migration management tool that allows executing SQL scripts across multiple PostgreSQL database connections simultaneously.

## Development Commands

### Frontend (Vite + React)
- **Dev server**: `pnpm dev` - Starts Vite dev server on port 1420
- **Build frontend**: `pnpm build` - TypeScript compilation + Vite build
- **Preview build**: `pnpm preview` - Preview production build

### Tauri (Rust + Desktop)
- **Dev mode**: `pnpm tauri dev` - Runs the full Tauri app with hot reload
- **Build app**: `pnpm tauri build` - Creates production desktop application
- **Rust commands**: All Rust/Cargo commands must be run from `src-tauri/` directory

### Database (Docker)
- **Start databases**: `docker-compose up -d` - Starts two PostgreSQL containers
  - Main DB: `localhost:5432` (tenant_forge_1)
  - Secondary DB: `localhost:5433` (tenant_forge_3)
  - Credentials: admin/admin123
- **Stop databases**: `docker-compose down`
- **View logs**: `docker-compose logs -f`

## Architecture

### Frontend Structure (React + TypeScript)
The frontend follows a feature-based organization:

**Core Application Flow**:
- `src/main.tsx` - Entry point, applies system theme detection
- `src/App.tsx` - Root component with HashRouter
- `src/router/AppRouter.tsx` - Route definitions and first-time user detection

**Key Pages**:
- `PresentacionPage` - Onboarding slides shown on first launch
- `ProjectsPage` - Project list and creation (main view after onboarding)
- `ProjectEditorPage` - Split-screen editor (env variables + SQL execution)

**State Management**:
- Uses Tauri's persistent store plugin for cross-session data
- `src/store/storeManagement.ts` - Wrapper around @tauri-apps/plugin-store
- Stores: `isFirstTime` flag, project data

**Important Frontend Patterns**:
- HashRouter (not BrowserRouter) is required for Tauri desktop apps
- All backend calls use `invoke()` from @tauri-apps/api/core
- Theme handling via Tailwind CSS dark mode with system preference detection
- CodeMirror editors for .env and SQL with custom syntax highlighting

### Backend Structure (Rust + Tauri)
The Rust backend is organized around Tauri commands:

**Entry Point**:
- `src-tauri/src/main.rs` - Minimal entry, calls lib.rs
- `src-tauri/src/lib.rs` - Tauri app builder, command registration, SQLite setup

**Project Management**:
- SQLite database (`app.db`) stores project metadata locally
- Commands: `create_proyect`, `get_projects`
- Schema: projects table (id, name, description, tags as JSON)

**SQL Execution System** (`src-tauri/src/commands/sql_execute.rs`):
- `execute_sql` - Async command that runs SQL across multiple PostgreSQL connections
- Uses tokio-postgres for async connection handling
- Supports schema-specific execution via `SET search_path`
- Returns detailed error messages (auth failures, connection refused, etc.)
- Key insight: Executes sequentially (not parallel) to maintain control and logging

**Important Rust Patterns**:
- All Tauri commands must be async and return `Result<T, String>`
- Connection strings built manually (not using URL format)
- Each database connection spawns its own tokio task
- Quote cleaning in frontend before sending to Rust (handles Unicode quotes)

### Data Flow for SQL Execution

1. User enters .env format connection strings in left editor
2. Frontend parses env content into `DatabaseConnection[]` objects
3. User writes SQL in right editor and selects which connections to use
4. Frontend invokes `execute_sql` command with SQL + filtered connections
5. Rust backend:
   - Connects to each database sequentially
   - Sets schema if specified
   - Executes SQL
   - Returns results array with success/failure per connection
6. Frontend displays results below SQL editor with color-coded status

### Project Editor Components

**EnvEditor** (`src/components/project-editor/EnvEditor.tsx`):
- CodeMirror-based editor for .env format
- Custom parser (`envParser.ts`) extracts DatabaseConnection objects
- Detects: DB_TYPE, DB_HOST, DB_NAME, DB_SCHEMA, DB_USER, DB_PASSWORD, DB_PORT
- ID generated from host + db name
- "Confirm" button triggers connection detection

**SqlEditor** (`src/components/project-editor/SqlEditor.tsx`):
- CodeMirror with PostgreSQL syntax highlighting
- Displays ConnectionChip components for each detected connection
- User can select/deselect connections before execution
- Shows execution results (SqlExecutionResults.tsx) below editor

**ConnectionsPanel** (`src/components/project-editor/ConnectionsPanel.tsx`):
- Displays all detected connections with selection state
- Visual feedback for execution status per connection

## Important Development Notes

### Tauri Commands
- Command names in Rust use snake_case, but called as-is from TypeScript
- The library name in Cargo.toml is `migrations_controlnext_app_lib` (legacy naming)
- Always register new commands in `lib.rs` invoke_handler

### Environment Variables
- The .env editor is NOT for application config - it's user-facing content
- Each project has its own env content stored separately
- Env format is parsed, not loaded as actual environment variables

### PostgreSQL Connection Handling
- Schema support via search_path (critical for multi-tenant databases)
- Connection string format: "host=X port=X user=X password=X dbname=X"
- NoTls used (not production-ready, assumes local dev)

### Styling & UI
- Tailwind CSS 4.x with CSS variables for theming
- shadcn/ui components in `src/components/ui/`
- Radix UI primitives (Accordion, Tooltip)
- Motion library for animations
- Dark mode follows system preference automatically

### Store Management
- Store file persists to disk (Tauri handles path)
- Operations are async and must be awaited
- Common keys: "isFirstTime", project-specific settings

## Testing & Validation

Currently no automated tests configured. To verify functionality:

1. Start databases: `docker-compose up -d`
2. Start dev server: `pnpm tauri dev`
3. Test SQL execution against both database connections
4. Check Rust console logs for detailed execution trace

## Common Issues

**Quote Handling**: 
The frontend has a `cleanQuotes()` function in ProjectEditor.tsx because env parsers may introduce Unicode quotes. This is applied before sending to Rust.

**Connection Failures**:
Check Docker containers are running. The Rust backend provides specific error messages for auth failures vs connection refused vs missing database.

**Hot Reload**:
Frontend hot reloads via Vite. Rust changes require stopping and restarting `pnpm tauri dev`.

## Package Manager

This project uses **pnpm** exclusively. Lock file is `pnpm-lock.yaml`.
