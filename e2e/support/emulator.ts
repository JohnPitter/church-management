// Acesso direto aos emulators do Firebase (Auth e Firestore) para semear e conferir dados.
// A escrita usa o token "owner", que ignora as regras (como o Admin SDK);
// já o app sob teste continua sujeito às regras reais de firestore.rules.

export const PROJECT_ID = 'demo-e2e';
const AUTH_URL = 'http://127.0.0.1:9099';
const FIRESTORE_URL = 'http://127.0.0.1:8080';
const DOCS_URL = `${FIRESTORE_URL}/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
const OWNER = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' };

export type Role =
  | 'admin'
  | 'secretary'
  | 'member'
  | 'educator'
  | 'pedagogical_coordinator'
  | 'professional'
  | 'finance'
  | 'leader';

export type Status = 'approved' | 'pending';

export interface SeededUser {
  uid: string;
  email: string;
  password: string;
  displayName: string;
  role: Role;
  status: Status;
}

type FirestoreValue = Record<string, unknown>;

function toValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) return { nullValue: null };
  if (value instanceof Date) return { timestampValue: value.toISOString() };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toValue) } };
  if (typeof value === 'object') {
    return { mapValue: { fields: toFields(value as Record<string, unknown>) } };
  }
  throw new Error(`Tipo não suportado: ${typeof value}`);
}

function toFields(data: Record<string, unknown>): Record<string, FirestoreValue> {
  return Object.fromEntries(Object.entries(data).map(([key, value]) => [key, toValue(value)]));
}

function fromValue(value: FirestoreValue): unknown {
  if ('stringValue' in value) return value.stringValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('timestampValue' in value) return new Date(value.timestampValue as string);
  if ('nullValue' in value) return null;
  if ('arrayValue' in value) {
    const values = (value.arrayValue as { values?: FirestoreValue[] }).values ?? [];
    return values.map(fromValue);
  }
  if ('mapValue' in value) {
    const fields = (value.mapValue as { fields?: Record<string, FirestoreValue> }).fields ?? {};
    return Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, fromValue(v)]));
  }
  return undefined;
}

async function ensureOk(response: Response, action: string): Promise<void> {
  if (!response.ok) {
    throw new Error(`${action} falhou (${response.status}): ${await response.text()}`);
  }
}

/** Apaga todas as contas do Auth e todos os documentos do Firestore. */
export async function resetEmulators(): Promise<void> {
  await ensureOk(
    await fetch(`${AUTH_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`, { method: 'DELETE' }),
    'Limpar Auth'
  );
  await ensureOk(
    await fetch(`${FIRESTORE_URL}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`, {
      method: 'DELETE'
    }),
    'Limpar Firestore'
  );
}

export async function setDoc(path: string, data: Record<string, unknown>): Promise<void> {
  await ensureOk(
    await fetch(`${DOCS_URL}/${path}`, {
      method: 'PATCH',
      headers: OWNER,
      body: JSON.stringify({ fields: toFields(data) })
    }),
    `Gravar ${path}`
  );
}

export async function getDoc(path: string): Promise<Record<string, unknown> | null> {
  const response = await fetch(`${DOCS_URL}/${path}`, { headers: OWNER });
  if (response.status === 404) return null;
  await ensureOk(response, `Ler ${path}`);
  const body = (await response.json()) as { fields?: Record<string, FirestoreValue> };
  return Object.fromEntries(Object.entries(body.fields ?? {}).map(([k, v]) => [k, fromValue(v)]));
}

export async function listDocs(collection: string): Promise<Array<Record<string, unknown> & { id: string }>> {
  const response = await fetch(`${DOCS_URL}/${collection}?pageSize=300`, { headers: OWNER });
  await ensureOk(response, `Listar ${collection}`);
  const body = (await response.json()) as {
    documents?: Array<{ name: string; fields?: Record<string, FirestoreValue> }>;
  };
  return (body.documents ?? []).map(doc => ({
    id: doc.name.split('/').pop() as string,
    ...Object.fromEntries(Object.entries(doc.fields ?? {}).map(([k, v]) => [k, fromValue(v)]))
  }));
}

/** Cria a conta no Auth e o perfil em users/{uid}, como o app faz no cadastro. */
export async function seedUser(input: {
  email: string;
  password?: string;
  displayName: string;
  role: Role;
  status?: Status;
}): Promise<SeededUser> {
  const password = input.password ?? 'Senha@12345';
  const status = input.status ?? 'approved';
  const response = await fetch(
    `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=e2e-fake-key`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: input.email,
        password,
        displayName: input.displayName,
        returnSecureToken: true
      })
    }
  );
  await ensureOk(response, `Criar conta ${input.email}`);
  const { localId } = (await response.json()) as { localId: string };

  const now = new Date();
  await setDoc(`users/${localId}`, {
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    role: input.role,
    status,
    createdAt: now,
    updatedAt: now
  });
  return { uid: localId, email: input.email, password, displayName: input.displayName, role: input.role, status };
}
