# Security & Privacy Specification (Phase 0: Payload-First Security TDD)

## 1. Domain Privacy & Sensitive Information Assessment

- **ML Domain Evaluation**: NexusDemand operates on **macro-level, aggregated public market intelligence** across 14 countries and 3 consumer lifestyle verticals (`Fashion_Beauty`, `Fitness_Wearables`, `Nutrition_Diets`), sourced from Google Trends, GDELT global news tone/volume, and World Bank macroeconomic indicators.
- **No Health, Financial, or Personal Identity Inference**: Even though two market verticals represent aggregated consumer interest in *Fitness & Wearables* and *Nutrition & Diets*, the ML models **never** ingest or infer individual health records, personal biometrics, personal financial accounts, or personally identifiable information (PII). All inputs are strictly country-level and category-level strings (`country_name`, `category`).
- **Credential & PII Minimization**:
  - **No Passwords**: Passwords are never handled or persisted in Firestore; authentication is delegated exclusively to Firebase Authentication.
  - **No Duplicated Auth Credentials**: Firebase Auth credentials (including email addresses, OAuth refresh tokens, and password hashes) are **not** duplicated in Firestore documents. User identity is referenced strictly by immutable `uid` (`request.auth.uid`).
  - **Server-Generated Timestamps**: All `createdAt` and `updatedAt` fields are populated via `serverTimestamp()` and enforced in `firestore.rules` via `request.time`.

## 2. Data Invariants

1. **Global Default Deny**: Any path not explicitly matched is unconditionally denied (`allow read, write: if false;`).
2. **Verified Identity Requirement**: All write operations (`create`, `update`, `delete`) require `isVerifiedUser()` (`request.auth != null && request.auth.token.email_verified == true`).
3. **Strict Owner Isolation (`/users/{userId}`)**: A user document can only be read, created, or updated by its authenticated owner (`userId == request.auth.uid && incoming().uid == request.auth.uid`). No passwords or duplicated email credentials are stored.
4. **Master Gate on Subcollection (`/users/{userId}/predictions/{predictionId}`)**: Every prediction record must belong to an existing `/users/{userId}` document (`exists(...) || existsAfter(...)`), have `incoming().uid == request.auth.uid`, and include all required audit fields (`uid`, `modelType`, `modelDisplayName`, `countryName`, `category`, `summaryValue`, `numericResult`, `recordDate`, `predictionStatus`, `notes`, `createdAt`, `updatedAt`).
5. **Server Timestamp Enforcement**: On `create`, `incoming().createdAt == request.time && incoming().updatedAt == request.time`. On `update`, `incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`.
6. **Terminal State Locking (`contactInquiries`)**: Once a `ContactInquiry` reaches `status == 'resolved'`, no further user updates are permitted, but authorized admins can review and update status.
7. **Admin Privilege Verification (`isAdmin()`)**: Admin access is verified through `request.auth.token.email == '21sri97v@gmail.com'` or membership in the `/admins/{adminId}` collection (`exists(/databases/$(database)/documents/admins/$(request.auth.uid))`).
8. **User Login Audit Trail (`/userLogins/{loginId}`)**: Any authenticated user can create their own login event record matching `incoming().uid == request.auth.uid && incoming().createdAt == request.time`. Login records are immutable (no client updates or deletes allowed). Admins can list and monitor all user logins.
9. **Role-Based Access Control on Admins Registry (`/admins/{adminId}`)**: Only active admins can create or update admin records.

## 3. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on UserProfile**: Adding `"isAdmin": true` or `"password": "secret"` to `/users/{userId}` -> Rejected by `hasOnly()`.
2. **Identity Spoofing on UserProfile**: Creating `/users/victim_uid` while signed in as `attacker_uid` -> Rejected by `isOwner(userId)` and `data.uid == request.auth.uid`.
3. **Unverified Email Write**: Writing to `/users/{userId}` with `email_verified == false` -> Rejected by `isVerifiedUser()`.
4. **Cross-User Profile Read by Non-Admin**: Reading `/users/other_uid` without admin privileges -> Rejected by `isOwner(userId) || isAdmin()`.
5. **Credential Duplication Attempt**: Attempting to write `"email"` or `"passwordHash"` into `/users/{userId}` -> Rejected by strict `hasOnly()` schema check.
6. **Orphaned Prediction Write**: Creating `/users/{userId}/predictions/pred_1` when `/users/{userId}` does not exist -> Rejected by `exists(/databases/$(database)/documents/users/$(userId))`.
7. **Prediction Output Tampering on Update**: Attempting to mutate `numericResult`, `summaryValue`, `modelType`, or `predictionStatus` on an existing prediction record -> Rejected because `update` only permits `['notes', 'updatedAt']` via `affectedKeys().hasOnly(['notes', 'updatedAt'])`.
8. **Invalid Model Identifier or Status**: Creating a prediction with `modelType: "arbitrary_model"` or `predictionStatus: "pending"` -> Rejected by enum checks.
9. **Resource Exhaustion (1MB String Injection)**: Sending a 50,000-character string in `notes` or `modelDisplayName` -> Rejected by `.size() <= 500` and `.size() <= 120`.
10. **Path Variable ID Poisoning**: Creating a document with a 300-character ID or special characters -> Rejected by `isValidId()`.
11. **Timestamp Forgery (Backdating)**: Setting `createdAt` to a past timestamp on create or mutating `createdAt` on update -> Rejected by `incoming().createdAt == request.time` and `incoming().createdAt == existing().createdAt`.
12. **Login Audit Tampering or Forgery**: Attempting to update or delete a login log, or logging in as another UID -> Rejected by immutable rules (`allow update, delete: if false;` and `incoming().uid == request.auth.uid`).
