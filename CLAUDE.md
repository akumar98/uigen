# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup       # One-time init: install deps, generate Prisma client, run migrations
npm run dev         # Start dev server (Turbopack)
npm run build       # Production build
npm run start       # Start production server
npm run lint        # ESLint
npm test            # Vitest test suite
npm run db:reset    # Reset SQLite database to initial state
```

All `dev`/`build`/`start` commands inject `NODE_OPTIONS='--require ./node-compat.cjs'` — this removes `localStorage`/`sessionStorage` globals that conflict with Node 25+ SSR.

To run a single test file: `npx vitest run src/path/to/file.test.ts`

## Architecture

UIGen is an AI-powered React component generator. Users describe UI in natural language; Claude generates React code shown in a live preview alongside an editable code view.

### Layers

**API route** (`src/app/api/chat/route.ts`)
Receives messages + serialized virtual file system, streams Claude responses with tool use, saves completed conversations to Prisma.

**AI tools** (`src/lib/ai/`)
- `provider.ts` — Anthropic SDK or MockLanguageModel fallback (no API key needed for dev)
- `generation.tsx` — System prompt instructing Claude to build components
- Tools exposed to Claude: `str_replace_editor` (create/edit files) and `file_manager` (rename/delete)

**Virtual file system** (`src/lib/file-system.ts`)
In-memory file tree; serialized as JSON and round-tripped with each chat request so Claude always sees current file state. Implements `view`, `create`, `str_replace`, `insert`, `undo_edit` commands matching the tool schema.

**JSX transformer** (`src/lib/jsx-transformer.ts`)
Uses `@babel/standalone` to transform JSX → JS, resolves `@/` alias to local blob URLs, builds an import map pointing third-party packages at `esm.sh`, and generates the full preview HTML (React 19 + Tailwind CDN + error boundary).

**React contexts**
- `FileSystemContext` — holds virtual FS state, handles tool call side effects, exposes file CRUD to components
- `ChatContext` — wraps Vercel AI SDK `useChat`, connects to `/api/chat`, feeds tool results back to FS context

**Preview** (`src/components/PreviewFrame.tsx`)
Renders generated components in a sandboxed `<iframe>` using the HTML blob produced by the JSX transformer.

**Auth** (`src/lib/auth/`)
JWT sessions in httpOnly cookies (7-day), bcrypt password hashing, server actions for signUp/signIn/signOut. Middleware (`src/middleware.ts`) guards `/api/projects` and `/api/filesystem`.

**Database** (`prisma/schema.prisma`, SQLite)
`User` → many `Project` (cascade delete). Projects store the full message history and serialized file system as JSON columns.

### Key data flow

```
User message
  → POST /api/chat (messages + serialized FS)
  → Claude streams text + tool calls
  → Tool calls → FileSystemContext updates
  → Completed → saved to Prisma (authenticated)
  → Files → JSX transformer → iframe preview
```

## Environment

Copy `.env.example` to `.env.local` and set:
- `ANTHROPIC_API_KEY` — omit to use the mock model
- `AUTH_SECRET` — any random string for JWT signing
