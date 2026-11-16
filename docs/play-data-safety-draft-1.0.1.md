# Play declarations — working draft for 1.0.1 (NOT saved in Play Console)

Draft for review only. Status of every row is "proposed", not verified against a 1.0.1 binary
(none has been built). GMA mapping source is the Data-disclosure guide for SDK 25.5.0; 1.0.1 still
pins react-native-google-mobile-ads 16.0.0 (expected GMA 24.6.0 / UMP 3.2.0, unverified in a binary).

## Advertising ID
Yes — Advertising or marketing; Analytics; Fraud prevention, security and compliance.
Basis: AD_ID permission in the bundle; purposes per the GMA SDK guide. No other purposes.

## Data safety — changes vs. the earlier proposal

| Data type | Earlier proposal | Update for 1.0.1 | Basis / open point |
|---|---|---|---|
| Messages > Emails | remove | unchanged: remove | Definition = email content; app stores only the address. |
| Device IDs, Approx. location, App interactions, Diagnostics | add / widen purposes (GMA) | unchanged | 25.5 guide vs expected 24.6 — version gap stays a caveat. Consent (UMP) does not remove the collection itself. |
| Purchase history | keep collection | keep; purposes App functionality + **Fraud prevention** | verify-purchase records each token to block reuse. What is deployed now: in this session `supabase functions list` showed verify-purchase v7 updated 2026-11-15 and `db push --dry-run` reported the remote DB up to date; the deployed source itself was not diffed. |
| Name, User IDs, Other actions (points), rank — sharing | open | **still open**, narrower | The updated app (1.0.1) asks every signed-in account before publishing — new accounts and returning accounts with no valid saved choice on that device (choices are per account, per device, disclosure v2) — with a disclosure and a not-preselected choice. That supports the "prominent disclosure and consent" exception only for publishing done by 1.0.1's practice-points and rank paths. It is **not** confirmation that the exception holds for every path: older installs (incl. build 17) still publish automatically; verify-purchase writes name + badge after a purchase; admin-users writes on admin edits; entries published earlier stay. If a 1.0.1 opt-out cannot be saved, an earlier saved opt-in can apply again after a restart (the app tells the user). Decide whether to declare as shared or close those paths first. |
| Badge (Patron) — derived from purchase | not listed | flag for review | Patron badge on the public board reveals a donation; now disclosed in the 1.0.1 prompt, same caveats as above. |
| Other UGC (forum) | keep | unchanged | User-initiated post; forum intro says posts are visible to all users. |
| Audio | not collected | unchanged | On-device pitch detection only. |

Marking a type "shared" does not replace the in-app disclosure; Supabase being the host is not by
itself an exemption for data shown to other users.
