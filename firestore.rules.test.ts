/**
 * Adversarial Security Rules Test Specification (Dirty Dozen Verification)
 * Target Ruleset: firestore.rules
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  authContext: {
    uid: string | null;
    email_verified?: boolean;
  };
  payload?: Record<string, unknown>;
  expectedOutcome: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TEST_CASES: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on UserProfile (isAdmin: true)',
    collectionPath: 'users/user_123',
    operation: 'create',
    authContext: { uid: 'user_123', email_verified: true },
    payload: {
      uid: 'user_123',
      displayName: 'Analyst',
      organization: 'Org',
      jobTitle: 'Planner',
      preferredCountry: 'United_States',
      preferredCategory: 'Fashion_Beauty',
      isAdmin: true,
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Identity Spoofing on UserProfile',
    collectionPath: 'users/victim_999',
    operation: 'create',
    authContext: { uid: 'attacker_111', email_verified: true },
    payload: {
      uid: 'victim_999',
      displayName: 'Spoofed',
      organization: 'Org',
      jobTitle: 'Planner',
      preferredCountry: 'United_States',
      preferredCategory: 'Fashion_Beauty',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Write Attempt',
    collectionPath: 'users/user_123',
    operation: 'create',
    authContext: { uid: 'user_123', email_verified: false },
    payload: {
      uid: 'user_123',
      displayName: 'Analyst',
      organization: 'Org',
      jobTitle: 'Planner',
      preferredCountry: 'United_States',
      preferredCategory: 'Fashion_Beauty',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Cross-User Profile Read Attempt',
    collectionPath: 'users/other_user_456',
    operation: 'get',
    authContext: { uid: 'user_123', email_verified: true },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Credential / Password Duplication Attempt on UserProfile',
    collectionPath: 'users/user_123',
    operation: 'create',
    authContext: { uid: 'user_123', email_verified: true },
    payload: {
      uid: 'user_123',
      displayName: 'Analyst',
      organization: 'Org',
      jobTitle: 'Planner',
      preferredCountry: 'United_States',
      preferredCategory: 'Fashion_Beauty',
      password: 'plaintext_password_123',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Orphaned Prediction Record Write Without Parent User Doc',
    collectionPath: 'users/nonexistent_user/predictions/pred_1',
    operation: 'create',
    authContext: { uid: 'nonexistent_user', email_verified: true },
    payload: {
      uid: 'nonexistent_user',
      modelType: 'divergence',
      modelDisplayName: 'Demand-to-Hype Divergence Score Predictor',
      countryName: 'United_States',
      category: 'Fashion_Beauty',
      summaryValue: '+0.4210',
      numericResult: 0.421,
      recordDate: '2026-09-20',
      predictionStatus: 'success',
      notes: '',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Immutable Prediction Result Tampering on Update',
    collectionPath: 'users/user_123/predictions/pred_1',
    operation: 'update',
    authContext: { uid: 'user_123', email_verified: true },
    payload: {
      numericResult: 0.9999,
      predictionStatus: 'error',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Invalid Model Identifier or Prediction Status Enum',
    collectionPath: 'users/user_123/predictions/pred_1',
    operation: 'create',
    authContext: { uid: 'user_123', email_verified: true },
    payload: {
      uid: 'user_123',
      modelType: 'unknown_model',
      modelDisplayName: 'Unknown',
      countryName: 'United_States',
      category: 'Fashion_Beauty',
      summaryValue: '0.0',
      numericResult: 0,
      recordDate: '2026-09-20',
      predictionStatus: 'unknown_status',
      notes: '',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Resource Exhaustion String Overflow on Notes (>500 chars)',
    collectionPath: 'users/user_123/predictions/pred_1',
    operation: 'update',
    authContext: { uid: 'user_123', email_verified: true },
    payload: {
      notes: 'X'.repeat(2000),
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Path Variable ID Poisoning with Invalid Characters',
    collectionPath: 'users/user_123/predictions/invalid$id!@#',
    operation: 'create',
    authContext: { uid: 'user_123', email_verified: true },
    payload: {},
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Server Timestamp Forgery (Backdated createdAt)',
    collectionPath: 'users/user_123/predictions/pred_1',
    operation: 'create',
    authContext: { uid: 'user_123', email_verified: true },
    payload: {
      createdAt: '2020-01-01T00:00:00Z',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Terminal State Bypass on Resolved ContactInquiry',
    collectionPath: 'contactInquiries/inq_1',
    operation: 'update',
    authContext: { uid: 'user_123', email_verified: true },
    payload: {
      status: 'submitted',
      message: 'Attempting to reopen a resolved ticket',
    },
    expectedOutcome: 'PERMISSION_DENIED',
  },
];
