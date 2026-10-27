// ابزار مشترک توابع سرور (Netlify Functions)
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { computeTotals } from "../../src/lib/pricing.js";

export const ADMIN_EMAIL = "masood.malek225@gmail.com";
export { FieldValue };

export function admin() {
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID || "googoji-ae717",
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
      }),
    });
  }
  return { db: getFirestore(), auth: getAuth() };
}

export const json = (status, body) => ({ statusCode: status, headers: { "Content-Type": "application/json; charset=utf-8" }, body: JSON.stringify(body) });

// ---------- Bale Bot API ----------
export async function bale(method, payload) {
  const r = await fetch(`https://tapi.bale.ai/bot${process.env.BALE_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const j = await r.json().catch(() => ({}));
  if (!j.ok) console.error("bale", method, j);
  return j;
}

export const notifyAdmin = (text) => (process.env.BALE_ADMIN_CHAT_ID ? bale("sendMessage", { chat_id: process.env.BALE_ADMIN_CHAT_ID, text }) : null);

export const fa = (n) => Number(n || 0).toLocaleString("fa-IR");

// ---------- محاسبه مبلغ واقعی سفارش در سرور ----------
export async function serverTotal(db, order) {
  const settings = (await db.doc("settings/main").get()).data() || {};
  const items = [];
  for (const i of order.items || []) {
    const p = (await db.doc(`products/${i.id}`).get()).data();
    if (!p || !(Number(p.price) > 0)) throw new Error(`محصول ${i.name} قیمت ندارد`);
    items.push({ id: i.id, name: p.name, price: Number(p.price), qty: Number(i.qty), stock: Number(p.stock ?? 0) });
  }
  let coupon = null;
  if (order.couponCode) {
    const c = await db.doc(`coupons/${order.couponCode}`).get();
    if (c.exists) coupon = { code: c.id, ...c.data() };
  }
  let referralFirstOrder = false;
  if (order.referral) {
    const prev = await db.collection("orders").where("userId", "==", order.userId).get();
    referralFirstOrder = !prev.docs.some((d) => d.id !== order.id && ["پرداخت شده", "در حال آماده‌سازی", "ارسال شده", "تحویل داده شد"].includes(d.data().status));
  }
  return { items, settings, ...computeTotals(items, { settings, coupon, uid: order.userId, referralFirstOrder }) };
}

// ---------- ثبت پرداخت موفق: وضعیت، موجودی، کد تخفیف، پاداش معرف ----------
export async function markPaid(db, orderId, payment) {
  const ref = db.doc(`orders/${orderId}`);
  let order;
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    order = { id: snap.id, ...snap.data() };
    if (["پرداخت شده", "در حال آماده‌سازی", "ارسال شده", "تحویل داده شد"].includes(order.status)) return;
    tx.update(ref, { status: "پرداخت شده", adminSeen: false, paymentMethod: "bale", payment: { ...payment, paidAt: FieldValue.serverTimestamp() } });
    for (const i of order.items || []) tx.update(db.doc(`products/${i.id}`), { stock: FieldValue.increment(-Number(i.qty || 0)) });
    if (order.couponCode) tx.update(db.doc(`coupons/${order.couponCode}`), { used: FieldValue.increment(1) });
  });
  if (order.referral) {
    const r = await db.doc(`referralCodes/${order.referral}`).get();
    const uid = r.data()?.uid;
    if (uid) {
      const settings = (await db.doc("settings/main").get()).data() || {};
      const code = "REF-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      await db.doc(`coupons/${code}`).set({ percent: Number(settings.referralPercent || 10), uid, maxUses: 1, used: 0, active: true, note: `پاداش معرفی — سفارش ${order.trackingCode}`, createdAt: FieldValue.serverTimestamp() });
      await db.doc(`users/${uid}`).set({ rewardCoupons: FieldValue.arrayUnion(code) }, { merge: true });
    }
  }
  return order;
}

export async function verifyAdmin(event) {
  const token = (event.headers.authorization || event.headers.Authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return false;
  try {
    const u = await admin().auth.verifyIdToken(token);
    return u.email === ADMIN_EMAIL && u.email_verified;
  } catch {
    return false;
  }
}
