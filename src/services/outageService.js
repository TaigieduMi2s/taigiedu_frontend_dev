import { doc, onSnapshot } from 'firebase/firestore';
import { getOutageFirestore } from '../config/firebaseOutage';

function normalize(data) {
  if (!data) return null;
  const toDate = (v) => {
    if (!v) return null;
    if (typeof v.toDate === 'function') return v.toDate();
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  return {
    active: !!data.active,
    mode: data.mode === 'blocking' ? 'blocking' : 'preview',
    title: data.title || '',
    content: data.content || '',
    startAt: toDate(data.startAt),
    endAt: toDate(data.endAt),
    updatedBy: data.updatedBy || null,
  };
}

export function subscribeOutage(onChange) {
  const db = getOutageFirestore();
  if (!db) {
    onChange(null);
    return () => {};
  }
  const ref = doc(db, 'system', 'outage');
  return onSnapshot(
    ref,
    (snap) => onChange(snap.exists() ? normalize(snap.data()) : null),
    () => onChange(null)
  );
}
