/**
 * Backfill birthMonth/birthDay em members legados.
 *
 * Uso (dry-run padrão):
 *   node scripts/backfill-birth-date-parts.mjs
 *   node scripts/backfill-birth-date-parts.mjs --apply
 *
 * Requer GOOGLE_APPLICATION_CREDENTIALS ou service account via firebase admin.
 * Em CI/local sem credenciais, usa fixtures embutidas para validar a lógica.
 *
 * A derivação é a mesma de getBirthDateParts (UTC): birthMonth 1-12, birthDay 1-31.
 */
import { createRequire } from 'module';
import { pathToFileURL } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const apply = process.argv.includes('--apply');

/** Mirror de getBirthDateParts — manter em sincronia com birthDateParts.ts */
function getBirthDateParts(date) {
  const d = date instanceof Date ? date : new Date(date);
  return {
    birthMonth: d.getUTCMonth() + 1,
    birthDay: d.getUTCDate(),
  };
}

function toDate(value) {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === 'object' && typeof value.toDate === 'function') {
    try {
      const d = value.toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

export function computeBirthPartsBackfill(doc) {
  if (typeof doc.birthMonth === 'number' && typeof doc.birthDay === 'number') return null;
  const birth = toDate(doc.birthDate) || toDate(doc.dataNascimento);
  if (!birth) return null;
  const parts = getBirthDateParts(birth);
  return { id: doc.id, birthMonth: parts.birthMonth, birthDay: parts.birthDay };
}

export function planBirthPartsBackfill(docs) {
  return docs.map(computeBirthPartsBackfill).filter(Boolean);
}

async function tryAdminSdk() {
  try {
    const require = createRequire(import.meta.url);
    // Prefer functions' firebase-admin if present
    let admin;
    try {
      admin = require(path.join(root, 'functions/node_modules/firebase-admin'));
    } catch {
      admin = require('firebase-admin');
    }
    if (!admin.apps.length) {
      admin.initializeApp();
    }
    const db = admin.firestore();
    const snap = await db.collection('members').get();
    const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    const plan = planBirthPartsBackfill(docs);
    console.log(`[backfill] members=${docs.length} toUpdate=${plan.length} apply=${apply}`);
    if (apply) {
      let batch = db.batch();
      let n = 0;
      for (const p of plan) {
        batch.update(db.collection('members').doc(p.id), {
          birthMonth: p.birthMonth,
          birthDay: p.birthDay,
        });
        n++;
        if (n % 400 === 0) {
          await batch.commit();
          batch = db.batch();
        }
      }
      if (n % 400 !== 0) await batch.commit();
      console.log(`[backfill] applied ${n} updates`);
    } else {
      console.log('[backfill] dry-run sample:', plan.slice(0, 5));
    }
    return true;
  } catch (e) {
    console.warn('[backfill] Admin SDK indisponível:', e.message);
    return false;
  }
}

function localFixtureDryRun() {
  const fixtures = [
    { id: 'indexed', birthDate: new Date(Date.UTC(1990, 0, 1)), birthMonth: 1, birthDay: 1 },
    { id: 'legacy-may', birthDate: new Date(Date.UTC(1990, 4, 15, 12, 0, 0)) },
    { id: 'legacy-pt', dataNascimento: new Date(Date.UTC(2000, 11, 31)) },
    { id: 'nodate' },
  ];
  const plan = planBirthPartsBackfill(fixtures);
  console.log('[backfill] fixture dry-run plan:', JSON.stringify(plan, null, 2));
  // Sanity: must match UTC parts
  const may = plan.find((p) => p.id === 'legacy-may');
  if (!may || may.birthMonth !== 5 || may.birthDay !== 15) {
    console.error('[backfill] FAIL: legacy-may parts incorrect', may);
    process.exit(1);
  }
  console.log('[backfill] fixture dry-run OK');
}

const ran = await tryAdminSdk();
if (!ran) {
  localFixtureDryRun();
}
