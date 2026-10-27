import { arrayUnion, doc, getDoc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { db } from "../firebase";
import { randomCode } from "../lib/utils";

/**
 * تأیید پرداخت سفارش توسط مدیر (کارت به کارت):
 * وضعیت → پرداخت شده، کم کردن موجودی، شمارش کد تخفیف، صدور کد پاداش برای معرف
 */
export async function confirmPayment(order, settings) {
  const batch = writeBatch(db);
  batch.update(doc(db, "orders", order.id), {
    status: "پرداخت شده",
    adminSeen: true,
    payment: { ...(order.payment || {}), method: order.paymentMethod || "card", confirmedAt: serverTimestamp(), by: "admin" },
  });
  for (const i of order.items || []) batch.update(doc(db, "products", i.id), { stock: increment(-Number(i.qty || 0)) });
  if (order.couponCode) batch.update(doc(db, "coupons", order.couponCode), { used: increment(1) });
  let reward = "";
  if (order.referral) {
    const ref = await getDoc(doc(db, "referralCodes", order.referral)).catch(() => null);
    const uid = ref?.data()?.uid;
    if (uid) {
      reward = "REF-" + randomCode(6);
      batch.set(doc(db, "coupons", reward), {
        percent: Number(settings.referralPercent || 10),
        uid,
        maxUses: 1,
        used: 0,
        active: true,
        note: `پاداش معرفی — سفارش ${order.trackingCode}`,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, "users", uid), { rewardCoupons: arrayUnion(reward) }, { merge: true });
    }
  }
  await batch.commit();
  return reward;
}

export function printInvoice(order, settings) {
  const w = window.open("", "_blank", "width=800,height=900");
  if (!w) return;
  const fa = (v) => Number(v || 0).toLocaleString("fa-IR");
  const c = order.customerInfo || {};
  const rows = (order.items || [])
    .map((i, k) => `<tr><td>${fa(k + 1)}</td><td>${i.name}</td><td>${fa(i.qty)}</td><td>${fa(i.price)}</td><td>${fa(i.price * i.qty)}</td></tr>`)
    .join("");
  const date = order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString("fa-IR") : "";
  w.document.write(`<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>فاکتور ${order.trackingCode}</title>
<style>body{font-family:Vazirmatn,Tahoma,sans-serif;padding:28px;color:#222}h1{margin:0;font-size:22px}table{width:100%;border-collapse:collapse;margin:16px 0}
td,th{border:1px solid #ccc;padding:8px;text-align:right;font-size:13px}th{background:#f3eefa}.box{border:2px dashed #5B2A86;border-radius:12px;padding:14px;margin-top:16px}
.row{display:flex;justify-content:space-between}.big{font-size:20px;font-weight:800}</style></head><body>
<div class="row"><div><h1>🐾 ${settings.siteName}</h1><div>${settings.address}</div><div>تلفن: ${settings.phone}</div></div>
<div><div>کد پیگیری: <b>${order.trackingCode}</b></div><div>تاریخ: ${date}</div><div>وضعیت: ${order.status}</div></div></div>
<table><thead><tr><th>#</th><th>کالا</th><th>تعداد</th><th>قیمت واحد (تومان)</th><th>جمع (تومان)</th></tr></thead><tbody>${rows}</tbody></table>
<div class="row"><span>جمع کالاها</span><span>${fa(order.subtotal)} تومان</span></div>
${order.discount ? `<div class="row"><span>${order.discountLabel}</span><span>− ${fa(order.discount)} تومان</span></div>` : ""}
<div class="row"><span>ارسال</span><span>${order.shipping ? fa(order.shipping) + " تومان" : "رایگان"}</span></div>
<div class="row big"><span>مبلغ کل</span><span>${fa(order.total)} تومان</span></div>
<div class="box"><b>گیرنده:</b> ${c.fullName || ""} — ${c.mobile || ""}<br><b>آدرس:</b> ${c.province || ""}، ${c.city || ""}، ${c.address || ""}<br><b>کد پستی:</b> ${c.postalCode || ""}${c.notes ? `<br><b>توضیحات:</b> ${c.notes}` : ""}</div>
<script>setTimeout(()=>print(),300)</script></body></html>`);
  w.document.close();
}
