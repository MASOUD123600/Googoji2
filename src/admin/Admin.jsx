import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { collection, onSnapshot } from "firebase/firestore";
import { sendEmailVerification, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, ExternalLink, LayoutDashboard, LogOut, Menu, Package, Receipt, Settings, Tag, Users } from "lucide-react";
import { auth, db } from "../firebase";
import { useApp } from "../store/AppContext";
import { Logo, Seo, Spinner } from "../components/ui";
import { AuthShell, authError, resolveLoginEmail } from "../pages/Auth";
import { ADMIN_ALIAS, ADMIN_EMAIL } from "../config";
import { beep, storage, toFa } from "../lib/utils";
import Dashboard from "./Dashboard";
import Orders from "./Orders";
import Products from "./Products";
import { Coupons, Customers } from "./People";
import SettingsPage from "./SettingsPage";

function AdminLogin() {
  const { user, notify } = useApp();
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  if (user && user.email === ADMIN_EMAIL && !user.emailVerified)
    return (
      <AuthShell icon="📧" title="ایمیل مدیر تأیید نشده" sub="برای امنیت پنل، ایمیل مدیر باید تأیید شده باشد">
        <p>لینک تأیید را از صندوق ایمیل <b dir="ltr">{ADMIN_EMAIL}</b> باز کن (پوشه Spam را هم ببین)، بعد دکمه «تأیید کردم» را بزن.</p>
        <div className="stack">
          <button className="btn btn-p btn-block" onClick={() => user.reload().then(() => window.location.reload())}>تأیید کردم</button>
          <button className="btn btn-ghost btn-block" onClick={() => sendEmailVerification(user).then(() => notify("ایمیل تأیید دوباره ارسال شد"))}>ارسال دوباره ایمیل تأیید</button>
        </div>
      </AuthShell>
    );

  if (user && user.email !== ADMIN_EMAIL)
    return (
      <AuthShell icon="🔒" title="دسترسی ندارید" sub="این بخش فقط برای مدیر فروشگاه است">
        <div className="stack">
          <Link className="btn btn-p btn-block" to="/">بازگشت به فروشگاه</Link>
          <button className="btn btn-ghost btn-block" onClick={() => signOut(auth)}>ورود با حساب مدیر</button>
        </div>
      </AuthShell>
    );

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const email = await resolveLoginEmail(id).catch(() => id.trim());
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      notify(`خوش اومدی ${ADMIN_ALIAS}! ⚙️`);
    } catch (err) {
      notify(authError(err), "err");
    }
    setBusy(false);
  };

  return (
    <AuthShell icon="⚙️" title="ورود مدیریت" sub="پنل مدیریت فروشگاه گوگوجی">
      <Seo title="ورود مدیر" noindex />
      <form onSubmit={submit} className="stack">
        <label className="field"><span>نام کاربری یا ایمیل</span><input dir="ltr" value={id} onChange={(e) => setId(e.target.value)} placeholder={ADMIN_ALIAS} autoComplete="username" required /></label>
        <label className="field"><span>رمز عبور</span><input type="password" dir="ltr" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" required /></label>
        <button className="btn btn-p btn-block" disabled={busy}>{busy ? <Spinner /> : "ورود به پنل"}</button>
      </form>
      <div className="auth-links"><Link to="/reset-password">فراموشی رمز</Link><Link to="/">بازگشت به سایت</Link></div>
    </AuthShell>
  );
}

// گوش دادن به سفارش‌ها + اعلان سفارش جدید (صدا، نوتیفیکیشن مرورگر، عنوان تب)
function useAdminOrders(notify) {
  const [orders, setOrders] = useState(null);
  const known = useRef(null);
  useEffect(
    () =>
      onSnapshot(
        collection(db, "orders"),
        (s) => {
          const list = s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 9e12) - (a.createdAt?.seconds || 9e12));
          if (known.current) {
            const fresh = list.filter((o) => !known.current.has(o.id));
            fresh.forEach((o) => {
              notify(`🛎️ سفارش جدید: ${o.trackingCode} — ${o.customerInfo?.fullName || ""}`);
              if ("Notification" in window && Notification.permission === "granted")
                new Notification("سفارش جدید گوگوجی", { body: `${o.trackingCode} — ${Number(o.total || 0).toLocaleString("fa-IR")} تومان`, icon: "/icon-192.png" });
            });
            const receipts = list.filter((o) => o.status === "در انتظار تأیید رسید" && !known.current.receipts.has(o.id));
            receipts.forEach((o) => notify(`🧾 رسید جدید برای ${o.trackingCode}`));
            if (fresh.length || receipts.length) beep();
          }
          known.current = Object.assign(new Set(list.map((o) => o.id)), {
            receipts: new Set(list.filter((o) => o.status === "در انتظار تأیید رسید").map((o) => o.id)),
          });
          setOrders(list);
        },
        () => setOrders([]),
      ),
    [notify],
  );
  return orders;
}

