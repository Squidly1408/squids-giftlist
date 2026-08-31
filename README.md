![Squids-GiftList Banner](./.github/banner.png)

# Squids-GiftList

A gift-list web app: create an account, build gift lists for any occasion (Christmas, birthdays,
weddings, and more), organize them into custom sections, and share a link so friends and family
can claim gifts without spoiling the surprise — **the list owner can never see who claimed what,
only the overall progress.** Other guests *can* see claims, so nobody buys the same thing twice.

Built with React + TypeScript + Vite + Tailwind CSS on the frontend, and Firebase (Auth, Firestore,
Hosting) on the backend — deliberately kept to Firebase's **free Spark plan**: no Cloud Functions,
no Cloud Storage, no billing required at all.

## Features

- **Accounts** — email/password and Google sign-in.
- **Multiple lists per user**, each with an occasion (Christmas, birthday, wedding, baby shower,
  graduation, anniversary, holiday, housewarming, or a custom occasion), an optional event date
  with a countdown, and a description.
- **Custom sections** within a list (e.g. "Clothes", "Big ticket", "Stocking stuffers"), fully
  editable and reorderable.
- **Add gifts** manually — name, optional link, price, priority, quantity, notes.
- **Sharing** via a link or QR code — no account required for guests to view or claim gifts.
- **Claiming, done right** — guests can mark a gift as "getting this" (with optional quantity for
  multi-quantity items). Other guests can see who claimed what, so nobody duplicates a gift. The
  **list owner never can** — claims live in a security-rule-protected subcollection the owner has
  no read access to; only a redacted aggregate ("3 of 5 claimed") is ever visible to them. See
  below for exactly how that's enforced without a server.
- **Duplicate a list** — reuse last year's Christmas list as a starting point for this year.
- **Archive lists** instead of deleting them.
- Light/dark theme, responsive layout, real-time updates everywhere (Firestore listeners).

## Project layout

```
web/         React + Vite + TypeScript + Tailwind frontend
firestore.rules, firestore.indexes.json, firebase.json, .firebaserc
functions/   Optional Cloud Functions (link-preview / Amazon import) — NOT deployed by default,
             requires the paid Blaze plan. See functions/README.md.
```

## 1. Create the Firebase project

1. Go to the [Firebase Console](https://console.firebase.google.com/) → **Add project** → give it
   a name (e.g. "Squids-GiftList") → finish the wizard. Stay on the free **Spark** plan — nothing here
   requires upgrading.
2. In the console, register a **Web app** (the `</>` icon on the project overview page). Copy the
   `firebaseConfig` values it gives you.

### Configure the frontend

```bash
cp web/.env.example web/.env.local
```

Paste the values from step 1 into `web/.env.local` (only the Auth + Firestore fields are needed).

### Configure the CLI project alias

Edit `.firebaserc` at the repo root and replace the project ID with your actual Firebase project ID.

## 2. Enable the Firebase products this app uses

In the Firebase Console, for your project:

- **Authentication** → Sign-in method → enable **Email/Password** and **Google**.
- **Firestore Database** → Create database (start in production mode — this repo's
  `firestore.rules` will be deployed over it).

That's it — no Storage, no Functions, no billing plan change.

## 3. Install dependencies

```bash
npm install --prefix web
```

## 4. Local development

```bash
npm run dev --prefix web
```

Opens at `http://localhost:5173`. Sign-up, sign-in, list/section/item CRUD, and claiming all work
against your real Firebase project as soon as `.env.local` is filled in.

To run everything locally against the Firebase Emulator Suite instead (useful before you've
deployed anything, or to avoid touching production data — also entirely free, no Blaze needed):

```bash
firebase emulators:start --only auth,firestore,hosting
```

and set `VITE_USE_EMULATORS=true` in `web/.env.local` while doing so.

## 5. Install the Firebase CLI (if you don't have it)

```bash
npm install -g firebase-tools
firebase login
```

## 6. Deploy

From the repo root:

```bash
# Security rules + indexes (do this first — the composite index takes a few minutes to build)
firebase deploy --only firestore:rules,firestore:indexes

# Build and deploy the frontend
npm run build --prefix web
firebase deploy --only hosting
```

Or all at once: `npm run build --prefix web && firebase deploy`.

Firebase Hosting will print your live URL (also visible under Hosting in the console). You can
attach a custom domain from the Hosting page any time.

**Note:** right after the first `firestore:indexes` deploy, the "My gift lists" dashboard query can
briefly fail with a "the query requires an index... currently building" error — that's normal,
Firestore needs a few minutes to finish building it. It resolves itself; no action needed.

## How "owner can't see who claimed what" works — without a server

There's no Cloud Functions here to act as a trusted intermediary, so the whole thing is enforced by
Firestore Security Rules plus a client-side transaction:

- Claims are stored in a subcollection: `lists/{listId}/items/{itemId}/claims/{claimId}` — that's
  where a claimer's name lives.
- `firestore.rules` explicitly denies the list owner read access to that subcollection, while
  allowing any other signed-in visitor (including anonymous "guest" sessions) to read it.
- When someone claims or un-claims a gift, their own browser runs a Firestore **transaction** that
  writes the claim doc *and* updates the item's `quantityClaimed`/`isFullyClaimed` fields in one
  atomic write (see `addClaim`/`removeClaim` in `web/src/lib/firestore.ts`).
- A security rule (`isClaimCountUpdateByGuest` in `firestore.rules`) restricts what that update is
  allowed to touch to *only* those two aggregate fields — never the gift's name, price, or anyone
  else's claim. That aggregate count is all the owner ever sees.
- Guests who open a share link are signed in anonymously (Firebase Anonymous Auth) so they can
  claim and later un-claim their own claim, without needing to create an account.

The one honest tradeoff versus a server-enforced aggregate: the claimed *count* is only as
trustworthy as the claimer's own browser (a technically sophisticated guest could in principle
desync it). It cannot be used to see who claimed what, spend money, or touch anything else — worst
case is a wrong-looking progress number, which self-corrects the next time someone claims or
cancels.
