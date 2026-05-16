# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

| Command            | Description                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `pnpm dev`         | Start dev server with RSS feed generation                                                    |
| `pnpm build`       | Full production build: avatar download → Next.js build → RSS feed → sitemap → copy LLM files |
| `pnpm lint`        | Run oxlint                                                                                   |
| `pnpm lint:fix`    | Run oxlint with auto-fix                                                                     |
| `pnpm fmt`         | Format code with oxfmt                                                                       |
| `pnpm fmt:check`   | Check formatting without changes                                                             |
| `pnpm feed`        | Generate Atom RSS feed                                                                       |
| `pnpm clean`       | Remove `.next` and `node_modules`                                                            |
| `pnpm self-update` | Update pnpm version                                                                          |

## Architecture

This is a **Next.js Pages Router** site with ISR (Incremental Static Regeneration) and i18n. It uses **pnpm** as the package manager.

### Directory structure

```
├── pages/          # Next.js pages (Pages Router, not App Router)
│   ├── index.js    # Blog index (homepage)
│   ├── blog/       # Blog post pages ([id].js) and sub-pages
│   ├── notes/      # Notes microblog (MongoDB-backed)
│   ├── tag/        # Tag-filtered blog pages
│   └── api/        # API routes (notes CRUD, ActivityPub, view count, etc.)
├── components/     # Shared React components
├── lib/            # Core logic
│   ├── ssg.mjs     # SSG pipeline: reads markdown posts → remark/rehype rendering
│   ├── markdown-simple.mjs  # Simple remark pipeline (for notes)
│   ├── config.mjs  # Site configuration
│   ├── mongo.js    # MongoDB client
│   ├── notes.js    # Notes CRUD operations (MongoDB)
│   ├── feed.mjs    # Atom RSS feed generation
│   └── locales/    # i18n translation files (en.json, zh.json)
├── posts/          # Markdown blog posts
├── styles/         # Global CSS and Tailwind CSS
└── public/         # Static assets
```

### Key patterns

- **Blog posts**: Markdown files in `posts/`. Filenames use locale suffix (e.g., `post.en.md`, `post.zh.md`). Processed through `lib/ssg.mjs` using remark → rehype pipeline with Shiki for syntax highlighting, GitHub alerts, autolink headings, TOC, embeds, and image layouts.
- **i18n**: Next.js built-in i18n routing with `zh` (default) and `en` locales. Markdown posts use locale suffixes; JS pages use Next.js i18n.
- **Notes**: Lightweight microblog posts stored in MongoDB. Pages at `/notes` with CRUD API at `/api/notes`. Uses `lib/markdown-simple.mjs` for rendering.
- **Comments**: GitHub-based commenting system via `utteranc.es` (configurable in `config.mjs`).
- **Styling**: Tailwind CSS v4 with `@tailwindcss/typography` for prose styling. Dark mode via `next-themes`.
- **Build pipeline**: `pnpm build` orchestrates: download avatars → Next.js build → generate RSS feeds → generate sitemap → copy markdown files for LLM consumption.
- **Config**: Site-wide configuration in `lib/config.mjs` (author info, navigation, feature flags, social links).
- **Linting**: oxlint configured in `.oxlintrc.json`. Formatting with oxfmt per `.oxfmtrc.json`.
- **MongoDB**: Used for notes and ActivityPub data. Connection managed by `lib/mongo.js`.
- **Content visibility**: Markdown posts with `visible: false` in frontmatter are hidden from listings. Notes have a `hidden` flag for the same purpose.

### Dependencies

- **Next.js 16** with Turbopack for development
- **React 19**
- **remark/rehype** ecosystem for markdown rendering
- **MongoDB** driver for database operations
- **Tailwind CSS v4**, **oxlint**, **oxfmt**
