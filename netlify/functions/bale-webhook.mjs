// وبهوک بازوی بله: صدور صورت‌حساب کیف پول، تأیید قبل از پرداخت و ثبت پرداخت موفق
import { admin, bale, fa, json, markPaid, notifyAdmin, serverTotal } from "../lib/shared.mjs";

const SITE = process.env.SITE_URL || "https://googoji.ir";

async function sendInvoice(db, chatId, orderId) {
  const snap = await db.doc(`orders/${orderId}`).get();
  if (!snap.exists) return bale("sendMessage", { chat_id: chatId, text: "❌ سفارش پیدا نشد. لطفاً از سایت دوباره روی «پرداخت با بله‌پی» بزنید." });
  const order = { id: snap.id, ...snap.data() };
  if (order.status !== "در انتظار پرداخت" && order.status !== "در انتظار تأیید رسید")
    return bale("sendMessage", { chat_id: chatId, text: `✅ این سفارش (${order.trackingCode}) قبلاً پرداخت شده است.\nوضعیت: ${order.status}` });

  let t;
  try {
    t = await serverTotal(db, order);
  } catch (e) {
    return bale("sendMessage", { chat_id: chatId, text: `❌ ${e.message}. لطفاً با فروشگاه تماس بگیرید.` });
  }
  const short = t.items.find((i) => i.qty > i.stock);
  if (short) return bale("sendMessage", { chat_id: chatId, text: `❌ موجودی «${short.name}» کافی نیست. لطفاً با فروشگاه تماس بگیرید.` });

  await snap.ref.update({ serverTotal: t.total, baleChatId: String(chatId), paymentMethod: "bale" });
  // مبلغ به ریال؛ یک ردیف کل (تخفیف و ارسال در توضیحات آمده)
  const prices = [{ label: `سفارش ${order.trackingCode}`, amount: t.total * 10 }];
  return bale("sendInvoice", {
    chat_id: chatId,
    title: `سفارش گوگوجی ${order.trackingCode}`.slice(0, 32),
    description: `${t.items.map((i) => `${i.name}×${i.qty}`).join("، ")}${t.discount ? ` | تخفیف ${fa(t.discount)}` : ""} | مبلغ ${fa(t.total)} تومان`.slice(0, 255),
    payload: order.id,
    provider_token: process.env.BALE_PROVIDER_TOKEN,
    currency: "IRR",
    prices,
  });
}

export const handler = async (event) => {
  if (event.queryStringParameters?.secret !== process.env.BALE_WEBHOOK_SECRET) return json(403, { error: "forbidden" });
  const update = JSON.parse(event.body || "{}");
  const { db } = admin();

  try {
    // ۱) تأیید نهایی قبل از کسر پول (حداکثر ۱۰ ثانیه)
    if (update.pre_checkout_query) {
      const q = update.pre_checkout_query;
      const snap = await db.doc(`orders/${q.invoice_payload}`).get();
      const o = snap.data();
      const ok = !!o && (o.status === "در انتظار پرداخت" || o.status === "در انتظار تأیید رسید") && Number(q.total_amount) === Number(o.serverTotal) * 10;
      await bale("answerPreCheckoutQuery", { pre_checkout_query_id: q.id, ok, ...(!ok && { error_message: "سفارش معتبر نیست یا مبلغ تغییر کرده؛ دوباره از سایت اقدام کنید." }) });
      return json(200, { ok: true });
    }

    const msg = update.message;
    if (!msg) return json(200, { ok: true });
    const chatId = msg.chat.id;

    // ۲) پرداخت موفق
    if (msg.successful_payment) {
      const p = msg.successful_payment;
      const order = await markPaid(db, p.invoice_payload, {
        refId: p.provider_payment_charge_id || "",
        chargeId: p.telegram_payment_charge_id || "",
        amountRial: p.total_amount,
      });
      await bale("sendMessage", {
        chat_id: chatId,
        text: `🎉 پرداخت با موفقیت انجام شد!\n\nکد پیگیری سفارش: ${order.trackingCode}\nشماره پیگیری پرداخت: ${p.provider_payment_charge_id || "-"}\n\nسفارش شما در حال آماده‌سازی است.\nپیگیری: ${SITE}/order/${order.id}`,
      });
      await notifyAdmin(
        `💰 پرداخت جدید (بله‌پی)\nکد پیگیری: ${order.trackingCode}\nمبلغ: ${fa(p.total_amount / 10)} تومان\nمشتری: ${order.customerInfo?.fullName} — ${order.customerInfo?.mobile}\nآدرس: ${order.customerInfo?.address}\nاقلام: ${(order.items || []).map((i) => `${i.name}×${i.qty}`).join("، ")}\nشماره پیگیری بانکی: ${p.provider_payment_charge_id || "-"}`,
      );
      return json(200, { ok: true });
    }

    const text = (msg.text || "").trim();
    // ۳) شروع از لینک سایت: /start <orderId>
    if (text.startsWith("/start")) {
      const orderId = text.split(/\s+/)[1];
      if (orderId) await sendInvoice(db, chatId, orderId);
      else await bale("sendMessage", { chat_id: chatId, text: `سلام! 🐾 به بازوی پرداخت پت شاپ گوگوجی خوش آمدید.\nبرای خرید به ${SITE} بروید.` });
      return json(200, { ok: true });
    }
    // شناسه گفتگو برای تنظیم BALE_ADMIN_CHAT_ID
    if (text === "/id") await bale("sendMessage", { chat_id: chatId, text: `شناسه این گفتگو: ${chatId}` });
  } catch (e) {
    console.error(e);
  }
  return json(200, { ok: true });
};
