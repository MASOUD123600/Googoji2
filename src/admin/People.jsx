import { useEffect, useMemo, useState } from "react";
import { collection, deleteDoc, doc, onSnapshot, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { Plus, Search, Trash2 } from "lucide-react";
import { db } from "../firebase";
import { useApp } from "../store/AppContext";
import { Spinner } from "../components/ui";
import { PAID_STATUSES } from "../config";
import { faDate, fmt, num, randomCode, telLink, toEn, toFa } from "../lib/utils";

function useCollection(name) {
  const [rows, setRows] = useState(null);
  useEffect(() => onSnapshot(collection(db, name), (s) => setRows(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => setRows([])), [name]);
  return rows;
}

export function Customers({ orders }) {
  const users = useCollection("users");
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    if (!users) return null;
    return users
      .map((u) => {
        const mine = orders.filter((o) => o.userId === u.id);
        const paid = mine.filter((o) => PAID_STATUSES.includes(o.status));
        return { ...u, orders: mine.length, spent: paid.reduce((s, o) => s + Number(o.total || 0), 0), referred: users.filter((x) => x.referredBy && x.referredBy === u.referralCode).length };
      })
      .filter((u) => !q || `${u.name} ${u.phone} ${u.email}`.includes(q))
      .sort((a, b) => b.spent - a.spent || (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  }, [users, orders, q]);
  if (!rows) return <Spinner />;
  return (
    <div className="stack">
      <label className="search"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی مشتری..." /></label>
      <div className="card table-card">
        <table className="table">
          <thead><tr><th>نام</th><th>موبایل</th><th>عضویت</th><th>سفارش</th><th>مجموع خرید</th><th>معرفی کرده</th></tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td><b>{u.name || "—"}</b><div className="muted small" dir="ltr">{u.email}</div></td>
                <td><a href={telLink(u.phone)}>{toFa(u.phone)}</a></td>
                <td>{faDate(u.createdAt)}</td>
                <td>{toFa(u.orders)}</td>
                <td><b>{fmt(u.spent)}</b></td>
                <td>{toFa(u.referred)} نفر {u.referralCode && <small className="muted" dir="ltr">({u.referralCode})</small>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length && <p className="muted center">هنوز مشتری ثبت‌نام نکرده.</p>}
      </div>
    </div>
  );
}

export function Coupons() {
  const coupons = useCollection("coupons");
  const { notify } = useApp();
  const [f, setF] = useState({ code: "", type: "percent", value: "10", minTotal: "", maxUses: "", expires: "" });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const create = async (e) => {
    e.preventDefault();
    const code = (toEn(f.code).trim() || randomCode(6)).toUpperCase().replace(/[^A-Z0-9-]/g, "");
    if (coupons?.some((c) => c.id === code)) return notify("این کد وجود دارد", "err");
    await setDoc(doc(db, "coupons", code), {
      ...(f.type === "percent" ? { percent: num(f.value) } : { amount: num(f.value) }),
      minTotal: num(f.minTotal),
      maxUses: num(f.maxUses),
      used: 0,
      active: true,
      ...(f.expires && { expiresAt: new Date(f.expires) }),
      createdAt: serverTimestamp(),
    });
    notify(`کد ${code} ساخته شد`);
    setF((x) => ({ ...x, code: "" }));
  };

  return (
    <div className="stack">
      <form className="card" onSubmit={create}>
        <h3 className="card-title">ساخت کد تخفیف</h3>
        <div className="form-grid four">
          <label className="field"><span>کد (خالی = تصادفی)</span><input dir="ltr" value={f.code} onChange={set("code")} placeholder="YALDA1405" /></label>
          <label className="field"><span>نوع</span><select value={f.type} onChange={set("type")}><option value="percent">درصدی</option><option value="amount">مبلغ ثابت (تومان)</option></select></label>
          <label className="field"><span>{f.type === "percent" ? "درصد" : "مبلغ"}</span><input value={f.value} onChange={set("value")} inputMode="numeric" /></label>
          <label className="field"><span>حداقل خرید</span><input value={f.minTotal} onChange={set("minTotal")} inputMode="numeric" /></label>
          <label className="field"><span>سقف دفعات استفاده</span><input value={f.maxUses} onChange={set("maxUses")} inputMode="numeric" placeholder="نامحدود" /></label>
          <label className="field"><span>تاریخ انقضا</span><input type="date" value={f.expires} onChange={set("expires")} /></label>
        </div>
        <button className="btn btn-p"><Plus size={17} /> ساخت کد</button>
      </form>
      <div className="card table-card">
        {!coupons ? <Spinner /> : (
          <table className="table">
            <thead><tr><th>کد</th><th>تخفیف</th><th>استفاده</th><th>شرایط</th><th>فعال</th><th></th></tr></thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id}>
                  <td dir="ltr"><b>{c.id}</b></td>
                  <td>{c.amount ? fmt(c.amount) : `${toFa(c.percent)}٪`}</td>
                  <td>{toFa(c.used || 0)}{c.maxUses ? ` از ${toFa(c.maxUses)}` : ""}</td>
                  <td className="small">{c.uid && "شخصی • "}{c.minTotal ? `حداقل ${fmt(c.minTotal)}` : ""}{c.note && <div className="muted">{c.note}</div>}</td>
                  <td><input type="checkbox" className="switch" checked={c.active !== false} onChange={(e) => updateDoc(doc(db, "coupons", c.id), { active: e.target.checked })} /></td>
                  <td><button className="icon-btn danger" onClick={() => window.confirm("حذف شود؟") && deleteDoc(doc(db, "coupons", c.id))}><Trash2 size={16} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {coupons && !coupons.length && <p className="muted center">کد تخفیفی ساخته نشده.</p>}
      </div>
    </div>
  );
}
