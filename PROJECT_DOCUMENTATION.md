# CodeDropz — Complete Project Documentation

**Tagline:** Paste. Generate. Share.
**Live Application:** https://codedropz.vercel.app
**Source Code:** https://github.com/LeviHQ/codedropz

---

## 1. Abstract

CodeDropz is a web application that lets a person move code, text, or files from one
device to another in seconds — without creating an account, without installing an app,
and without sending anything through chat apps or email.

The sender pastes their content (or picks files/folders), chooses how long it should
live and how many times it may be opened, and receives a short share code. The receiver
types that code on any other device and instantly gets the content, with the option to
copy it, download it as a text file, or download everything as a ZIP archive. Once the
content expires or its access limit is reached, it is permanently deleted from the
server automatically.

---

## 2. Problem Statement

Transferring a snippet of code or a few files between a laptop and a phone (or between
a lab computer and a personal machine) is unnecessarily painful today:

| Common approach | Problem |
| --- | --- |
| WhatsApp / Telegram to self | Breaks code formatting, adds line wraps, stores content forever |
| Email to self | Slow, cluttered, requires login on both devices |
| GitHub Gist / Pastebin | Requires an account, content stays public/permanent |
| USB drive / cable | Not always available, no phone support |
| Cloud drives | Heavy login flow, overkill for a 20-line snippet |
| AirDrop / Nearby Share | Platform-locked (Apple-only / Android-only) |

The gap: there is no *fast, login-free, self-destructing, cross-platform* way to move a
snippet or a small set of files between two devices.

---

## 3. Proposed Solution

CodeDropz solves the problem with a **code-based, expiring drop**:

1. **Sender** opens the site, pastes text or attaches files/folders.
2. Sender picks an **expiry** (10 min, 30 min, 1 hour, 1 day, 7 days, 1 month) and an
   **access limit** (1, 5, 10, or a custom number).
3. Sender optionally picks a **custom code** (4–12 letters/numbers) instead of a random
   one.
4. The app stores the drop and returns a **6-character share code** plus a direct link
   (`/r/CODE`) and a QR code.
5. **Receiver** enters the code (or scans/opens the link) on any device and sees the
   content immediately, with Copy / Download TXT / Download ZIP actions.
6. **Auto-destruct**: when the access limit is used up or the expiry passes, the record
   and its uploaded files are deleted server-side. Nothing lingers.

### Key design principles

- **Zero friction** — no signup, no email, no verification.
- **Ephemeral by default** — every drop has a hard lifetime.
- **Universal** — works in any modern browser on any OS.
- **Correctness of code text** — monospace editor, no auto-formatting, no wrapping loss.

---

## 4. Feature List

### Core features
- Paste-and-share text/code of any language
- Random 6-character share code (unambiguous alphabet — no `0/O`, `1/I` confusion)
- Custom share code option (4–12 uppercase letters/digits)
- Expiry presets: 10 minutes, 30 minutes, 1 hour, 1 day, 7 days, 1 month
- Access limits: 1, 5, 10, or a manual number
- File upload (multiple files) and **whole folder** upload with folder structure preserved
- Receiver page at `/r/<CODE>` — shareable direct link
- QR code for the share link (instant phone pickup)
- Copy to clipboard, Download as `.txt`, Download all as `.zip` (folder paths preserved)
- Live "remaining views" and "expires in" indicators
- Automatic deletion on expiry or on last allowed access
- Hourly background cleanup of expired rows

### UX / interface features
- Dark theme by default, light theme supported
- Seven selectable accent colours (default: orange)
- No theme "flash" on first paint (blocking theme script in the document head)
- Glassmorphism surfaces, subtle motion, premium typography
- Fully responsive: mobile, tablet, desktop
- Toast notifications for every action and error
- Landing page: sticky navbar, animated hero, comparison section, live product demo,
  features grid, audience section, how-it-works timeline, FAQ accordion, footer

### SEO / production features
- Per-route title, description, Open Graph and Twitter metadata
- JSON-LD structured data (`SoftwareApplication`)
- Canonical URLs, `robots.txt`, `sitemap.xml`
- Google Search Console verification tag
- Custom favicon/logo

---

## 5. Technology Stack

