import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { motion } from "framer-motion";
import { Copy, ExternalLink, Upload } from "lucide-react";
import { db } from "../firebase";
import { useApp } from "../store/AppContext";
import { Empty, Img, Seo, Spinner } from "../components/ui";
import { Steps } from "./Cart";
import { PAID_STATUSES } from "../config";
import { compressImage, faDate, fmt, telLink, toFa } from "../lib/utils";

export const TIMELINE = ["ثبت سفارش", "پرداخت شده", "در حال آماده‌سازی", "ارسال شده", "تحویل داده شد"];
export function timelineIndex(status) {
  if (!status || status.includes("انتظار")) return 0;
  const i = TIMELINE.indexOf(status);
  return i < 0 ? 0 : i;
}

export function StatusBadge({ status }) {
  const cls = status?.includes("لغو") ? "st-cancel" : status?.includes("انتظار") ? "st-wait" : PAID_STATUSES.includes(status) ? (status === "تحویل داده شد" ? "st-done" : "st-paid") : "";
  return <span className={`status ${cls}`}>{status}</span>;
}

export function Timeline({ status }) {
  const cur = timelineIndex(status);
  if (status?.includes("لغو")) return <div className="alert alert-err">این سفارش لغو شده است.</div>;
  return (
    <ol className="timeline">
      {TIMELINE.map((s, i) => (
        <li key={s} className={i <= cur ? "done" : ""}>
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1, type: "spring" }}>{i <= cur ? "✓" : toFa(i + 1)}</motion.span>
          <small>{s}</small>
        </li>
      ))}
    </ol>
  );
}

const copy = (text, notify) => navigator.clipboard?.writeText(text).then(() => notify("کپی شد"));

