import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Save } from "lucide-react";
import { auth, db } from "../firebase";
import { useApp } from "../store/AppContext";
import { Spinner } from "../components/ui";
import { THEMES } from "../config";

// بیرون از کامپوننت اصلی تعریف شده تا با هر تایپ، فوکوس input از بین نرود (باگ نسخه ۴)
function Field({ label, value, onChange, type = "text", full, ltr, hint, rows }) {
  return (
    <label className={`field ${full ? "full" : ""}`}>
      <span>{label}</span>
      {rows ? (
        <textarea rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} dir={ltr ? "ltr" : undefined} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
      {hint && <small className="muted">{hint}</small>}
    </label>
  );
}

const Section = ({ title, children }) => (
  <section className="card">
    <h3 className="card-title">{title}</h3>
    <div className="form-grid">{children}</div>
  </section>
);

async function callFn(name, body) {
  const token = await auth.currentUser.getIdToken();
  const r = await fetch(`/.netlify/functions/${name}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body || {}) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
  return j;
}

export default function SettingsPage() {
  const { settings, notify } = useApp();
  const [s, setS] = useState(settings);
  const [priv, setPriv] = useState({ buildHook: "" });
  const [busy, setBusy] = useState("");
  useEffect(() => { setS(settings); }, [settings]);
  useEffect(() => {
    getDoc(doc(db, "private", "main")).then((d) => d.exists() && setPriv(d.data())).catch(() => {});
  }, []);
  const bind = (k) => ({ value: s[k], onChange: (v) => setS((x) => ({ ...x, [k]: v })) });

  const save = async () => {
    setBusy("save");
    try {
      await setDoc(doc(db, "settings", "main"), s);
      await setDoc(doc(db, "private", "main"), priv, { merge: true });
      notify("تنظیمات ذخیره شد و روی سایت اعمال شد ✅");
    } catch {
      notify("ذخیره ناموفق بود", "err");
    }
    setBusy("");
  };

  const run = async (key, fn) => {
    setBusy(key);
    try {
      const r = await fn();
      notify(r?.message || "انجام شد ✅");
    } catch (e) {
      notify(`خطا: ${e.message}`, "err");
    }
    setBusy("");
  };

  const rebuild = () =>
    run("seo", async () => {
      if (!priv.buildHook) throw new Error("آدرس Build hook وارد نشده");
      await fetch(priv.buildHook, { method: "POST", mode: "no-cors" });
      return { message: "بیلد جدید شروع شد؛ چند دقیقه بعد صفحات سئو به‌روز می‌شوند" };
    });

  return (
    <div className="stack settings">
      <Section title="🎨 ظاهر و رنگ‌بندی">
        <div className="full themes">
          {Object.entries(THEMES).map(([k, { label, ...t }]) => (
            <button key={k} type="button" className="theme-btn" onClick={() => setS((x) => ({ ...x, ...t }))}>
              <span style={{ background: t.primaryColor }} /><span style={{ background: t.accentColor }} /><span style={{ background: t.hotColor }} />
              {label}
            </button>
          ))}
        </div>
        {[["primaryColor", "رنگ اصلی"], ["darkColor", "رنگ تیره"], ["accentColor", "رنگ تأکیدی"], ["hotColor", "رنگ تخفیف"], ["bgColor", "پس‌زمینه"]].map(([k, l]) => (
          <label key={k} className="field color-field">
            <span>{l}</span>
            <div><input type="color" value={s[k] || "#000000"} onChange={(e) => setS((x) => ({ ...x, [k]: e.target.value }))} /><input dir="ltr" value={s[k] || ""} onChange={(e) => setS((x) => ({ ...x, [k]: e.target.value }))} /></div>
          </label>
        ))}
      </Section>

      <Section title="🏪 متن‌های سایت">
        <Field label="نام فروشگاه" {...bind("siteName")} />
        <Field label="شعار" {...bind("tagline")} />
        <Field label="نوار اطلاع‌رسانی بالای سایت" {...bind("announcement")} full />
        <Field label="تیتر اصلی" {...bind("heroTitle")} />
        <Field label="بخش رنگی تیتر" {...bind("heroHighlight")} />
        <Field label="متن زیر تیتر" {...bind("heroSubtitle")} full rows={2} />
        <Field label="دکمه اول" {...bind("heroBtn1")} />
        <Field label="دکمه دوم" {...bind("heroBtn2")} />
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="full feat-row">
            <Field label={`ویژگی ${n} — آیکن`} {...bind(`feat${n}Icon`)} />
            <Field label="عنوان" {...bind(`feat${n}Title`)} />
            <Field label="توضیح" {...bind(`feat${n}Desc`)} />
          </div>
        ))}
        <Field label="متن فوتر" {...bind("footerDesc")} full rows={2} />
      </Section>

      <Section title="📞 اطلاعات تماس">
        <Field label="تلفن اصلی" {...bind("phone")} ltr />
        <Field label="تلفن دوم" {...bind("phone2")} ltr />
        <Field label="ایمیل" {...bind("email")} ltr />
        <Field label="ساعت کاری" {...bind("workHours")} />
        <Field label="آدرس" {...bind("address")} full />
        <Field label="لینک نقشه (بلد / نشان / گوگل)" {...bind("mapUrl")} ltr full hint="لینک لوکیشن فروشگاه را از اپ نشان یا بلد کپی کن" />
        <Field label="آیدی اینستاگرام (بدون @)" {...bind("instagram")} ltr />
        <Field label="آیدی تلگرام" {...bind("telegram")} ltr />
        <Field label="آیدی بله" {...bind("bale")} ltr />
      </Section>

      <Section title="🚚 ارسال و تخفیف">
        <Field label="هزینه ارسال (تومان) — ۰ یعنی رایگان" {...bind("shippingCost")} />
        <Field label="حداقل خرید برای ارسال رایگان" {...bind("freeShippingMin")} />
        <Field label="درصد تخفیف معرفی دوستان" {...bind("referralPercent")} />
      </Section>

      <Section title="💳 پرداخت">
        <label className="check full"><input type="checkbox" checked={s.cardPayEnabled !== false} onChange={(e) => setS((x) => ({ ...x, cardPayEnabled: e.target.checked }))} /> کارت به کارت (با آپلود رسید و تأیید شما)</label>
        <Field label="شماره کارت" {...bind("cardNumber")} ltr />
        <Field label="نام صاحب کارت" {...bind("cardHolder")} />
        <Field label="نام بانک" {...bind("cardBank")} />
        <div className="full divider" />
        <label className="check full"><input type="checkbox" checked={!!s.balePayEnabled} onChange={(e) => setS((x) => ({ ...x, balePayEnabled: e.target.checked }))} /> پرداخت آنلاین با بله‌پی</label>
        <Field label="نام کاربری بازوی بله (بدون @)" {...bind("baleBotUsername")} ltr hint="مثلاً googoji_pay_bot — از @botfather در بله ساخته می‌شود" />
        <div className="full row-gap">
          <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => run("hook", () => callFn("bale-setup", { action: "webhook" }))}>{busy === "hook" ? <Spinner /> : "🔗 اتصال بازوی بله به سایت"}</button>
          <button type="button" className="btn btn-ghost" disabled={!!busy} onClick={() => run("test", () => callFn("bale-setup", { action: "test" }))}>{busy === "test" ? <Spinner /> : "📨 پیام آزمایشی به بله مدیر"}</button>
        </div>
        <small className="muted full">توکن بازو و توکن کیف پول فقط در تنظیمات Netlify (Environment variables) قرار می‌گیرند، نه اینجا. راهنما در فایل SETUP-FA.md است.</small>
      </Section>

      <Section title="🔍 سئو">
        <label className="field full">
          <span>Netlify Build hook (خصوصی)</span>
          <input dir="ltr" value={priv.buildHook || ""} onChange={(e) => setPriv((x) => ({ ...x, buildHook: e.target.value }))} placeholder="https://api.netlify.com/build_hooks/..." />
          <small className="muted">بعد از اضافه کردن یا تغییر محصولات، با دکمه زیر صفحات مخصوص گوگل و نقشه سایت دوباره ساخته می‌شوند.</small>
        </label>
        <button type="button" className="btn btn-ghost" onClick={rebuild} disabled={!!busy}>{busy === "seo" ? <Spinner /> : "🔄 به‌روزرسانی صفحات سئو"}</button>
      </Section>

      <div className="save-bar">
        <span>تغییرات بعد از ذخیره فوری روی سایت اعمال می‌شوند</span>
        <button className="btn btn-accent" onClick={save} disabled={!!busy}>{busy === "save" ? <Spinner /> : <><Save size={17} /> ذخیره همه تنظیمات</>}</button>
      </div>
    </div>
  );
}
