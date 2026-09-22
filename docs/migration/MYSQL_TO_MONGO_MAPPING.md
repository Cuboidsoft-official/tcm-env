# MySQL to MongoDB mapping contract

This is the initial contract. It is intentionally explicit so that implementation changes are reviewable and repeatable.

## Identity and ownership

Every migrated document should include:

```js
{
  legacyIds: { mysql: Number },
  sourceSystem: "thecodemunk-hostinger",
  migrationBatchId: String,
  schemaVersion: Number,
  createdAt: Date,
  updatedAt: Date,
  deletedAt: Date | null
}
```

Existing Mongo documents must not be replaced solely because a MySQL ID matches. Matching priority is: normalized email, verified external identity, then an explicitly approved legacy-ID mapping.

## Core mappings

| MySQL source | Mongo target | Migration rule |
|---|---|---|
| `users` | `users` | Preserve password hash where compatible; preserve role/status; create conflict records for email collisions. |
| `student_profiles` | `users.profile` or profile subdocument | Normalize optional fields; retain the legacy profile ID. |
| `categories` | content category metadata | Preserve slug and display order. |
| `courses` | `courses` | Convert publication/status fields; preserve slug and pricing history. |
| `course_modules` | `courses.modules[]` or module collection | Preserve ordering and legacy module IDs. |
| `course_lessons` | `courses.modules[].lessons[]` or lesson collection | Preserve content, ordering, duration and publication state. |
| `course_notes` | course note/content documents | Preserve hierarchy and reading progress references. |
| `enrollments` | `enrollments` | Preserve status, dates, expiry and source course/program IDs. |
| `lesson_progress` | `learningProgress` | Map by legacy user, course and lesson IDs; imports must be idempotent. |
| `payment_submissions` | `payments` | Preserve approval/rejection state, transaction references and evidence metadata. |
| `orders` | `orders` | Preserve amounts, status, currency and timestamps; never recompute financial history. |
| `wallets` | `wallets` | Reconcile balance against the transaction ledger before import. |
| `wallet_transactions` | `walletTransactions` | Immutable append-only ledger records. |
| `withdrawal_requests` | `withdrawals` | Preserve approval/rejection and payout details with restricted access. |
| `leads` | `leads` | Preserve lifecycle status and acquisition source. |
| `internship_applications` | `applications` | Preserve resume/file references and status history. |
| `portfolio_projects` | `portfolio.projects[]` | Preserve ownership and public visibility. |
| `portfolio_skills` | `portfolio.skills[]` | Normalize names and preserve legacy IDs. |
| `portfolio_achievements` | `portfolio.achievements[]` | Preserve dates and evidence links. |
| `events`, `live_sessions` | `events`, `liveSessions` | Preserve schedule, capacity and registration state. |
| `notifications`, `fcm_tokens` | `notifications`, `pushTokens` | Expire invalid tokens; do not migrate OTP/session data. |
| `posts`, `testimonials`, `settings` | corresponding CMS collections | Published content becomes public API data; secrets never migrate into CMS documents. |
| `uploads` and `storage` | `uploadedMedia` plus durable object storage | Copy files separately, checksum them and update references only after verification. |

## Records not migrated directly

- Active PHP sessions and CSRF tokens.
- Expired OTPs and password-reset tokens.
- Runtime secrets, SMTP passwords, OAuth secrets and API keys.
- Database implementation metadata and MySQL-only auto-increment state.

## Required validation

- Source/target counts by entity.
- User email collision and identity report.
- Enrollment/progress referential integrity.
- Payment and wallet ledger reconciliation.
- Upload checksum and reference validation.
- Repeated dry-run produces no additional changes.
