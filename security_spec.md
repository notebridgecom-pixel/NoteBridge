# Security Specification: NoteBridge Firestore Rules

## 1. Data Invariants
1. **User Identity & Roles**: A user document at `/users/{userId}` can only be created or updated if the authenticated `request.auth.uid == userId`. Role escalation to 'admin' is prevented.
2. **Notes Listing Integrity**: Only verified sellers or authenticated users can author notes (`sellerId == request.auth.uid`). System/catalog notes are viewable by all. Only the author or admin can update note details.
3. **Purchase Orders**: An order at `/orders/{orderId}` must have `buyerId == request.auth.uid` during creation. Sellers or buyers can view their own orders.
4. **Withdrawals**: A seller can only request withdrawals where `sellerId == request.auth.uid`.
5. **Study Spaces & Drive Backups**: Study spaces and Google Drive backups must be created with `createdBy == request.auth.uid` or `userId == request.auth.uid`.
6. **Default Deny**: All unspecified paths are closed by default (`allow read, write: if false;`).

## 2. The "Dirty Dozen" Payloads (Must be rejected)
1. **Payload 1 (Spoofed Author UID)**: Attempting to create a note where `sellerId: "victim-uid"` does not match `request.auth.uid`.
2. **Payload 2 (Ghost Field Injection)**: Attempting to write a note with an unapproved ghost key `{ isOfficialAdminEndorsed: true }`.
3. **Payload 3 (Denial of Wallet String Bomb)**: Injecting a 2MB string into `subject` or `title`.
4. **Payload 4 (Direct Admin Role Grant)**: A regular user updating `/users/{uid}` with `{ role: 'admin' }`.
5. **Payload 5 (Unauthorized Order Inspection)**: User B trying to read `/orders/{orderId}` belonging to User A.
6. **Payload 6 (Unauthorized Note Deletion)**: User B attempting to delete a note created by User A.
7. **Payload 7 (Fake Withdrawal Creation)**: Creating a withdrawal with negative amount or spoofed `sellerId`.
8. **Payload 8 (Drive Backup Tampering)**: User B updating the `driveFileId` of User A's backup record.
9. **Payload 9 (Unauthenticated Read of Private User Data)**: Unauthenticated visitor attempting to query `/users`.
10. **Payload 10 (Terminal State Override)**: Overriding an approved order status back to pending without admin credentials.
11. **Payload 11 (Invalid ID Injection)**: Using path variables containing special characters or path traversal strings `../..`.
12. **Payload 12 (Blanket List Bypass)**: Attempting a collection-wide list query on orders without filtering by user ownership.