### Frontend
| Technology | Purpose |
| --- | --- |
| **React 19** | UI library |
| **TypeScript 5.8** | Type-safe application code |
| **TanStack Start / TanStack Router v1** | Full-stack React framework, file-based routing, SSR |
| **Vite** | Build tool and dev server (HMR) |
| **Tailwind CSS v4** | Utility-first styling via CSS theme variables |
| **shadcn/ui + Radix UI** | Accessible component primitives (accordion, dialog, select, tabs…) |
| **lucide-react** | Icon set |
| **sonner** | Toast notifications |
| **jszip** | Client-side ZIP creation for "Download all" |
| **qrcode** | QR generation for share links |
| **zod** | Input/schema validation |

### Backend (Lovable Cloud — managed PostgreSQL platform)
| Technology | Purpose |
| --- | --- |
| **PostgreSQL** | Stores share records |
| **Row Level Security (RLS)** | Restricts what anonymous clients may read/write |
| **PL/pgSQL functions** | Atomic retrieval + access accounting + auto-delete |
| **Object Storage bucket** (`share-files`) | Stores uploaded files/folders |
| **Scheduled job (hourly)** | Cleans up expired shares |

### Hosting / DevOps
| Item | Detail |
| --- | --- |
| Frontend hosting | **Vercel** — https://codedropz.vercel.app |
| Source control | **GitHub** — https://github.com/LeviHQ/codedropz |
| Backend hosting | Managed cloud Postgres + storage |
| Environment config | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID` (publishable, browser-safe values) |

---

## 6. System Architecture

```text
                +---------------------------+
                |        SENDER DEVICE      |
                |  Browser (React 19 SPA)   |
                +-------------+-------------+
                              |
        1. upload files -->   |   2. insert share row
                              v
        +---------------------------------------------+
        |            CLOUD BACKEND                    |
        |                                             |
        |  Object Storage           PostgreSQL        |
        |  bucket: share-files      table: shares     |
        |  path: <CODE>/<relpath>   (RLS enabled)     |
        |                                             |
        |  Functions:                                 |
        |   - retrieve_share(code)  [atomic]          |
        |   - cleanup_expired_shares()  [hourly]      |
        +---------------------------------------------+
                              ^
        3. rpc retrieve_share |   4. content + file list
                              |
                +-------------+-------------+
                |      RECEIVER DEVICE      |
                |  /r/<CODE> receive page   |
                |  Copy / TXT / ZIP         |
                +---------------------------+
