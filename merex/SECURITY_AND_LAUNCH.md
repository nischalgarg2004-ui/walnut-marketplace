# Security and Launch Readiness

## Mandatory Before Production

- Replace header-based auth stub with Clerk/Auth.js session auth.
- Enforce role checks from trusted session claims only.
- Verify Razorpay webhook signatures.
- Move payout trigger behind business ownership checks.
- Use signed upload URLs for deliverables (S3/R2).
- Add rate limiting and request logging for public APIs.
- Configure Sentry and alerting.

## QA Checklist

- Creator: signup -> apply -> deliverable submit flow.
- Business: create requirement -> approve application -> payout trigger flow.
- Admin: moderation queue -> payout reconciliation -> metrics visibility.
- Verify payout math for fixed, CPV, and mixed models.
- Validate rejection/waitlist states and contract auto-creation only on approval.

## Analytics Baseline Events

- `requirement_created`
- `application_submitted`
- `application_approved`
- `deliverable_submitted`
- `deliverable_approved`
- `payout_triggered`
- `payout_paid`
