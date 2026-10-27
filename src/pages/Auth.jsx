import { useState } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useApp } from "../store/AppContext";
import { Seo, Spinner } from "../components/ui";
import { isValidMobile, randomCode, storage, toEn } from "../lib/utils";

const ERR = {
  "auth/invalid-credential": "ایمیل یا رمز عبور اشتباه است",
  "auth/wrong-password": "ایمیل یا رمز عبور اشتباه است",
  "auth/user-not-found": "حسابی با این ایمیل پیدا نشد",
  "auth/email-already-in-use": "این ایمیل قبلاً ثبت شده؛ وارد شو",
  "auth/invalid-email": "ایمیل معتبر نیست",
  "auth/weak-password": "رمز عبور باید حداقل ۶ کاراکتر باشد",
  "auth/too-many-requests": "تلاش زیاد بود؛ چند دقیقه دیگر امتحان کن",
  "auth/network-request-failed": "اتصال اینترنت را بررسی کن",
};
export const authError = (e) => ERR[e?.code] || "خطایی رخ داد؛ دوباره امتحان کن";

export function AuthShell({ icon, title, sub, children }) {
  return (
    <div className="auth">
      <motion.div className="auth-card" initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: "spring", damping: 18 }}>
        <motion.div className="auth-icon" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 4 }}>{icon}</motion.div>
        <h1>{title}</h1>
        <p className="muted">{sub}</p>
        {children}
      </motion.div>
    </div>
  );
}

export function Login() {
  const { user, notify } = useApp();
  const [sp] = useSearchParams();
  const next = sp.get("next") || "/account";
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={next} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
      notify("خوش اومدی! 👋");
      nav(next, { replace: true });
    } catch (err) {
      notify(authError(err), "err");
    }
    setBusy(false);
  };

  return (
    <AuthShell icon="🐾" title="ورود به حساب" sub="خوشحالیم که دوباره می‌بینیمت!">
      <Seo title="ورود" noindex />
      <form onSubmit={submit} className="stack">
        <label className="field"><span>ایمیل</span><input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></label>
        <label className="field"><span>رمز عبور</span><input type="password" dir="ltr" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required /></label>
        <button className="btn btn-p btn-block" disabled={busy}>{busy ? <Spinner /> : "ورود"}</button>
      </form>
      <div className="auth-links">
        <Link to="/reset-password">رمز را فراموش کردی؟</Link>
        <span>حساب نداری؟ <Link to={`/register${sp.get("next") ? `?next=${encodeURIComponent(next)}` : ""}`}>ثبت‌نام کن</Link></span>
      </div>
    </AuthShell>
  );
}

export function Register() {
  const { user, notify } = useApp();
  const [sp] = useSearchParams();
  const next = sp.get("next") || "/account";
  const nav = useNavigate();
  const [f, setF] = useState({ name: "", phone: "", email: "", pass: "", ref: sp.get("ref") || storage.get("ggj-ref", "") });
  const [busy, setBusy] = useState(false);
  if (user && !busy) return <Navigate to={next} replace />;
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return notify("نامت را وارد کن", "err");
    if (!isValidMobile(f.phone)) return notify("شماره موبایل معتبر نیست", "err");
    if (f.pass.length < 6) return notify("رمز عبور حداقل ۶ کاراکتر", "err");
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, f.email.trim(), f.pass);
      await updateProfile(cred.user, { displayName: f.name.trim() }).catch(() => {});
      let referredBy = "";
      const refCode = toEn(f.ref).trim().toUpperCase();
      if (refCode) {
        const r = await getDoc(doc(db, "referralCodes", refCode)).catch(() => null);
        if (r?.exists() && r.data().uid !== cred.user.uid) referredBy = refCode;
        else notify("کد معرف معتبر نبود؛ ثبت‌نام بدون آن انجام شد", "err");
      }
      const referralCode = randomCode(6);
      await setDoc(doc(db, "referralCodes", referralCode), { uid: cred.user.uid, createdAt: serverTimestamp() });
      await setDoc(doc(db, "users", cred.user.uid), {
        name: f.name.trim(),
        phone: toEn(f.phone).trim(),
        email: f.email.trim(),
        referralCode,
        referredBy,
        addresses: [],
        wishlist: storage.get("ggj-wish", []),
        createdAt: serverTimestamp(),
      });
      sendEmailVerification(cred.user).catch(() => {});
      storage.set("ggj-ref", "");
      notify("ثبت‌نام انجام شد! ایمیل تأیید برایت فرستادیم 📧");
      nav(next, { replace: true });
    } catch (err) {
      notify(authError(err), "err");
    }
    setBusy(false);
  };

  return (
    <AuthShell icon="🎉" title="عضو خانواده گوگوجی شو" sub="ثبت‌نام رایگان؛ پیگیری سفارش، آدرس‌های ذخیره‌شده و تخفیف معرفی دوستان">
      <Seo title="ثبت‌نام" noindex />
      <form onSubmit={submit} className="stack">
        <label className="field"><span>نام و نام خانوادگی</span><input value={f.name} onChange={set("name")} autoComplete="name" required /></label>
        <label className="field"><span>موبایل</span><input value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="۰۹۱۲۱۲۳۴۵۶۷" autoComplete="tel" required /></label>
        <label className="field"><span>ایمیل</span><input type="email" dir="ltr" value={f.email} onChange={set("email")} autoComplete="email" required /></label>
        <label className="field"><span>رمز عبور</span><input type="password" dir="ltr" value={f.pass} onChange={set("pass")} autoComplete="new-password" placeholder="حداقل ۶ کاراکتر" required /></label>
        <label className="field"><span>کد معرف (اختیاری)</span><input dir="ltr" value={f.ref} onChange={set("ref")} placeholder="اگر دوستت معرفی کرده" /></label>
        <button className="btn btn-p btn-block" disabled={busy}>{busy ? <Spinner /> : "ثبت‌نام"}</button>
      </form>
      <div className="auth-links"><span>حساب داری؟ <Link to="/login">وارد شو</Link></span></div>
    </AuthShell>
  );
}

export function ResetPassword() {
  const { notify } = useApp();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (err) {
      notify(authError(err), "err");
    }
  };
  return (
    <AuthShell icon="🔑" title="بازیابی رمز عبور" sub="لینک تغییر رمز به ایمیلت فرستاده می‌شود">
      <Seo title="بازیابی رمز" noindex />
      {sent ? (
        <div className="alert alert-ok">ایمیل بازیابی ارسال شد. پوشه Spam را هم چک کن.</div>
      ) : (
        <form onSubmit={submit} className="stack">
          <label className="field"><span>ایمیل</span><input type="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <button className="btn btn-p btn-block">ارسال لینک بازیابی</button>
        </form>
      )}
      <div className="auth-links"><Link to="/login">بازگشت به ورود</Link></div>
    </AuthShell>
  );
}