```

### Request flow — creating a share
1. Client validates the input (content present or files present, valid expiry/limit,
   valid custom code shape).
2. If files exist, each file is uploaded to storage under `<CODE>/<relative path>`; the
   folder structure is captured from the browser's `webkitRelativePath`.
3. A row is inserted into `shares` with `code`, `content`, `expires_at`,
   `access_limit`, and a `files` JSONB array of `{path, storagePath, size, type}`.
4. On a code collision (unique-key violation) a random code is regenerated and retried
   (up to 5 attempts). For a custom code, the user is told the code is taken.
5. If insertion fails, already-uploaded files are rolled back (deleted) so no orphans
   remain.

### Request flow — retrieving a share
1. The receive page calls the database function `retrieve_share(code)`.
2. Inside a single transaction the function:
   - locks the row (`SELECT ... FOR UPDATE`) so two simultaneous readers cannot both
     over-consume the limit,
   - returns `expired` if `now() > expires_at`,
   - returns `exhausted` if `access_count >= access_limit`,
   - otherwise increments `access_count`, and **deletes the row when this was the last
     permitted access**,
   - returns `{ok, content, files, remaining, expires_at, reason}`.
3. The client renders the snippet and the file list, offering copy/download actions.
4. Individual file downloads and ZIP downloads stream from object storage; the ZIP is
   assembled in the browser with jszip so folder paths are preserved.

---

## 7. Database Design

### Table: `public.shares`
| Column | Type | Notes |
| --- | --- | --- |
| `code` | `text` **PK** | Share code (random 6-char or custom 4–12) |
| `content` | `text` | Pasted text/code (may be empty when only files) |
| `files` | `jsonb` | Array of file metadata: `path`, `storagePath`, `size`, `type` |
| `expires_at` | `timestamptz` | Hard expiry timestamp |
| `access_limit` | `integer` | Maximum allowed retrievals |
| `access_count` | `integer` | Retrievals used so far (default 0) |
| `created_at` | `timestamptz` | Creation time (default `now()`) |
| `sender_token` | `text` | Opaque token issued to the creator |

### Functions
- `retrieve_share(_code text)` — atomic read + access accounting + auto-delete
  (`SECURITY DEFINER`, so anonymous clients can never read rows directly).
- `cleanup_expired_shares()` — deletes rows past `expires_at`; runs hourly.

### Security model
- RLS is enabled on `shares`; anonymous clients may **insert** a share but cannot freely
  `SELECT` rows — reads only happen through `retrieve_share`, which enforces expiry and
  the access limit. So a code cannot be brute-force enumerated into readable data
  without consuming the limit.
- The storage bucket holds files under a code-namespaced prefix; access requires knowing
  the exact storage path returned by `retrieve_share`.
- Only publishable (browser-safe) keys ship to the client. No secret/service key is used
  in frontend code.
- The code alphabet excludes visually ambiguous characters, reducing mistyped-code hits.

---

## 8. Project Structure

```text
codedropz/
├─ public/
│  ├─ favicon.png            # CodeDropz logo
│  ├─ robots.txt             # crawler rules
│  └─ sitemap.xml            # indexed URLs
├─ src/
│  ├─ routes/
│  │  ├─ __root.tsx          # app shell: theme script, global meta, toaster
│  │  ├─ index.tsx           # landing page + product app + page SEO/JSON-LD
│  │  └─ r.$code.tsx         # receive page: /r/<CODE>
│  ├─ components/site/
│  │  ├─ Navbar.tsx          # sticky nav + theme controls
│  │  ├─ Hero.tsx            # headline + CTA
│  │  ├─ HeroDeviceArt.tsx   # animated two-device illustration
│  │  ├─ WhyCodeDrop.tsx     # comparison vs chat/email/gist
│  │  ├─ ProductApp.tsx      # the working MVP: Send / Receive flows
│  │  ├─ Features.tsx        # feature grid
│  │  ├─ WhoFor.tsx          # target audience
│  │  ├─ HowItWorks.tsx      # 6-step timeline
│  │  ├─ FAQ.tsx             # accordion
│  │  ├─ Footer.tsx
│  │  ├─ Logo.tsx            # custom SVG logo
│  │  └─ ThemeControls.tsx   # dark/light + 7 accent colours
│  ├─ components/ui/         # shadcn/ui primitives
│  ├─ lib/
│  │  ├─ share-store.ts      # createShare / retrieveShare / uploads / downloads
│  │  ├─ theme.tsx           # theme provider + persistence
│  │  └─ utils.ts
│  ├─ integrations/supabase/ # generated database client + types
│  └─ styles.css             # Tailwind v4 theme tokens, accent palettes
├─ supabase/migrations/      # SQL: table, RLS, functions, storage policies
├─ package.json
└─ vite.config.ts
```

### Important modules
- **`src/lib/share-store.ts`** — the whole data layer: code generation, custom-code
  validation (`/^[A-Z0-9]{4,12}$/`), file upload with rollback, share creation with
  collision retry, retrieval, single-file download, and share-link building.
- **`src/components/site/ProductApp.tsx`** — the interactive send/receive UI: editor,
  file/folder pickers with size limits, expiry and access-limit selectors, random vs
  custom code toggle, generated-code card with copy/QR/link.
- **`src/routes/r.$code.tsx`** — receive page: fetches the share on mount, shows
  expiry/remaining info bar, action buttons above the snippet, file list with per-file
  and ZIP downloads, plus friendly not-found / expired / exhausted states.

---

## 9. Constraints and Limits

| Limit | Value |
| --- | --- |
| Max size per uploaded file | 25 MB |
| Max total upload per share | 100 MB |
| Share code length | 6 (random) / 4–12 (custom) |
| Expiry options | 10 min, 30 min, 1 h, 1 day, 7 days, 1 month |
| Access limit options | 1, 5, 10, or manual (up to 999) |

---

## 10. Testing and Validation

The following were verified end-to-end during development:

- Creating a text-only share and retrieving it on a second browser context.
- Creating a share with multiple files and a folder; verifying folder paths survive the
  ZIP download.
- Access-limit enforcement: a 1-access share becomes unavailable ("exhausted") after the
  first retrieval and the row is deleted.
- Expiry enforcement: a past-expiry share reports "expired" and is removed by cleanup.
- Custom code acceptance, normalisation (lowercase → uppercase, symbols stripped), and
  the "code already in use" error path.
- Concurrent retrieval safety through row locking inside `retrieve_share`.
- Theme persistence and no colour flash on hard refresh.
- Responsive layout checks on mobile, tablet and desktop widths.
- Browser automation (Playwright) checks of the send flow, the receive page render, and
  the placement of the Copy / Download buttons above the snippet.

---

## 11. How to Run Locally

```bash
# 1. Clone
git clone https://github.com/LeviHQ/codedropz
cd codedropz

