import { useEffect, useState } from "react";
import { Link, Navigate, NavLink, Route, Routes } from "react-router-dom";
import { collection, doc, onSnapshot, query, setDoc, where } from "firebase/firestore";
import { sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { Gift, Heart, Home, LogOut, MapPin, Package, Settings } from "lucide-react";
import { auth, db } from "../firebase";
import { useApp } from "../store/AppContext";
import { Empty, Seo, Spinner } from "../components/ui";
import ProductCard from "../components/ProductCard";
import { StatusBadge } from "./Order";
import { PAID_STATUSES, SITE_URL } from "../config";
import { faDate, fmt, isValidMobile, toEn, toFa } from "../lib/utils";

function useMyOrders(uid) {
  const [orders, setOrders] = useState(null);
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      query(collection(db, "orders"), where("userId", "==", uid)),
      (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))),
      () => setOrders([]),
    );
  }, [uid]);
  return orders;
}

function OrderList({ orders }) {
  if (!orders) return <Spinner />;
  if (!orders.length)
    return (
      <Empty icon="📭" title="هنوز سفارشی ثبت نکردی">
        <Link className="btn btn-p" to="/shop">شروع خرید</Link>
      </Empty>
    );
  return (
    <div className="stack">
      {orders.map((o) => (
        <Link key={o.id} to={`/order/${o.id}`} className="order-row">
          <div>
            <b dir="ltr">{o.trackingCode}</b>
            <div className="muted small">{faDate(o.createdAt)} • {toFa(o.items?.length || 0)} کالا</div>
          </div>
          <StatusBadge status={o.status} />
          <b className="price">{fmt(o.total)}</b>
        </Link>
      ))}
    </div>
  );
}

function Dashboard({ orders }) {
  const { profile, user } = useApp();
  const paid = (orders || []).filter((o) => PAID_STATUSES.includes(o.status));
  return (
    <>
      <h2 className="card-title">سلام {profile?.name || user.displayName || ""} 👋</h2>
      {!user.emailVerified && (
        <div className="alert alert-warn">
          ایمیلت هنوز تأیید نشده. <button className="link-btn" onClick={() => sendEmailVerification(user).then(() => alert("ایمیل تأیید دوباره ارسال شد"))}>ارسال مجدد ایمیل تأیید</button>
        </div>
      )}
      <div className="stats">
        <div className="stat"><b>{toFa(orders?.length || 0)}</b><span>کل سفارش‌ها</span></div>
        <div className="stat"><b>{toFa((orders || []).filter((o) => o.status?.includes("انتظار")).length)}</b><span>در انتظار پرداخت</span></div>
        <div className="stat"><b>{toFa(paid.filter((o) => o.status !== "تحویل داده شد").length)}</b><span>در حال ارسال</span></div>
        <div className="stat"><b>{toFa(paid.filter((o) => o.status === "تحویل داده شد").length)}</b><span>تحویل شده</span></div>
      </div>
      <h3 className="sub-title">آخرین سفارش‌ها</h3>
      <OrderList orders={orders?.slice(0, 3)} />
    </>
  );
}

function Wishlist() {
  const { wishlist, productMap } = useApp();
  const list = wishlist.map((id) => productMap[id]).filter((p) => p && p.active !== false);
  return (
    <>
      <h2 className="card-title">علاقه‌مندی‌ها</h2>
      {list.length ? <div className="grid grid-3">{list.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}</div> : <Empty icon="💜" title="لیست علاقه‌مندی خالیه"><p>روی ♡ محصولات بزن تا اینجا ذخیره شوند.</p></Empty>}
    </>
  );
}

