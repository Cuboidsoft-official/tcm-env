# Target schema gaps

The current MongoDB application already contains social, government-content, mentor, job and media models. The Hostinger system contains additional education and operations domains that need canonical target models before migration.

## Required first-class models

These should be separate collections because they have independent lifecycle, authorization and reporting requirements:

- `Course`, `CourseVersion`, `CourseModule`, `Lesson`, `CourseNote`
- `Enrollment`, `LearningProgress`, `Assessment`, `Submission`, `Certificate`
- `Product`, `Order`, `Payment`, `Refund`, `Entitlement`
- `Wallet`, `WalletTransaction`, `Withdrawal`, `Referral`
- `Lead`, `LeadActivity`, `Internship`, `Application`
- `PortfolioProject`, `PortfolioSkill`, `PortfolioAchievement`
- `Event`, `LiveSession`, `Registration`
- `Notification`, `PushToken`, `AuditLog`
- `FileAsset`, `MigrationBatch`, `MigrationConflict`, `OutboxEvent`

## Modeling rules

- Use references for high-volume or independently queried records such as progress, payments, notifications and ledger entries.
- Use embedded documents only for bounded value objects such as profile details, course display metadata and portfolio summaries.
- Treat wallet transactions, payments, refunds and audit records as append-only.
- Treat `balance` as a derived/reconciled value, not the only financial truth.
- Version course content so existing learners do not unexpectedly receive changed curriculum.
- Add compound indexes based on access patterns: normalized email, slug, owner, course/user, status/date and legacy source IDs.
- Use explicit soft deletion and publication states; do not physically delete migrated business records during normal admin operations.

## Compatibility layer

During rollout, the PHP site should not write directly to MongoDB. It should call versioned app APIs for new mutations, or remain read-only while the importer is active. If a temporary MySQL projection is required, it must be one-way from MongoDB and marked with a projection timestamp/batch ID.

## Exit criteria for schema implementation

Before production import:

1. All source tables have an approved target and transformation rule.
2. All target collections have ownership and authorization rules.
3. Indexes exist for every migration lookup and critical user journey.
4. Payment and wallet reconciliation tests pass.
5. The importer can be rerun without duplicates.
6. A staging restore and application smoke test succeed.
