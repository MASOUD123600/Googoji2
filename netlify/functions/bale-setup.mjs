// فقط برای مدیر: ثبت وبهوک بازوی بله و ارسال پیام آزمایشی
import { bale, json, notifyAdmin, verifyAdmin } from "../lib/shared.mjs";

export const handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "method" });
  if (!(await verifyAdmin(event))) return json(401, { error: "فقط مدیر با ایمیل تأییدشده" });
  const missing = ["BALE_BOT_TOKEN", "BALE_PROVIDER_TOKEN", "BALE_WEBHOOK_SECRET", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"].filter((k) => !process.env[k]);
  if (missing.length) return json(400, { error: `این متغیرها در Netlify تنظیم نشده: ${missing.join(", ")}` });

  const { action } = JSON.parse(event.body || "{}");
  if (action === "webhook") {
    const site = process.env.SITE_URL || "https://googoji.ir";
    const r = await bale("setWebhook", { url: `${site}/.netlify/functions/bale-webhook?secret=${process.env.BALE_WEBHOOK_SECRET}` });
    return r.ok ? json(200, { message: "بازوی بله به سایت وصل شد ✅" }) : json(502, { error: r.description || "اتصال به سرور بله ناموفق بود" });
  }
  if (action === "test") {
    if (!process.env.BALE_ADMIN_CHAT_ID) return json(400, { error: "BALE_ADMIN_CHAT_ID تنظیم نشده (در بازو /id بفرستید)" });
    const r = await notifyAdmin("✅ پیام آزمایشی از سایت گوگوجی — اعلان سفارش‌ها به همین گفتگو می‌آید.");
    return r?.ok ? json(200, { message: "پیام آزمایشی ارسال شد" }) : json(502, { error: "ارسال پیام ناموفق بود" });
  }
  return json(400, { error: "action نامعتبر" });
};
