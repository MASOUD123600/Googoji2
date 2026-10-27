import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useApp } from "../store/AppContext";
import { StatusBadge } from "../pages/Order";
import { PAID_STATUSES } from "../config";
import { faDate, fmt, fmtNum, toDate, toFa } from "../lib/utils";

const DAY = 86400000;

function Bars({ data }) {
  const max = Math.max(1, ...data.map((d) => d.v));
  return (
    <div className="bars" role="img" aria-label="نمودار فروش ۱۴ روز اخیر">
      {data.map((d, i) => (
        <div key={i} className="bar-col" title={`${d.label}: ${fmt(d.v)}`}>
          <motion.div className="bar" initial={{ height: 0 }} animate={{ height: `${(d.v / max) * 100}%` }} transition={{ delay: i * 0.03, type: "spring", damping: 18 }} />
          <small>{d.short}</small>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard({ orders }) {
  const { products, productsSource } = useApp();
  const s = useMemo(() => {
    const now = Date.now();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const paid = orders.filter((o) => PAID_STATUSES.includes(o.status));
    const sum = (list) => list.reduce((a, o) => a + Number(o.total || 0), 0);
    const since = (ms) => paid.filter((o) => (toDate(o.createdAt)?.getTime() || now) >= ms);
    const days = Array.from({ length: 14 }, (_, k) => {
      const d0 = start.getTime() - (13 - k) * DAY;
      const v = sum(paid.filter((o) => {
        const t = toDate(o.createdAt)?.getTime() || now;
        return t >= d0 && t < d0 + DAY;
      }));
      const d = new Date(d0);
      return { v, label: d.toLocaleDateString("fa-IR"), short: d.toLocaleDateString("fa-IR", { day: "numeric" }) };
    });
    const sold = {};
    paid.forEach((o) => o.items?.forEach((i) => (sold[i.id] = { name: i.name, qty: (sold[i.id]?.qty || 0) + Number(i.qty) })));
    return {
      today: sum(since(start.getTime())),
      week: sum(since(now - 7 * DAY)),
      month: sum(since(now - 30 * DAY)),
      all: sum(paid),
      paidCount: paid.length,
      waiting: orders.filter((o) => o.status === "در انتظار پرداخت").length,
      review: orders.filter((o) => o.status === "در انتظار تأیید رسید").length,
      toShip: orders.filter((o) => o.status === "پرداخت شده" || o.status === "در حال آماده‌سازی").length,
      days,
      top: Object.values(sold).sort((a, b) => b.qty - a.qty).slice(0, 5),
    };
  }, [orders]);

  const noPrice = products.filter((p) => p.active !== false && !(Number(p.price) > 0));
  const lowStock = products.filter((p) => p.active !== false && Number(p.price) > 0 && Number(p.stock) <= 3);

  const cards = [
    ["فروش امروز", fmt(s.today), "💰"],
    ["فروش ۷ روز", fmt(s.week), "📈"],
    ["فروش ۳۰ روز", fmt(s.month), "🗓️"],
    ["سفارش پرداخت‌شده", toFa(s.paidCount), "✅"],
  ];

  return (
    <div className="stack">
      {productsSource === "seed" && (
        <div className="alert alert-warn">
          محصولات هنوز در دیتابیس ثبت نشده‌اند. در <Link to="/admin/products">محصولات</Link> دکمه «ورود محصولات آماده» را بزن.
        </div>
      )}
      <div className="kpis">
        {cards.map(([t, v, e], i) => (
          <motion.div key={t} className="kpi" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
            <span className="kpi-icon">{e}</span>
            <small>{t}</small>
            <b>{v}</b>
          </motion.div>
        ))}
      </div>
      <div className="kpis kpis-alert">
        <Link to="/admin/orders?s=در انتظار تأیید رسید" className="kpi warn"><small>رسید منتظر تأیید</small><b>{toFa(s.review)}</b></Link>
        <Link to="/admin/orders?s=پرداخت شده" className="kpi good"><small>آماده ارسال</small><b>{toFa(s.toShip)}</b></Link>
        <Link to="/admin/orders?s=در انتظار پرداخت" className="kpi"><small>منتظر پرداخت</small><b>{toFa(s.waiting)}</b></Link>
        <Link to="/admin/products" className="kpi"><small>بدون قیمت</small><b>{toFa(noPrice.length)}</b></Link>
      </div>
      <div className="admin-grid">
        <div className="card">
          <h3 className="card-title">فروش ۱۴ روز اخیر <small>(کل: {fmt(s.all)})</small></h3>
          <Bars data={s.days} />
        </div>
        <div className="card">
          <h3 className="card-title">پرفروش‌ترین‌ها</h3>
          {s.top.length ? s.top.map((t, i) => <div key={i} className="row-between"><span>{toFa(i + 1)}. {t.name}</span><b>{fmtNum(t.qty)} عدد</b></div>) : <p className="muted">هنوز فروشی ثبت نشده.</p>}
        </div>
      </div>
      <div className="admin-grid">
        <div className="card">
          <h3 className="card-title">آخرین سفارش‌ها</h3>
          {orders.slice(0, 6).map((o) => (
            <Link key={o.id} to={`/admin/orders?id=${o.id}`} className="row-between list-link">
              <span><b dir="ltr">{o.trackingCode}</b> <small className="muted">{o.customerInfo?.fullName} • {faDate(o.createdAt)}</small></span>
              <StatusBadge status={o.status} />
            </Link>
          ))}
          {!orders.length && <p className="muted">سفارشی ثبت نشده.</p>}
        </div>
        <div className="card">
          <h3 className="card-title">⚠️ موجودی کم</h3>
          {lowStock.length ? lowStock.slice(0, 8).map((p) => <div key={p.id} className="row-between"><span>{p.name}</span><b className={Number(p.stock) < 1 ? "bad" : ""}>{toFa(p.stock)}</b></div>) : <p className="muted">همه محصولات موجودی کافی دارند.</p>}
        </div>
      </div>
    </div>
  );
}
