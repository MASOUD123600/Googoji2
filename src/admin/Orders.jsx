import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { deleteDoc, doc, updateDoc } from "firebase/firestore";
import { Phone, Printer, Search } from "lucide-react";
import { db } from "../firebase";
import { useApp } from "../store/AppContext";
import { Img, Modal, Spinner } from "../components/ui";
import { StatusBadge } from "../pages/Order";
import { ORDER_STATUSES } from "../config";
import { confirmPayment, printInvoice } from "./actions";
import { faDate, fmt, telLink, toFa, waLink } from "../lib/utils";

function OrderDetail({ order, onClose }) {
  const { settings, notify, productMap } = useApp();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(order.adminNote || "");
  const [showReceipt, setShowReceipt] = useState(false);
  const c = order.customerInfo || {};

  useEffect(() => {
    if (order.adminSeen === false) updateDoc(doc(db, "orders", order.id), { adminSeen: true }).catch(() => {});
  }, [order.id, order.adminSeen]);

  // بررسی تطابق قیمت ثبت‌شده با قیمت فعلی محصولات
  const mismatch = (order.items || []).filter((i) => productMap[i.id] && Number(productMap[i.id].price) !== Number(i.price));

  const setStatus = async (status) => {
    await updateDoc(doc(db, "orders", order.id), { status, adminSeen: true });
    notify(`وضعیت: ${status}`);
  };
  const confirm = async () => {
    if (!window.confirm(`پرداخت ${fmt(order.total)} برای ${order.trackingCode} تأیید شود؟ موجودی محصولات کم می‌شود.`)) return;
    setBusy(true);
    try {
      const reward = await confirmPayment(order, settings);
      notify(`پرداخت تأیید شد ✅${reward ? ` — کد پاداش معرف: ${reward}` : ""}`);
    } catch (e) {
      console.error(e);
      notify("تأیید پرداخت ناموفق بود", "err");
    }
    setBusy(false);
  };
  const saveNote = () => updateDoc(doc(db, "orders", order.id), { adminNote: note }).then(() => notify("یادداشت ذخیره شد"));
  const remove = async () => {
    if (!window.confirm("این سفارش برای همیشه حذف شود؟")) return;
    await deleteDoc(doc(db, "orders", order.id));
    notify("سفارش حذف شد");
    onClose();
  };
  const unpaid = order.status === "در انتظار پرداخت" || order.status === "در انتظار تأیید رسید";

  return (
    <Modal open onClose={onClose} title={`سفارش ${order.trackingCode}`} wide>
      <div className="row-between wrap">
        <StatusBadge status={order.status} />
        <span className="muted small">{faDate(order.createdAt, true)} • روش پرداخت: {order.paymentMethod === "bale" ? "بله‌پی" : "کارت به کارت"}</span>
      </div>
      {order.payment?.refId && <div className="alert alert-ok">پرداخت آنلاین بله — شماره پیگیری: <b dir="ltr">{order.payment.refId}</b></div>}

      <div className="detail-grid">
        <div className="card soft">
          <h4>👤 مشتری</h4>
          <p><b>{c.fullName}</b></p>
          <p>{toFa(c.mobile)} <a className="btn btn-sm btn-ghost" href={telLink(c.mobile)}><Phone size={14} /> تماس</a> <a className="btn btn-sm btn-ghost" href={waLink(c.mobile)} target="_blank" rel="noopener noreferrer">واتساپ</a></p>
          <p className="muted small">{order.userEmail}</p>
          <p>{c.province}، {c.city}، {c.address}</p>
          <p>کد پستی: {toFa(c.postalCode)}</p>
          {c.notes && <p className="alert alert-warn">📝 {c.notes}</p>}
        </div>
        <div className="card soft">
          <h4>🛍️ اقلام</h4>
          {order.items?.map((i) => (
            <div key={i.id} className="sum-item">
              <Img src={i.image} small alt="" />
              <span>{i.name} <small>× {toFa(i.qty)}</small></span>
              <b>{fmt(i.price * i.qty)}</b>
            </div>
          ))}
          {order.discount > 0 && <div className="row-between good"><span>{order.discountLabel}{order.couponCode && ` (${order.couponCode})`}</span><span>− {fmt(order.discount)}</span></div>}
          <div className="row-between"><span>ارسال</span><span>{order.shipping ? fmt(order.shipping) : "رایگان"}</span></div>
          <div className="row-between total"><span>جمع کل</span><b>{fmt(order.total)}</b></div>
          {mismatch.length > 0 && <div className="alert alert-warn">⚠️ قیمت {toFa(mismatch.length)} قلم با قیمت فعلی سایت فرق دارد (ممکن است قیمت بعد از سفارش تغییر کرده باشد).</div>}
        </div>
      </div>

      {order.receipt && (
        <div className="card soft">
          <div className="row-between"><h4>🧾 رسید واریز</h4><button className="btn btn-sm btn-ghost" onClick={() => setShowReceipt((v) => !v)}>{showReceipt ? "بستن" : "نمایش رسید"}</button></div>
          {showReceipt && <a href={order.receipt} target="_blank" rel="noopener noreferrer"><img src={order.receipt} alt="رسید" className="receipt-img" /></a>}
        </div>
      )}

      <div className="admin-actions">
        {unpaid && <button className="btn btn-p" onClick={confirm} disabled={busy}>{busy ? <Spinner /> : "✅ تأیید پرداخت"}</button>}
        <select value={order.status} onChange={(e) => setStatus(e.target.value)} aria-label="تغییر وضعیت">
          {ORDER_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <button className="btn btn-ghost" onClick={() => printInvoice(order, settings)}><Printer size={16} /> چاپ فاکتور و برچسب</button>
        <button className="btn btn-ghost danger" onClick={remove}>حذف</button>
      </div>
      <label className="field"><span>یادداشت داخلی (فقط مدیر می‌بیند)</span><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} onBlur={saveNote} /></label>
    </Modal>
  );
}

