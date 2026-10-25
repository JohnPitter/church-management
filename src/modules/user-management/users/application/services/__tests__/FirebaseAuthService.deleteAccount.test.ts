// Unit Tests - FirebaseAuthService: account deletion + deleted-account tombstone handling

import { FirebaseAuthService } from '../FirebaseAuthService';

jest.mock('@/config/firebase', () => ({
  auth: { currentUser: { uid: 'u1' } },
  db: {},
  functions: {}
}));

let mockAuthListener: ((user: any) => void) | null = null;
const mockSignOut = jest.fn();
jest.mock('firebase/auth', () => ({
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithPopup: jest.fn(),
  GoogleAuthProvider: jest.fn(),
  signOut: (...args: any[]) => mockSignOut(...args),
  onAuthStateChanged: (_auth: unknown, listener: (user: any) => void) => {
    mockAuthListener = listener;
    return jest.fn();
  },
  fetchSignInMethodsForEmail: jest.fn(),
  linkWithCredential: jest.fn(),
  EmailAuthProvider: { credential: jest.fn() }
}));

const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();
const mockOnSnapshot = jest.fn();
jest.mock('firebase/firestore', () => ({
  doc: (_db: unknown, collection: string, id: string) => `${collection}/${id}`,
  getDoc: (...args: any[]) => mockGetDoc(...args),
  setDoc: (...args: any[]) => mockSetDoc(...args),
  onSnapshot: (...args: any[]) => mockOnSnapshot(...args),
  Timestamp: { fromDate: (date: Date) => date }
}));

const mockCallable = jest.fn();
jest.mock('firebase/functions', () => ({
  httpsCallable: () => mockCallable
}));

const firebaseUser = (uid: string) => ({ uid, email: `${uid}@example.com`, displayName: uid, photoURL: null, phoneNumber: null });
const missingDoc = { exists: () => false };
const flush = () => new Promise(resolve => setTimeout(resolve, 0));

describe('FirebaseAuthService - account deletion', () => {
  let snapshotNext: ((snapshot: any) => Promise<void>) | null;

  beforeEach(() => {
    mockAuthListener = null;
    snapshotNext = null;
    mockOnSnapshot.mockImplementation((_ref: unknown, next: any) => {
      snapshotNext = next;
      return jest.fn();
    });
    mockGetDoc.mockResolvedValue(missingDoc);
    mockSignOut.mockResolvedValue(undefined);
  });

  it('does not recreate users/{uid} when the rules refuse it (tombstone) and stops listening to that uid', async () => {
    mockSetDoc.mockRejectedValue({ code: 'permission-denied' });
    const service = new FirebaseAuthService();
    const callback = jest.fn();
    service.onAuthStateChanged(callback);

    mockAuthListener!(firebaseUser('u1'));
    await snapshotNext!(missingDoc);

    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null);

    // A later auth event for the same (deleted) uid must not resubscribe or retry the create.
    mockOnSnapshot.mockClear();
    mockAuthListener!(firebaseUser('u1'));
    await flush();
    expect(mockOnSnapshot).not.toHaveBeenCalled();
    expect(mockSetDoc).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(null);
  });

  it('still creates the profile for a brand-new uid (normal sign-up / Google login)', async () => {
    mockSetDoc.mockResolvedValue(undefined);
    const service = new FirebaseAuthService();
    const callback = jest.fn();
    service.onAuthStateChanged(callback);

    mockAuthListener!(firebaseUser('new-uid'));
    await snapshotNext!(missingDoc);

    expect(mockSetDoc).toHaveBeenCalledWith('users/new-uid', expect.objectContaining({ role: 'member', status: 'pending' }));
    expect(callback).toHaveBeenLastCalledWith(expect.objectContaining({ id: 'new-uid', role: 'member', status: 'pending' }));
  });

  it('deleteAccount calls the callable, signs out and ignores the deleted uid afterwards', async () => {
    mockCallable.mockResolvedValue({ data: { success: true } });
    const service = new FirebaseAuthService();
    await service.deleteAccount();

    expect(mockCallable).toHaveBeenCalledWith({});
    expect(mockSignOut).toHaveBeenCalledTimes(1);

    const callback = jest.fn();
    service.onAuthStateChanged(callback);
    mockAuthListener!(firebaseUser('u1'));
    expect(callback).toHaveBeenCalledWith(null);
    expect(mockOnSnapshot).not.toHaveBeenCalled();
  });

  it('deleteAccount keeps the server message, code and details on failure and does not sign out', async () => {
    mockCallable.mockRejectedValue({
      code: 'functions/failed-precondition',
      message: 'Você é o último administrador do sistema.',
      details: { reason: 'last-admin' }
    });
    const service = new FirebaseAuthService();

    await expect(service.deleteAccount()).rejects.toMatchObject({
      message: 'Você é o último administrador do sistema.',
      code: 'functions/failed-precondition',
      details: { reason: 'last-admin' }
    });
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