function AdminShell() {
  const { notify, user } = useApp();
  const orders = useAdminOrders(notify);
  const [side, setSide] = useState(false);
  const unseen = (orders || []).filter((o) => o.adminSeen === false).length;
  const toReview = (orders || []).filter((o) => o.status === "در انتظار تأیید رسید").length;

  useEffect(() => {
    document.title = `${unseen ? `(${unseen}) ` : ""}پنل مدیریت گوگوجی`;
  }, [unseen]);

  const askNotif = () => "Notification" in window && Notification.requestPermission().then((p) => notify(p === "granted" ? "اعلان مرورگر فعال شد" : "اجازه اعلان داده نشد", p === "granted" ? "ok" : "err"));
  const tabs = [
    ["", "داشبورد", LayoutDashboard, 0],
    ["orders", "سفارش‌ها", Receipt, unseen + toReview],
    ["products", "محصولات و قیمت‌ها", Package, 0],
    ["customers", "مشتری‌ها", Users, 0],
    ["coupons", "کد تخفیف", Tag, 0],
    ["settings", "تنظیمات سایت", Settings, 0],
  ];

  return (
    <div className="admin">
      <AnimatePresence>{side && <motion.div className="drawer-bg only-mobile" onClick={() => setSide(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}</AnimatePresence>
      <aside className={`admin-side ${side ? "open" : ""}`} onClick={() => setSide(false)}>
        <Logo name="مدیریت" light />
        <div className="admin-user">
          <div className="avatar">K</div>
          <div><b>{ADMIN_ALIAS}</b><small dir="ltr">{user.email}</small></div>
        </div>
        <nav>
          {tabs.map(([path, label, Icon, badge]) => (
            <NavLink key={path} to={`/admin${path ? `/${path}` : ""}`} end={!path}>
              <Icon size={19} /> {label}
              {badge > 0 && <span className="dot-badge static">{toFa(badge)}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="admin-side-foot">
          <Link to="/" target="_blank"><ExternalLink size={17} /> مشاهده سایت</Link>
          <button onClick={() => signOut(auth)}><LogOut size={17} /> خروج</button>
        </div>
      </aside>
      <div className="admin-main">
        <header className="admin-top">
          <button className="icon-btn only-mobile" onClick={() => setSide(true)} aria-label="منو"><Menu /></button>
          <h1>پنل مدیریت فروشگاه</h1>
          <button className="icon-btn bell" onClick={askNotif} title="فعال‌سازی اعلان مرورگر">
            <Bell size={20} />
            {unseen > 0 && <span className="dot-badge">{toFa(unseen)}</span>}
          </button>
        </header>
        <div className="admin-body">
          {!orders ? (
            <div className="center-load"><Spinner /></div>
          ) : (
            <Routes>
              <Route index element={<Dashboard orders={orders} />} />
              <Route path="orders" element={<Orders orders={orders} />} />
              <Route path="products" element={<Products />} />
              <Route path="customers" element={<Customers orders={orders} />} />
              <Route path="coupons" element={<Coupons />} />
              <Route path="settings" element={<SettingsPage />} />
            </Routes>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, isAdmin } = useApp();
  useEffect(() => { storage.set("ggj-admin-visit", Date.now()); }, []);
  if (user === undefined) return <div className="center-load"><Spinner /></div>;
  return (
    <>
      <Seo title="پنل مدیریت" noindex />
      {isAdmin ? <AdminShell /> : <AdminLogin />}
    </>
  );
}
