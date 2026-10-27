import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, Trash2, X } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Img } from "./ui";
import { fmt, toFa } from "../lib/utils";

export default function CartDrawer() {
  const { cartOpen, setCartOpen, cartItems, cartSubtotal, updateQty, removeFromCart } = useApp();
  const nav = useNavigate();
  const go = (path) => {
    setCartOpen(false);
    nav(path);
  };
  return (
    <AnimatePresence>
      {cartOpen && (
        <>
          <motion.div className="drawer-bg" onClick={() => setCartOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside
            className="drawer drawer-left"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            aria-label="سبد خرید"
          >
            <div className="drawer-head">
              <h3>سبد خرید {cartItems.length > 0 && <small>({toFa(cartItems.length)} کالا)</small>}</h3>
              <button className="icon-btn" onClick={() => setCartOpen(false)} aria-label="بستن"><X /></button>
            </div>
            {cartItems.length === 0 ? (
              <div className="drawer-empty">
                <div className="big-emoji">🛒</div>
                <p>سبدت خالیه!</p>
                <button className="btn btn-p" onClick={() => go("/shop")}>بزن بریم خرید</button>
              </div>
            ) : (
              <>
                <div className="drawer-list">
                  <AnimatePresence initial={false}>
                    {cartItems.map((i) => (
                      <motion.div key={i.id} className="mini-item" layout exit={{ opacity: 0, x: -40 }}>
                        <Link to={`/p/${i.slug || i.id}`} onClick={() => setCartOpen(false)} className="mini-img">
                          <Img src={i.images?.[0] || i.imageUrl} small alt={i.name} />
                        </Link>
                        <div className="mini-info">
                          <div className="mini-name">{i.name}</div>
                          <div className="mini-price">{fmt(i.price * i.qty)}</div>
                          <div className="qty sm">
                            <button onClick={() => updateQty(i.id, i.qty + 1)} aria-label="افزایش"><Plus size={14} /></button>
                            <span>{toFa(i.qty)}</span>
                            <button onClick={() => updateQty(i.id, i.qty - 1)} aria-label="کاهش"><Minus size={14} /></button>
                          </div>
                        </div>
                        <button className="icon-btn danger" onClick={() => removeFromCart(i.id)} aria-label="حذف"><Trash2 size={17} /></button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
                <div className="drawer-foot">
                  <div className="row-between"><span>جمع سبد</span><b>{fmt(cartSubtotal)}</b></div>
                  <button className="btn btn-p btn-block" onClick={() => go("/checkout")}>ادامه و تکمیل خرید</button>
                  <button className="btn btn-ghost btn-block" onClick={() => go("/cart")}>مشاهده سبد خرید</button>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