export default function Order() {
  const { id } = useParams();
  const { user, settings: S, notify } = useApp();
  const [order, setOrder] = useState(undefined);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      doc(db, "orders", id),
      (s) => setOrder(s.exists() ? { id: s.id, ...s.data() } : null),
      () => setOrder(null),
    );
  }, [id, user]);

  if (user === null)
    return (
      <div className="container section">
        <Empty icon="🔒" title="برای دیدن سفارش وارد شو"><Link className="btn btn-p" to={`/login?next=/order/${id}`}>ورود</Link></Empty>
      </div>
    );
  if (order === undefined) return <div className="center-load"><Spinner /></div>;
  if (!order) return <div className="container section"><Empty icon="🔍" title="سفارش پیدا نشد" /></div>;

  const pending = order.status === "در انتظار پرداخت" || order.status === "در انتظار تأیید رسید";
  const paid = PAID_STATUSES.includes(order.status);
  const baleReady = S.balePayEnabled && S.baleBotUsername;

  const sendReceipt = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    try {
      const data = await compressImage(f, 1200, 0.75, 600_000);
      await updateDoc(doc(db, "orders", id), { receipt: data, receiptAt: serverTimestamp(), paymentMethod: "card", status: "در انتظار تأیید رسید" });
      notify("رسید ارسال شد؛ پس از بررسی، سفارش تأیید می‌شود");
    } catch {
      notify("ارسال رسید ناموفق بود", "err");
    }
    setUploading(false);
  };

  return (
    <div className="container section">
      <Seo title="پیگیری سفارش" noindex />
      <Steps step={paid ? 4 : 3} />
      <div className="checkout">
        <div className="stack">
          <motion.div className="card track-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="track-head">
              <div>
                <small>کد پیگیری سفارش</small>
                <div className="track-code">{order.trackingCode}</div>
              </div>
              <button className="btn btn-sm btn-white" onClick={() => copy(order.trackingCode, notify)}><Copy size={15} /> کپی</button>
            </div>
            <div className="row-between"><span>وضعیت:</span><StatusBadge status={order.status} /></div>
            <Timeline status={order.status} />
            {order.payment?.refId && <div className="muted small">شماره پیگیری پرداخت: <b dir="ltr">{order.payment.refId}</b></div>}
          </motion.div>

          {paid && (
            <motion.div className="card success-card" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <div className="big-emoji">🎉</div>
              <h2>پرداخت با موفقیت انجام شد</h2>
              <p>سفارشت در صف آماده‌سازی قرار گرفت. وضعیت ارسال را همین‌جا یا در پنل کاربری دنبال کن.</p>
            </motion.div>
          )}

          {pending && (
            <div className="card">
              <h2 className="card-title">💳 پرداخت سفارش — {fmt(order.total)}</h2>
              {baleReady && order.paymentMethod !== "card" && (
                <div className="pay-box">
                  <ol className="pay-steps">
                    <li>دکمه زیر را بزن تا بازوی فروشگاه در پیام‌رسان «بله» باز شود.</li>
                    <li>دکمه «شروع» را بزن؛ صورت‌حساب سفارش برایت ارسال می‌شود.</li>
                    <li>پرداخت را با کیف پول بله انجام بده؛ این صفحه خودکار به‌روز می‌شود.</li>
                  </ol>
                  <a className="btn btn-bale btn-lg btn-block" href={`https://ble.ir/${S.baleBotUsername}?start=${order.id}`} target="_blank" rel="noopener noreferrer">
                    پرداخت با بله‌پی <ExternalLink size={17} />
                  </a>
                  {S.cardPayEnabled !== false && <button className="link-btn" onClick={() => updateDoc(doc(db, "orders", id), { paymentMethod: "card" })}>ترجیح می‌دهم کارت به کارت کنم</button>}
                </div>
              )}
              {(order.paymentMethod === "card" || !baleReady) && (
                <div className="pay-box">
                  {S.cardNumber ? (
                    <>
                      <p>مبلغ <b>{fmt(order.total)}</b> را به کارت زیر واریز کن و عکس رسید را بفرست:</p>
                      <div className="bank-card">
                        <small>{S.cardBank || "شماره کارت"}</small>
                        <div className="bank-num" dir="ltr">{toFa(S.cardNumber.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 "))}</div>
                        <div className="row-between"><span>{S.cardHolder}</span><button className="btn btn-sm btn-white" onClick={() => copy(S.cardNumber.replace(/\D/g, ""), notify)}><Copy size={14} /> کپی</button></div>
                      </div>
                    </>
                  ) : (
                    <p>برای دریافت شماره کارت با <a href={telLink(S.phone)}>{toFa(S.phone)}</a> تماس بگیرید.</p>
                  )}
                  {order.receipt ? (
                    <div className="alert alert-ok">✅ رسید شما ارسال شده و در انتظار تأیید است. <button className="link-btn" onClick={() => fileRef.current?.click()}>ارسال مجدد</button></div>
                  ) : (
                    <button className="btn btn-p btn-block" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      {uploading ? <Spinner /> : <><Upload size={17} /> ارسال عکس رسید واریز</>}
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" hidden onChange={sendReceipt} />
                  {baleReady && <button className="link-btn" onClick={() => updateDoc(doc(db, "orders", id), { paymentMethod: "bale" })}>پرداخت آنلاین با بله‌پی</button>}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="card summary">
          <h3 className="card-title">جزئیات سفارش</h3>
          <div className="muted small">تاریخ: {faDate(order.createdAt, true)}</div>
          <div className="sum-items">
            {order.items?.map((i) => (
              <div key={i.id} className="sum-item">
                <Img src={i.image} small alt="" />
                <span>{i.name} <small>× {toFa(i.qty)}</small></span>
                <b>{fmt(i.price * i.qty)}</b>
              </div>
            ))}
          </div>
          {order.discount > 0 && <div className="row-between good"><span>{order.discountLabel}</span><span>− {fmt(order.discount)}</span></div>}
          <div className="row-between"><span>ارسال</span><span>{order.shipping ? fmt(order.shipping) : "رایگان"}</span></div>
          <div className="row-between total"><span>مبلغ کل</span><b>{fmt(order.total)}</b></div>
          <div className="addr-box">
            <b>{order.customerInfo?.fullName}</b> — {toFa(order.customerInfo?.mobile)}
            <div className="muted small">{order.customerInfo?.city}، {order.customerInfo?.address} — کد پستی {toFa(order.customerInfo?.postalCode)}</div>
          </div>
          <Link className="btn btn-ghost btn-block" to="/account/orders">همه سفارش‌های من</Link>
        </aside>
      </div>
    </div>
  );
}
