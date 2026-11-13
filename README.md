# ⚡ CodeDropz

> **The fastest way to securely share code, files, and folders across devices without login.**  
> *Paste. Generate. Share.*

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen)](https://codedropz.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Built with TanStack](https://img.shields.io/badge/Built%20with-TanStack%20Start-ff4154)](https://tanstack.com)

---

## 🌟 Overview

**CodeDropz** is a zero-friction, privacy-first web application designed to transfer code snippets, scripts, files, and nested project directories between two devices in seconds. 

No sign-ups, no accounts, and no leftover sensitive data — shares automatically self-destruct once their expiration time is reached or maximum view limits are consumed.

- **Live URL:** [codedropz.vercel.app](https://codedropz.vercel.app)
- **Repository:** [github.com/LeviHQ/codedropz](https://github.com/LeviHQ/codedropz)

---

## ✨ Key Features

- **🚀 Zero Friction (No Login Required):** Open the site, paste code or drop files, and get an instant sharing code.
- **🔢 6-Character & Custom Codes:** Generate quick 6-character random codes or pick your own custom memorable code (4–12 characters).
- **📁 Multi-File & Folder Support:** Upload single files, multi-file batches, or entire directories while preserving original file paths and folder structure. Supports any file extension (`.php`, `.py`, `.js`, `.zip`, `.pdf`, `.bin`, etc.) up to 25MB per file (100MB batch limit).
- **⏱️ Auto-Destruct & Limits:** 
  - Expiration options: 10 mins, 30 mins, 1 hour, 1 day, 7 days, 1 month, or custom durations.
  - Access limits: 1, 5, 10, or custom view counts. Once the limit is exhausted, the share is permanently locked.
- **📦 In-Browser Zip & Direct Downloads:** Recipients can download individual files, preview text directly, or download the entire folder structure as a `.zip` archive with one click.
- **🔒 Private by Design:** Share links and files are tagged with `noindex` and shielded from search engines to prevent accidental indexing or view consumption by crawlers.
- **🎨 Modern Developer UX:** 
  - Dark mode by default with vibrant accent colors.
  - Responsive glassmorphic UI built for both desktop and mobile devices.
  - Keyboard shortcuts, one-click clipboard copying, and responsive action layout.
- **🛡️ SDSM Read-Only Portal:** Passcode-protected administrative portal for authorized auditing and in-browser PDF viewing without consuming share view counts.

---

## 🛠️ Tech Stack

- **Framework:** [TanStack Start](https://tanstack.com/start) (Full-stack React 19 + SSR/SSG + Server Functions)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icons & UI:** Lucide React, Sonner (Toasts)
- **Archive Generation:** [JSZip](https://stuk.github.io/jszip/)
- **Backend & Database:** PostgreSQL via Lovable Cloud
- **Storage:** Object Storage bucket (`share-files`) for binary assets
- **Deployment:** Vercel (Edge / Serverless)

---

## 🏗️ Architecture & Security Model

```text
Sender Device                             Recipient Device
      │                                          │
      ├── (1) Paste Code / Upload Files          │
      ├── (2) Set Expiry + View Limits           │
      ▼                                          │
┌──────────────────────────────────────┐         │
│   CodeDropz Frontend (Client)        │         │
└──────────────────┬───────────────────┘         │
                   │                             │
                   ▼                             │
┌──────────────────────────────────────┐         │
│   Storage Bucket (`share-files`)     │         │
│   - Neutralized file keys            │         │
│   - Metadata preservation            │         │
└──────────────────┬───────────────────┘         │
                   │                             │
                   ▼                             │
┌──────────────────────────────────────┐         │
│   PostgreSQL Database                │         │
│   - `shares` table                   │         │
│   - Atomic `retrieve_share()` RPC    │◄────────┘ (3) Enter Code / Open Link
│   - Automatic limit & expiry checks  │           - Read & Verify
└──────────────────────────────────────┘           - Atomic View Increment
                                                   - Download text / ZIP




Storage Sanitization: Uploaded files are saved under safe programmatic keys
({code}/{batch}/{index}.bin) to prevent issues with special characters,
spaces, or language scripts, while metadata retains original file names
and folder structures.

Atomic Verification: The retrieve_share RPC handles access validation
and counter increments in a single database transaction to prevent
race conditions or limit bypasses.

No-Login Safety: Public file deletion is disabled at the database
policy level; shares cleanup securely through automated lifecycle
triggers.

🚀 Local Development Setup
Prerequisites
Node.js 18+ or Bun (recommended)

Git
1. Clone the repository
git clone https://github.com/LeviHQ/codedropz.git
cd codedropz

2. Install dependencies
bun install
# or: npm install

3. Environment Variables
Create a .env file in the project root:
VITE_SUPABASE_URL=your_database_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
VITE_SUPABASE_PROJECT_ID=your_project_id

# Portal Access (Optional)
PORTAL_PASSWORD=SDSM
SESSION_SECRET=your_32_character_session_secret

4. Run the development server
bun dev
# or: npm run dev
Open http://localhost:8080 in your browser.

🚢 Deployment on Vercel
Push your repository to GitHub.
Import the project into Vercel.
In Settings → Environment Variables, add:
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
PORTAL_PASSWORD
SESSION_SECRET
Deploy!

📄 License
Distributed under the MIT License. See LICENSE for more information.

👨‍💻 Author
Developed by Adarsh Jayprakash Mishra (@LeviHQ)
