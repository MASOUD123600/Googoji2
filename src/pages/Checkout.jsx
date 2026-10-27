import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { CreditCard, MessageCircle, Tag } from "lucide-react";
import { db } from "../firebase";
import { useApp } from "../store/AppContext";
import { Img, Seo, Spinner } from "../components/ui";
import { Steps } from "./Cart";
import { computeTotals, couponProblem } from "../lib/pricing";
import { fmt, genTrackingCode, isValidMobile, toEn, toFa } from "../lib/utils";

const EMPTY = { fullName: "", mobile: "", province: "تهران", city: "تهران", address: "", postalCode: "", notes: "" };

export default function Checkout() {
  const { user, profile, cartItems, settings: S, notify, clearCart } = useApp();
  const nav = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [saveAddr, setSaveAddr] = useState(true);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [checking, setChecking] = useState(false);
  const balePay = S.balePayEnabled && S.baleBotUsername;
  const cardPay = S.cardPayEnabled !== false;
  const [method, setMethod] = useState(balePay ? "bale" : "card");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const a = profile.addresses?.[0];
    setForm((f) => ({ ...f, fullName: f.fullName || profile.name || "", mobile: f.mobile || profile.phone || "", ...(a && !f.address ? a : {}) }));
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (user === null) return <Navigate to="/login?next=/checkout" replace />;
  if (user === undefined) return <div className="center-load"><Spinner /></div>;
  if (!cartItems.length) return <Navigate to="/cart" replace />;

  const referralFirstOrder = !!profile?.referredBy && !profile?.firstOrderDone;
  const t = computeTotals(cartItems, { settings: S, coupon, uid: user.uid, referralFirstOrder });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const applyCoupon = async () => {
    const c = toEn(code).trim().toUpperCase();
    if (!c) return;
    setChecking(true);
    try {
      const snap = await getDoc(doc(db, "coupons", c));
      const data = snap.exists() ? { code: c, ...snap.data() } : null;
      const problem = couponProblem(data, { subtotal: t.subtotal, uid: user.uid });
      if (problem) {
        notify(problem, "err");
        setCoupon(null);
      } else {
        setCoupon(data);
        notify("کد تخفیف اعمال شد 🎉");
      }
    } catch {
      notify("بررسی کد تخفیف ممکن نشد", "err");
    }
    setChecking(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.address.trim()) return notify("نام و آدرس را کامل وارد کن", "err");
    if (!isValidMobile(form.mobile)) return notify("شماره موبایل معتبر نیست (مثل ۰۹۱۲۱۲۳۴۵۶۷)", "err");
    if (!/^\d{10}$/.test(toEn(form.postalCode).trim())) return notify("کد پستی باید ۱۰ رقم باشد", "err");
    if (!balePay && !cardPay) return notify("فعلاً روش پرداختی فعال نیست؛ لطفاً تماس بگیرید", "err");
    const over = cartItems.find((i) => i.stock !== undefined && i.qty > Number(i.stock));
    if (over) return notify(`موجودی «${over.name}» کافی نیست`, "err");

    setBusy(true);
    try {
      const customerInfo = { ...form, mobile: toEn(form.mobile).trim(), postalCode: toEn(form.postalCode).trim() };
      const trackingCode = genTrackingCode();
      const ref = await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userEmail: user.email,
        customerInfo,
        items: cartItems.map((i) => ({ id: i.id, name: i.name, price: Number(i.price), qty: i.qty, image: i.images?.[0] || i.imageUrl || "" })),
        subtotal: t.subtotal,
        discount: t.discount,
        discountLabel: t.discountLabel,
        couponCode: t.discountLabel.startsWith("کد") ? coupon.code : "",
        referral: t.discountLabel === "تخفیف معرفی دوستان" ? profile.referredBy : "",
        shipping: t.shipping,
        total: t.total,
        trackingCode,
        status: "در انتظار پرداخت",
        paymentMethod: method,
        adminSeen: false,
        createdAt: serverTimestamp(),
      });
      const { notes, ...addr } = customerInfo; // eslint-disable-line no-unused-vars
      const others = (profile?.addresses || []).filter((a) => a.address !== addr.address);
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: profile?.name || form.fullName,
          phone: profile?.phone || customerInfo.mobile,
          ...(saveAddr && { addresses: [addr, ...others].slice(0, 5) }),
          ...(referralFirstOrder && { firstOrderDone: true }),
        },
        { merge: true },
      ).catch(() => {});
      // اعلان سفارش جدید به بله مدیر (در صورت تنظیم سرور)
      fetch("/.netlify/functions/notify-order", { method: "POST", body: JSON.stringify({ orderId: ref.id }) }).catch(() => {});
      clearCart();
      notify(`سفارش ثبت شد — کد پیگیری: ${trackingCode}`);
      nav(`/order/${ref.id}`, { replace: true });
    } catch (err) {
      console.error(err);
      notify("ثبت سفارش ناموفق بود؛ دوباره امتحان کن", "err");
    }
    setBusy(false);
  };

  return (
    <div className="container section">
      <Seo title="تکمیل سفارش" noindex />
      <Steps step={2} />
      <form className="checkout" onSubmit={submit}>
        <div className="stack">
          <div className="card">
            <h2 className="card-title">🏠 اطلاعات ارسال</h2>
            {profile?.addresses?.length > 1 && (
              <div className="chips">
                {profile.addresses.map((a, k) => (
                  <button type="button" key={k} className="chip" onClick={() => setForm((f) => ({ ...f, ...a }))}>{a.address.slice(0, 28)}…</button>
                ))}
              </div>
            )}
            <div className="form-grid">
              <label className="field full"><span>نام و نام خانوادگی گیرنده *</span><input value={form.fullName} onChange={set("fullName")} autoComplete="name" required /></label>
              <label className="field"><span>موبایل *</span><input value={form.mobile} onChange={set("mobile")} inputMode="tel" autoComplete="tel" placeholder="۰۹۱۲۱۲۳۴۵۶۷" required /></label>
              <label className="field"><span>کد پستی *</span><input value={form.postalCode} onChange={set("postalCode")} inputMode="numeric" placeholder="۱۰ رقم" required /></label>
              <label className="field"><span>استان</span><input value={form.province} onChange={set("province")} /></label>
              <label className="field"><span>شهر</span><input value={form.city} onChange={set("city")} /></label>
              <label className="field full"><span>آدرس کامل *</span><textarea rows={3} value={form.address} onChange={set("address")} placeholder="خیابان، کوچه، پلاک، واحد" required /></label>
              <label className="field full"><span>توضیحات (اختیاری)</span><textarea rows={2} value={form.notes} onChange={set("notes")} placeholder="مثلاً ساعت تحویل" /></label>
            </div>
            <label className="check"><input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} /> ذخیره این آدرس در حساب من</label>
          </div>

          <div className="card">
            <h2 className="card-title">💳 روش پرداخت</h2>
            <div className="pay-methods">
              {balePay && (
                <label className={`pay-opt ${method === "bale" ? "on" : ""}`}>
                  <input type="radio" name="pm" checked={method === "bale"} onChange={() => setMethod("bale")} />
                  <MessageCircle size={26} />
                  <div><b>پرداخت آنلاین با بله‌پی</b><small>پرداخت امن با کیف پول بله، تأیید خودکار و فوری</small></div>
                </label>
              )}
              {cardPay && (
                <label className={`pay-opt ${method === "card" ? "on" : ""}`}>
                  <input type="radio" name="pm" checked={method === "card"} onChange={() => setMethod("card")} />
                  <CreditCard size={26} />
                  <div><b>کارت به کارت</b><small>واریز به کارت فروشگاه و ارسال عکس رسید؛ تأیید توسط پشتیبانی</small></div>
                </label>
              )}
              {!balePay && !cardPay && <p className="muted">روش پرداخت فعال نیست؛ لطفاً با {toFa(S.phone)} تماس بگیرید.</p>}
            </div>
          </div>
        </div>

        <aside className="card summary">
          <h3 className="card-title">سفارش شما</h3>
          <div className="sum-items">
            {cartItems.map((i) => (
              <div key={i.id} className="sum-item">
                <Img src={i.images?.[0] || i.imageUrl} small alt="" />
                <span>{i.name} <small>× {toFa(i.qty)}</small></span>
                <b>{fmt(i.price * i.qty)}</b>
              </div>
            ))}
          </div>
          <div className="coupon">
            <Tag size={17} />
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="کد تخفیف" aria-label="کد تخفیف" />
            <button type="button" className="btn btn-sm btn-ghost" onClick={applyCoupon} disabled={checking}>{checking ? "..." : "اعمال"}</button>
          </div>
          <div className="row-between"><span>جمع کالاها</span><span>{fmt(t.subtotal)}</span></div>
          {t.discount > 0 && <div className="row-between good"><span>{t.discountLabel}</span><span>− {fmt(t.discount)}</span></div>}
          <div className="row-between"><span>ارسال</span><span>{t.shipping ? fmt(t.shipping) : "رایگان"}</span></div>
          <div className="row-between total"><span>مبلغ قابل پرداخت</span><b>{fmt(t.total)}</b></div>
          <button className="btn btn-p btn-block btn-lg" disabled={busy}>{busy ? <Spinner /> : "ثبت سفارش و رفتن به پرداخت"}</button>
          <p className="muted small center">با ثبت سفارش، <Link to="/terms">قوانین فروشگاه</Link> را می‌پذیرید.</p>
        </aside>
      </form>
    </div>
  );
}
