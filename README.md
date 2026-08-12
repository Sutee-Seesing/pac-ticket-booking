# PAC Ticket Booking (M1)

A lightweight Google Apps Script + Google Sheets ticketing system for the 21–22 August 2026 PAC performances. Customers choose a show, pay, attach an image slip, and receive a reservation waiting for staff review. Staff confirm or reject in a separate dashboard.

## What keeps capacity correct

Bookings in `WAITING_PAYMENT_REVIEW` and `CONFIRMED` are the source of truth for reserved tickets; there is no editable “remaining” counter. Final submission takes a Script Lock, reloads all bookings, checks capacity, writes the slip then booking, and releases the lock. Rejecting or cancelling a reserved booking stops it counting as reserved. Repeating a decision is idempotent and cannot return quota twice.

The included four shows are 21 Aug 17:00 / 19:00 and 22 Aug 17:00 / 19:00, 50 capacity each, THB 120 each. Event content, banking, support, images, and Drive folder are in the `Settings` sheet.

## Deploy (owner steps)

1. Create a blank Google Sheet, then **Extensions → Apps Script**.
2. Install [clasp](https://github.com/google/clasp) locally, copy `.clasp.json.example` to `.clasp.json`, add the Apps Script project ID, then run `clasp push` from this folder. Alternatively copy the files under `src/` into Apps Script (each source file becomes an `.gs` or `.html` file).
3. In the Apps Script editor select and run `setup` once; approve Spreadsheet and Drive permissions. It is safe to run again.
4. In **Project Settings → Script properties**, add a long random `ADMIN_TOKEN` value. Do not place it in the sheet or client code.
5. Edit `Settings`: at minimum replace `SET_ACCOUNT_HOLDER_NAME` and `SET_SUPPORT_CONTACT`; optionally add event name, poster URL and logo URL.
6. **Deploy → New deployment → Web app**. Customer deployments may allow anyone; execute as the deploying owner so it can write Sheets and Drive. For real safety, deploy a separate, domain-restricted admin deployment if your university Google Workspace allows it. The same web app supports `/exec?page=admin`, but every admin server action still requires the private token.

### Drive permissions

`setup` creates a private `PAC Payment Slips` folder owned by the deployment owner. Do not share it publicly. Staff who need to open slips must be granted Viewer access to the folder (or be the owner). The app stores only a Drive file ID in the Sheet and opens the normal Drive viewer for authorized staff.

## Ticket-staff guide

Open the web-app URL with `?page=admin`, enter the admin access token, then review the prominent queue. Use **View slip**, then **Confirm payment** or **Reject payment** (optional note). Confirming keeps reservation; rejecting releases it. The dashboard refreshes immediately. Never edit the `Bookings` status manually—use the dashboard to preserve the audit trail.

## Customer smoke test

1. Run setup in a blank Sheet and deploy the app.
2. Verify four performance cards; submit 2 tickets at THB 240 using a small test JPEG/PNG.
3. Confirm the booking is `WAITING_PAYMENT_REVIEW` and the selected show becomes 48 remaining.
4. In Admin, open the slip, confirm the booking, and verify it remains 48 remaining.
5. Make another booking; reject it, then reject again. Its quota returns once only.
6. Submit more than the remaining capacity and confirm it is rejected with no booking created.

## Tests

Run `npm test`. Tests cover the pure domain rules: availability, sold-out/final-seat boundaries, quantity validation, status transitions/release idempotency, and spreadsheet formula injection. LockService, Drive, and Apps Script authorization require the smoke test above.

## Future automated slip verification

`PaymentVerifier.gs` is the boundary for a future provider. M1 returns `PENDING` and preserves manual review; a future provider returns a normalized accept/reject decision and uses the same status transition. No capacity code needs to change.

## Backup and troubleshooting

Export the Sheet regularly and keep the Drive folder. If the app says admin is not configured, create `ADMIN_TOKEN` in Script Properties and redeploy. If a customer cannot upload, use JPEG/PNG/WEBP smaller than 5 MB. If a performance should change, edit `Performances` deliberately; never lower capacity below existing reserved tickets.
