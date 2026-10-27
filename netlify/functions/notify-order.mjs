// اعلان سفارش جدید به بله مدیر (از صفحه تکمیل سفارش صدا زده می‌شود)
import { admin, fa, json, notifyAdmin } from "../lib/shared.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST" || !process.env.BALE_ADMIN_CHAT_ID || !process.env.FIREBASE_PRIVATE_KEY) return json(200, { skipped: true });
  const { orderId } = JSON.parse(event.body || "{}");
  if (!/^[A-Za-z0-9]{10,40}$/.test(orderId || "")) return json(400, { error: "bad id" });
  const { db } = admin();
  const ref = db.doc(`orders/${orderId}`);
  const snap = await ref.get();
  const o = snap.data();
  // هر سفارش فقط یک بار و فقط در چند دقیقه اول اعلان می‌شود
  if (!o || o.adminNotified || Date.now() - (o.createdAt?.toMillis?.() || 0) > 10 * 60 * 1000) return json(200, { skipped: true });
  await ref.update({ adminNotified: true });
  await notifyAdmin(
    `🛎️ سفارش جدید ثبت شد\nکد پیگیری: ${o.trackingCode}\nمبلغ: ${fa(o.total)} تومان\nروش پرداخت: ${o.paymentMethod === "bale" ? "بله‌پی" : "کارت به کارت"}\nمشتری: ${o.customerInfo?.fullName} — ${o.customerInfo?.mobile}\nاقلام: ${(o.items || []).map((i) => `${i.name}×${i.qty}`).join("، ")}`,
  );
  return json(200, { ok: true });
};