export default function Orders({ orders }) {
  const [sp, setSp] = useSearchParams();
  const status = sp.get("s") || "";
  const [q, setQ] = useState("");
  const selected = orders.find((o) => o.id === sp.get("id"));
  const counts = useMemo(() => orders.reduce((m, o) => ({ ...m, [o.status]: (m[o.status] || 0) + 1 }), {}), [orders]);
  const list = orders.filter(
    (o) =>
      (!status || o.status === status) &&
      (!q || `${o.trackingCode} ${o.customerInfo?.fullName} ${o.customerInfo?.mobile} ${o.userEmail}`.toLowerCase().includes(q.toLowerCase())),
  );
  const open = (id) => {
    const n = new URLSearchParams(sp);
    if (id) n.set("id", id);
    else n.delete("id");
    setSp(n);
  };

  return (
    <div className="stack">
      <div className="chips scroll">
        <button className={`chip ${!status ? "on" : ""}`} onClick={() => setSp({})}>همه ({toFa(orders.length)})</button>
        {ORDER_STATUSES.map((s) => (
          <button key={s} className={`chip ${status === s ? "on" : ""}`} onClick={() => setSp({ s })}>{s} ({toFa(counts[s] || 0)})</button>
        ))}
      </div>
      <label className="search"><Search size={18} /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو: کد پیگیری، نام، موبایل..." /></label>
      <div className="card table-card">
        <table className="table">
          <thead><tr><th>کد پیگیری</th><th>مشتری</th><th>تاریخ</th><th>مبلغ</th><th>پرداخت</th><th>وضعیت</th></tr></thead>
          <tbody>
            {list.map((o) => (
              <tr key={o.id} onClick={() => open(o.id)} className={o.adminSeen === false ? "unseen" : ""}>
                <td dir="ltr"><b>{o.trackingCode}</b>{o.adminSeen === false && <span className="new-dot" />}</td>
                <td>{o.customerInfo?.fullName}<div className="muted small">{toFa(o.customerInfo?.mobile)}</div></td>
                <td>{faDate(o.createdAt, true)}</td>
                <td><b>{fmt(o.total)}</b></td>
                <td>{o.paymentMethod === "bale" ? "بله‌پی" : "کارت"}{o.receipt && " 🧾"}</td>
                <td><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!list.length && <p className="muted center">سفارشی با این فیلتر نیست.</p>}
      </div>
      {selected && <OrderDetail key={selected.id} order={selected} onClose={() => open(null)} />}
    </div>
  );
}
