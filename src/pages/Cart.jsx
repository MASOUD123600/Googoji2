import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Empty, Img, Seo } from "../components/ui";
import { computeTotals } from "../lib/pricing";
import { fmt, toFa } from "../lib/utils";

export default function Cart() {
  const { cartItems, updateQty, removeFromCart, settings, user } = useApp();
  const nav = useNavigate();
  const t = computeTotals(cartItems, { settings });

  if (!cartItems.length)
    return (
      <div className="container section">
        <Seo title="سبد خرید" noindex />
        <Empty icon="🛒" title="سبد خریدت خالیه!">
          <p>یه سر به فروشگاه بزن، کلی چیز خوب برای پشمالوت داریم.</p>
          <Link className="btn btn-p" to="/shop">رفتن به فروشگاه</Link>
        </Empty>
      </div>
    );

  return (
    <div className="container section">
      <Seo title="سبد خرید" noindex />
      <Steps step={1} />
      <div className="checkout">
        <div className="card">
          <h2 className="card-title">سبد خرید <small>({toFa(cartItems.length)} کالا)</small></h2>
          <AnimatePresence initial={false}>
            {cartItems.map((i) => (
              <motion.div key={i.id} className="cart-row" layout exit={{ opacity: 0, height: 0 }}>
                <Link to={`/p/${i.slug || i.id}`} className="cart-img"><Img src={i.images?.[0] || i.imageUrl} small alt={i.name} /></Link>
                <div className="grow">
                  <Link to={`/p/${i.slug || i.id}`} className="cart-name">{i.name}</Link>
                  <div className="muted">{fmt(i.price)} × {toFa(i.qty)}</div>
                </div>
                <div className="qty">
                  <button onClick={() => updateQty(i.id, Math.min(i.qty + 1, Number(i.stock) || 99))} aria-label="افزایش"><Plus size={15} /></button>
                  <span>{toFa(i.qty)}</span>
                  <button onClick={() => updateQty(i.id, i.qty - 1)} aria-label="کاهش"><Minus size={15} /></button>
                </div>
                <b className="cart-sum">{fmt(i.price * i.qty)}</b>
                <button className="icon-btn danger" onClick={() => removeFromCart(i.id)} aria-label="حذف"><Trash2 size={18} /></button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <aside className="card summary">
          <h3 className="card-title">خلاصه سفارش</h3>
          <div className="row-between"><span>جمع کالاها</span><span>{fmt(t.subtotal)}</span></div>
          <div className="row-between"><span>هزینه ارسال</span><span>{t.shipping ? fmt(t.shipping) : "رایگان 🎉"}</span></div>
          <div className="row-between total"><span>قابل پرداخت</span><b>{fmt(t.total)}</b></div>
          <p className="muted small">کد تخفیف و تخفیف معرفی در مرحله بعد اعمال می‌شود.</p>
          <button className="btn btn-p btn-block btn-lg" onClick={() => nav(user ? "/checkout" : "/login?next=/checkout")}>ادامه فرایند خرید</button>
          {!user && <p className="muted small center">برای ثبت سفارش وارد حساب کاربری شو یا ثبت‌نام کن.</p>}
        </aside>
      </div>
    </div>
  );
}

export function Steps({ step }) {
  const items = ["سبد خرید", "اطلاعات ارسال", "پرداخت", "پیگیری سفارش"];
  return (
    <ol className="steps">
      {items.map((s, i) => (
        <li key={s} className={i + 1 < step ? "done" : i + 1 === step ? "on" : ""}>
          <span>{i + 1 < step ? "✓" : toFa(i + 1)}</span> {s}
        </li>
      ))}
    </ol>
  );
}