function Addresses() {
  const { profile, user, notify } = useApp();
  const list = profile?.addresses || [];
  const remove = async (k) => {
    await setDoc(doc(db, "users", user.uid), { addresses: list.filter((_, i) => i !== k) }, { merge: true });
    notify("آدرس حذف شد");
  };
  return (
    <>
      <h2 className="card-title">آدرس‌های من</h2>
      {list.length === 0 ? (
        <Empty icon="📍" title="آدرسی ذخیره نشده"><p>در اولین خرید، آدرست خودکار ذخیره می‌شود.</p></Empty>
      ) : (
        <div className="stack">
          {list.map((a, k) => (
            <div key={k} className="order-row">
              <div><b>{a.fullName}</b> — {toFa(a.mobile)}<div className="muted small">{a.city}، {a.address} — کد پستی {toFa(a.postalCode)}</div></div>
              <button className="btn btn-sm btn-ghost" onClick={() => remove(k)}>حذف</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function Referral() {
  const { profile, settings, notify } = useApp();
  const code = profile?.referralCode;
  const link = `${SITE_URL}/register?ref=${code}`;
  const share = async () => {
    const text = `با کد معرف ${code} در پت شاپ گوگوجی ثبت‌نام کن و ${toFa(settings.referralPercent || 10)}٪ تخفیف اولین خرید بگیر 🐾`;
    if (navigator.share) navigator.share({ title: "گوگوجی", text, url: link }).catch(() => {});
    else navigator.clipboard?.writeText(`${text}\n${link}`).then(() => notify("لینک دعوت کپی شد"));
  };
  return (
    <>
      <h2 className="card-title">🎁 معرفی دوستان</h2>
      <p>کد زیر را برای دوستانت بفرست. اولین خرید آن‌ها {toFa(settings.referralPercent || 10)}٪ تخفیف دارد و بعد از اولین خرید موفقشان، یک کد تخفیف {toFa(settings.referralPercent || 10)}٪ هم برای خودت صادر می‌شود.</p>
      {code ? (
        <div className="ref-box">
          <div className="ref-code" dir="ltr">{code}</div>
          <button className="btn btn-accent" onClick={share}>اشتراک‌گذاری لینک دعوت</button>
        </div>
      ) : (
        <Spinner />
      )}
      <h3 className="sub-title">کدهای تخفیف من</h3>
      {profile?.rewardCoupons?.length ? (
        <div className="chips">{profile.rewardCoupons.map((c) => <span key={c} className="chip on" dir="ltr">{c}</span>)}</div>
      ) : (
        <p className="muted">هنوز کد تخفیفی نداری.</p>
      )}
    </>
  );
}

function Profile() {
  const { profile, user, notify } = useApp();
  const [name, setName] = useState(profile?.name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const save = async (e) => {
    e.preventDefault();
    if (!isValidMobile(phone)) return notify("شماره موبایل معتبر نیست", "err");
    await setDoc(doc(db, "users", user.uid), { name: name.trim(), phone: toEn(phone).trim(), email: user.email }, { merge: true });
    notify("اطلاعات ذخیره شد");
  };
  return (
    <>
      <h2 className="card-title">اطلاعات حساب</h2>
      <form className="form-grid" onSubmit={save}>
        <label className="field"><span>نام</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field"><span>موبایل</span><input value={phone} onChange={(e) => setPhone(e.target.value)} /></label>
        <label className="field full"><span>ایمیل</span><input value={user.email} dir="ltr" disabled /></label>
        <div className="full row-gap">
          <button className="btn btn-p">ذخیره</button>
          <button type="button" className="btn btn-ghost" onClick={() => sendPasswordResetEmail(auth, user.email).then(() => notify("لینک تغییر رمز به ایمیلت ارسال شد"))}>تغییر رمز عبور</button>
        </div>
      </form>
    </>
  );
}

export default function Account() {
  const { user, profile, logout, isAdmin } = useApp();
  const orders = useMyOrders(user?.uid);
  if (user === undefined) return <div className="center-load"><Spinner /></div>;
  if (!user) return <Navigate to="/login?next=/account" replace />;
  const tabs = [
    ["", "داشبورد", Home],
    ["orders", "سفارش‌ها", Package],
    ["wishlist", "علاقه‌مندی‌ها", Heart],
    ["addresses", "آدرس‌ها", MapPin],
    ["referral", "معرفی دوستان", Gift],
    ["profile", "اطلاعات حساب", Settings],
  ];
  return (
    <div className="container section">
      <Seo title="حساب کاربری" noindex />
      <div className="panel">
        <aside className="card panel-side">
          <div className="avatar">{(profile?.name || user.email)[0]}</div>
          <b>{profile?.name || user.displayName}</b>
          <small className="muted" dir="ltr">{user.email}</small>
          <nav>
            {tabs.map(([path, label, Icon]) => (
              <NavLink key={path} to={`/account${path ? `/${path}` : ""}`} end={!path}><Icon size={18} /> {label}</NavLink>
            ))}
            {isAdmin && <NavLink to="/admin">⚙️ پنل مدیریت</NavLink>}
            <button onClick={logout}><LogOut size={18} /> خروج</button>
          </nav>
        </aside>
        <section className="card panel-main">
          <Routes>
            <Route index element={<Dashboard orders={orders} />} />
            <Route path="orders" element={<><h2 className="card-title">سفارش‌های من</h2><OrderList orders={orders} /></>} />
            <Route path="wishlist" element={<Wishlist />} />
            <Route path="addresses" element={<Addresses />} />
            <Route path="referral" element={<Referral />} />
            <Route path="profile" element={<Profile key={profile?.id} />} />
          </Routes>
        </section>
      </div>
    </div>
  );
}
