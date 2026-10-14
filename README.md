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
- Supabase image uploads for portraits, extra photos, and stickers through admin-verified Netlify Functions; removed images are cleaned up
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

Create a Firebase project with Firestore and Email/Password Authentication,
register a web app, and create an administrator user under Authentication >
Users. Fill in the Firebase and Supabase public values in `.env` using
`.env.example` as a template. Create a Supabase project and a **public** Storage
bucket named `scrapbook-media`, with a 10 MB file-size limit and image MIME
types. Firebase stores authentication and scrapbook records; Supabase stores
the image files.
Image uploads/deletes are served by the Netlify Functions and work on a Netlify
deployment with the server-only environment variables configured below. The
local Vite/Firebase-emulator workflow does not enable media uploads because
emulator ID tokens are not production Firebase tokens.

The Firestore rules restrict writes to the configured administrator email.
Replace `admin@example.com` in `firestore.rules` with the exact production
admin email. The email in `VITE_ADMIN_EMAIL` only prefills the sign-in form; it
does not grant permissions. Deploy Firestore rules after selecting and
verifying the Firebase project:

```bash
firebase use --add
firebase use
firebase deploy --only firestore:rules
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

The Firebase Emulator Suite runs Authentication and Firestore plus the
project's Firestore rules on your computer. The emulator uses a dedicated
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
   allowlisted address in `firestore.rules`. Open the app's
   `/admin` page, sign in, create a world and character, change
   object sides, reorder records, and place an existing sticker on the cover
   and a character page. Check `/` to see the published changes persist after
   turning pages or reloading. Image uploads use the production Supabase media
   functions and require a valid, production Firebase admin token; emulator
   authentication tokens are intentionally not accepted by those functions.
5. To test the rules, sign out and add/sign in as another email. Public reads
   should still work, but Firestore saves, reordering, and deletes should be
   rejected. The deployed media functions separately reject uploads and
   deletes from accounts other than the configured admin.

The emulators normally keep data only until they stop. To save emulator data
locally between runs, use `npm run emulators:save`; it imports/exports to the
gitignored `.firebase-data` directory. These commands start emulators only:
they do not deploy rules or data.

## Deploying

### Netlify

The repository includes `netlify.toml` with the Vite build command, `dist`
publish directory, a compatible Node version, and a single-page-app rewrite for
routes such as `/admin`.

1. Create/select the **production** Firebase project and enable Firestore and
   Email/Password Authentication. Register a Firebase web app and create the
   admin user. Emulator records do not transfer to production.
2. Replace `admin@example.com` in `firestore.rules` with the exact production
   admin email. Select and verify the production Firebase CLI
   project before deploying rules; `.firebaserc` currently defaults to the
   emulator project `demo-scrapbook`:

   ```powershell
   firebase use --add
   firebase use
   firebase deploy --only firestore:rules
   ```

   Confirm `firebase use` displays the production project ID before running the
   deploy command.
3. Push the project to a Git provider (for example GitHub), then in Netlify
   choose **Add new site → Import an existing project** and connect that
   repository. Netlify reads `netlify.toml` automatically. Use a Netlify
   deployment that includes the configured Functions; a static-only `dist`
   upload does not include image-upload or deletion endpoints.
4. In the Netlify site's **Environment variables** settings, add these
   **public build-time** values. `VITE_*` variables are embedded in the browser
   bundle and must never contain the Supabase service-role key:

   ```text
   VITE_FIREBASE_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID
   VITE_FIREBASE_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID
   VITE_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY
   VITE_ADMIN_EMAIL
   ```

   Also add these **server-only Netlify Function** values (do not prefix them
   with `VITE_`):

   ```text
   FIREBASE_PROJECT_ID
   FIREBASE_ADMIN_EMAIL
   SUPABASE_URL
   SUPABASE_SERVICE_ROLE_KEY
   ```

   Get the Supabase service-role/secret key from the Supabase project API
   settings and store it only in Netlify's environment settings. Do not commit
   it, put it in a Vite variable, or share it in chat. Do not set
   `VITE_USE_FIREBASE_EMULATORS=true` on Netlify. Firebase client values and the
   Supabase anon key are public; Firestore rules and the verified Firebase
   admin token protect writes, while the Supabase service-role key stays in
   the server function. `FIREBASE_PROJECT_ID` must match
   `VITE_FIREBASE_PROJECT_ID`; `FIREBASE_ADMIN_EMAIL` must match
   `VITE_ADMIN_EMAIL` and the email allowlisted in `firestore.rules`.
5. In Firebase Console → Authentication → Settings → Authorized domains, add
   the Netlify site hostname (for example, `your-site.netlify.app`). Add your
   custom domain there too if you configure one in Netlify.
6. After Netlify reports a successful deploy, test `/`, refresh `/admin`,
   sign in as the administrator, and verify reading and writing characters,
   uploading images/stickers, and placing stickers. Do not use the production
   admin to test with disposable data unless you intend to remove it.
