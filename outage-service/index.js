/**
 * TaiwanOMG 停電 / 維護公告微服務
 *
 * 設計理念：
 *  - 主後端在停電 / 維護期間可能無法回應，前端需要一個獨立來源讀取公告。
 *  - 利用 Firebase Functions + Firestore：
 *      1) 超級使用者（或後端）以 POST 寫入公告，需附帶 X-API-Key。
 *      2) 公告寫入 Firestore 的 system/outage 文件。
 *      3) 前端可直接用 Firestore SDK 讀取（推薦，連線獨立於主後端），
 *         或呼叫本服務的 GET endpoint 作為備援。
 *
 * Endpoints (HTTP, region: asia-east1)
 *   GET    /              健康檢查
 *   GET    /announcement  取得目前公告（公開）
 *   POST   /announcement  建立 / 更新公告（需 X-API-Key）
 *   DELETE /announcement  下架公告（需 X-API-Key）
 *
 * Firestore schema (collection/document: system/outage)
 *   {
 *     active:      boolean,            // 是否啟用
 *     mode:        'blocking'|'preview', // blocking = 強制顯示；preview = 可關閉
 *     title:       string,
 *     content:     string,
 *     startAt:     Timestamp,
 *     endAt:       Timestamp,
 *     updatedAt:   Timestamp (server),
 *     updatedBy:   string  (識別來源，如 'admin:<uid>' 或 'backend')
 *   }
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { setGlobalOptions, logger } = require('firebase-functions/v2');
const admin = require('firebase-admin');

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: 'asia-east1', maxInstances: 10 });

// X-API-Key 透過 Secret Manager 管理：firebase functions:secrets:set OUTAGE_API_KEY
const OUTAGE_API_KEY = defineSecret('OUTAGE_API_KEY');

const DOC_PATH = { collection: 'system', doc: 'outage' };

function setCors(res) {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, X-API-Key');
  res.set('Access-Control-Max-Age', '3600');
}

function unauthorized(res) {
  return res.status(401).json({ error: 'invalid or missing X-API-Key' });
}

function badRequest(res, msg) {
  return res.status(400).json({ error: msg });
}

function parseDate(value, field) {
  if (!value) throw new Error(`${field} is required`);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new Error(`${field} is not a valid date`);
  return admin.firestore.Timestamp.fromDate(d);
}

function validatePayload(body) {
  if (!body || typeof body !== 'object') throw new Error('invalid JSON body');
  const mode = body.mode || 'preview';
  if (!['blocking', 'preview'].includes(mode)) {
    throw new Error("mode must be 'blocking' or 'preview'");
  }
  const title = String(body.title || '').trim();
  const content = String(body.content || '').trim();
  if (!title) throw new Error('title is required');
  if (!content) throw new Error('content is required');

  const startAt = parseDate(body.startAt, 'startAt');
  const endAt = parseDate(body.endAt, 'endAt');
  if (endAt.toMillis() <= startAt.toMillis()) {
    throw new Error('endAt must be later than startAt');
  }

  return {
    active: body.active !== false,
    mode,
    title,
    content,
    startAt,
    endAt,
    updatedBy: String(body.updatedBy || 'backend').slice(0, 120),
  };
}

exports.outage = onRequest(
  { secrets: [OUTAGE_API_KEY], cors: false },
  async (req, res) => {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(204).send('');

    const path = (req.path || '/').replace(/\/+$/, '') || '/';

    try {
      if (path === '/' && req.method === 'GET') {
        return res.json({ ok: true, service: 'outage-service' });
      }

      if (path === '/announcement' && req.method === 'GET') {
        const snap = await db.collection(DOC_PATH.collection).doc(DOC_PATH.doc).get();
        if (!snap.exists) return res.json({ active: false });
        return res.json(snap.data());
      }

      const apiKey = req.get('X-API-Key');
      if (!apiKey || apiKey !== OUTAGE_API_KEY.value()) {
        return unauthorized(res);
      }

      if (path === '/announcement' && req.method === 'POST') {
        let payload;
        try {
          payload = validatePayload(req.body);
        } catch (e) {
          return badRequest(res, e.message);
        }
        const data = {
          ...payload,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        };
        await db.collection(DOC_PATH.collection).doc(DOC_PATH.doc).set(data, { merge: false });
        logger.info('outage announcement updated', { updatedBy: payload.updatedBy });
        return res.json({ ok: true });
      }

      if (path === '/announcement' && req.method === 'DELETE') {
        await db.collection(DOC_PATH.collection).doc(DOC_PATH.doc).set(
          {
            active: false,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedBy: String(req.body?.updatedBy || 'backend').slice(0, 120),
          },
          { merge: true },
        );
        return res.json({ ok: true });
      }

      return res.status(404).json({ error: 'not found' });
    } catch (err) {
      logger.error('outage-service error', err);
      return res.status(500).json({ error: 'internal error' });
    }
  },
);
