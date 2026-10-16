# Security Specification & Threat Model

## 1. Data Invariants
- Every document in `/strategies/{strategyId}`, `/research_reports/{reportId}`, and `/chat_messages/{messageId}` must have a `userId` matching `request.auth.uid`.
- Timestamps `createdAt` and `updatedAt` must be set via server timestamp `request.time`.
- Document IDs must conform to `^[a-zA-Z0-9_\\-]+$` and size <= 128 characters.
- Incoming payloads on create must contain all required fields and no unexpected shadow keys (`hasAll` + `hasOnly`).
- Users can only read, write, update, and delete their own strategies, reports, and chat messages.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)
1. **Unauthenticated Write**: Writing to `/strategies/strat1` without `request.auth`.
2. **Identity Spoofing**: User `alice` creating `/strategies/strat2` with `userId: "bob"`.
3. **Shadow Field Injection**: Writing Strategy with unwanted key `"isAdmin": true`.
4. **ID Poisoning**: Creating document with 2KB string ID containing malicious characters.
5. **Timestamp Tampering**: Passing arbitrary client timestamps instead of `request.time`.
6. **Cross-Tenant Read**: User `alice` querying or getting `/strategies/bob_strat` belonging to `bob`.
7. **Cross-Tenant Delete**: User `alice` deleting `/strategies/bob_strat` belonging to `bob`.
8. **Immutability Breach**: Updating `/strategies/strat1` to change its `userId` or `createdAt`.
9. **Oversized Payload**: Sending `mql5Snippet` or `fullReport` exceeding character limits (>50KB).
10. **State Mutation Gap**: Updating an unallowed field or missing validation helper.
11. **Chat Cross-Injection**: Appending chat message with `userId` of another account.
12. **Blanket Query Scraping**: Running collection query without filtering by `userId == auth.uid`.