# 2. Install dependencies (npm, pnpm or bun)
npm install

# 3. Configure environment variables in a .env file
VITE_SUPABASE_URL=<your project url>
VITE_SUPABASE_PUBLISHABLE_KEY=<your publishable key>
VITE_SUPABASE_PROJECT_ID=<your project id>

# 4. Start the dev server
npm run dev          # http://localhost:8080

# 5. Production build
npm run build
```

Deployment: the GitHub repository is connected to Vercel; pushing to the default branch
triggers a build and deploy. The same environment variables must be set in the Vercel
project settings.

---

## 12. Development Journey (what changed and why)

1. **v0 — Landing page + mock MVP.** The full marketing site plus a working send/receive
   flow backed by browser `localStorage`. Good for a demo, but shares never actually
   left the device, so real cross-device sharing was impossible.
2. **Design refinements.** Dark + orange set as the default theme; a blocking theme
   script added to eliminate the first-paint colour flash; share codes standardised to
   6 characters everywhere in the copy and illustrations.
3. **Real backend.** Migrated to managed PostgreSQL: `shares` table, RLS, the atomic
   `retrieve_share` function, and an hourly cleanup job. Shares became genuinely
   cross-device and self-destructing.
4. **File and folder sharing.** First attempt merged file text into the editor, which was
   wrong; reworked into true object-storage uploads with metadata, per-file downloads,
   and folder-preserving ZIP downloads.
5. **Expiry expansion.** Replaced the free-form custom expiry with well-tested presets
   including 1 day, 7 days and 1 month.
6. **Custom codes.** Added a Random/Custom toggle so a user can choose a memorable code,
   with validation and a clear "already in use" message.
7. **Scope trimming.** An admin database panel and a sender-side delete button were built
   and then deliberately removed to keep the product focused and login-free.
8. **UX fix.** Copy / Download TXT / Download ZIP moved above the scrollable snippet so
   no scrolling is needed, and a receive-page loading bug (a stale-effect guard that
   blocked the second run) was fixed.
9. **SEO and launch.** Metadata, JSON-LD, canonical URLs, `robots.txt`, `sitemap.xml`,
   Search Console verification, favicon; deployed to Vercel.

---

## 13. Limitations

- Content is not end-to-end encrypted; it is protected by obscurity of the code, the
  access limit, and the expiry. A future version can encrypt in the browser.
- No password-protected shares yet.
- No sender-side history or revoke (removed intentionally to stay login-free).
- Upload limits are modest (25 MB/file, 100 MB/share) to keep the service cheap and fast.
- Rate limiting is not yet implemented, so abuse prevention relies on platform limits.

---

## 14. Future Scope

- **Client-side encryption** with the key embedded in the share link fragment, so the
  server never sees plaintext.
- **Password-protected drops** with a server-side hash check.
- **Syntax highlighting** and language auto-detection on the receive page.
- **Rate limiting / abuse protection** per IP.
- **PWA + Web Share Target** so a phone can share directly into CodeDropz.
- **Optional accounts** for a private history of drops, without breaking the anonymous
  path.
- **Browser extension / CLI** (`codedropz push file.js`) for developer workflows.
- **Analytics dashboard** (aggregate, non-identifying) for drop counts and expiry stats.

---

## 15. Conclusion

CodeDropz demonstrates a complete, production-deployed full-stack web application built
on a modern React/TypeScript stack with a real relational backend, object storage,
row-level security, and atomic server-side business rules. It solves a small but very
real everyday problem — moving code and files between two devices — with a design that
prioritises speed, privacy through ephemerality, and zero onboarding friction.

**Live:** https://codedropz.vercel.app
**Repository:** https://github.com/LeviHQ/codedropz
