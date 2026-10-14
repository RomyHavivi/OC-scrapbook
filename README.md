# Character Scrapbook

An interactive character scrapbook: cover → table of contents → character spreads.
Without Firebase configuration it uses the local sample data. When Firebase is
configured, the public book reads live published records and `/admin` provides
email/password protected editing.

## What's here vs. what's not yet

**Working:**
- Cover → paginated TOC → character spread book, using `react-pageflip`; desktop shows facing pages and narrow screens use a single portrait page
- TOC groups characters by world (color + mark), clicking a name jumps to that character's spread
- Open-book Contents and Close book controls return directly to the directory or cover
- Keyboard users can turn pages with the left/right arrow keys when the book region is focused; open-book controls also expose previous/next, and Escape closes the book
- Page-flip animation respects the operating system's reduced-motion preference
- The cover has a pink scrapbook look with a handmade title card, stitched edging, washi tape, and playful decorative accents
- Character biographies are measured against the rendered page size (including mobile sizing) and flow at word boundaries across as many physical pages as needed. The next character starts on a fresh left page. Extra photos and notes can be assigned to either the first left or right page; entries without a side remain on the right.
- Firebase-backed public reads and admin character/world create, edit, delete, and ordering
- Image uploads for portraits and extra photos; storage is cleaned up when saved images are removed
- Admin form assigns photos to a page side and notes to a page plus a 3 × 3 top/middle/bottom and left/center/right position; saves publish immediately
- Admin sticker library uploads images (up to 10 MB), and placement mode adds stickers to the cover or a particular physical page. Stickers stay attached to that page, can be dragged or removed in placement mode, and are visible to public readers.

**Not yet (later phases, per `PROJECT_SPEC.md`):**
- Complete visual system and broader content-length validation
- Full 40-character browser validation and accessibility review with real content

## Setup

```bash
npm install
cp .env.example .env
```

Then create a Firebase project (Firestore + Storage + Authentication with
Email/Password enabled), fill in `.env` with the config values from Firebase
Console > Project Settings, and create an administrator user under
Authentication > Users. Set `VITE_ADMIN_EMAIL` in `.env` to prefill the admin
login email.

The Firestore and Storage rules allow public reads and restrict writes to one
administrator email. Before deploying the rules, replace `admin@example.com`
in both `firestore.rules` and `storage.rules` with the exact administrator
email. The email in `.env` is only a UI default; it does not grant write
permissions. Deploy the rules from the Firebase project root using the Firebase
CLI after selecting the project:

```bash
firebase use --add
firebase deploy --only firestore:rules,storage
```

The first admin visit can start with an empty Firebase database. Add worlds and
characters in `/admin`; changes appear in the public book as soon as the
Firestore save completes.

Use the Stickers section in `/admin` to upload an image and choose **Place**.
Select a sticker in the placement toolbar, click the cover or a page to add it,
and drag existing stickers to move them. The small × control removes a single
placement; **Done** returns to the public book. Deleting a sticker from the
library also removes its placements and stored image.

```bash
npm run dev
```

Visit `/` for the book and `/admin` for the sign-in and management screen.

Without Firebase configured, `/` runs on local placeholder data and `/admin`
explains that Firebase setup is required.

## Test Firebase locally without deploying

The Firebase Emulator Suite runs Authentication, Firestore, Storage, and the
project's security rules on your computer. The emulator uses a dedicated
`demo-scrapbook` project ID, so it does not connect to or modify a live Firebase
project. No Firebase project credentials are needed.

1. Make an emulator-only environment file from the supplied fake settings:

   ```powershell
   Copy-Item .env.emulator.example .env.development.local
   ```

   `.env.development.local` is gitignored and only used by the development
   server (not production builds). Keep `VITE_USE_FIREBASE_EMULATORS=true`; do
   not put production Firebase values into this file.
2. In terminal 1, start the local Firebase services:

   ```powershell
   npm run emulators
   ```

   On first launch the Firebase CLI downloads emulator binaries. The UI is at
   `http://127.0.0.1:4000`.
3. In terminal 2, run the app:

   ```powershell
   npm run dev
   ```

4. Open the Emulator UI's Authentication section and add a user with
   `admin@example.com` and a test password. The email must match the
   allowlisted address in `firestore.rules` and `storage.rules`. Open the app's
   `/admin` page, sign in, create a world and character, upload photos, change
   object sides, reorder records, upload a sticker, and place it on the cover
   and a character page. Check `/` to see the published changes persist after
   turning pages or reloading.
5. To test the rules, sign out and add/sign in as another email. Public reads
   should still work, but saves, uploads, reordering, sticker placement, and
   deletes should be rejected. Return to the allowlisted account for admin
   actions.

The emulators normally keep data only until they stop. To save emulator data
locally between runs, use `npm run emulators:save`; it imports/exports to the
gitignored `.firebase-data` directory. These commands start emulators only:
they do not deploy rules or data.

## Deploying

### Netlify

The repository includes `netlify.toml` with the Vite build command, `dist`
publish directory, a compatible Node version, and a single-page-app rewrite for
routes such as `/admin`.

1. Create/select the **production** Firebase project and enable Firestore,
   Storage, and Email/Password Authentication. Register a Firebase web app and
   create the admin user. Emulator records do not transfer to production.
2. Replace `admin@example.com` in `firestore.rules` and `storage.rules` with the
   exact production admin email. Select and verify the production Firebase CLI
   project before deploying rules; `.firebaserc` currently defaults to the
   emulator project `demo-scrapbook`:

   ```powershell
   firebase use --add
   firebase use
   firebase deploy --only firestore:rules,storage
   ```

   Confirm `firebase use` displays the production project ID before running the
   deploy command.
3. Push the project to a Git provider (for example GitHub), then in Netlify
   choose **Add new site → Import an existing project** and connect that
   repository. Netlify reads `netlify.toml` automatically. If using a manual
   deploy instead, build with `npm run build` and publish the `dist` folder.
4. In the Netlify site's **Environment variables** settings, add the Firebase
   web-app values below, plus `VITE_ADMIN_EMAIL` set to the exact admin email.
   These `VITE_*` values are embedded in the client bundle at build time, so
   set them before the first build and trigger a new deploy after changing
   them.

   ```text
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_ADMIN_EMAIL
   ```

   Do not set `VITE_USE_FIREBASE_EMULATORS=true` on Netlify. The Firebase web
   config is public client configuration; access control is enforced by the
   Firestore and Storage rules, not by hiding these values.
5. In Firebase Console → Authentication → Settings → Authorized domains, add
   the Netlify site hostname (for example, `your-site.netlify.app`). Add your
   custom domain there too if you configure one in Netlify.
6. After Netlify reports a successful deploy, test `/`, refresh `/admin`,
   sign in as the administrator, and verify reading and writing characters,
   uploading images/stickers, and placing stickers. Do not use the production
   admin to test with disposable data unless you intend to remove it.
