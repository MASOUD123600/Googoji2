import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Phone, Search, ShoppingBag, User, X } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Logo } from "./ui";
import { CATEGORIES } from "../config";
import { telLink, toFa } from "../lib/utils";

export default function Header() {
  const { settings: S, cartCount, setCartOpen, user, isAdmin, wishlist } = useApp();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const search = (e) => {
    e.preventDefault();
    nav(`/shop${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
    setMenu(false);
  };

  return (
    <>
      {S.announcement && (
        <div className="announce">
          <div className="announce-track">
            {[0, 1].map((k) => (
              <span key={k}>
                {S.announcement} &nbsp;•&nbsp; ☎ {toFa(S.phone)} &nbsp;•&nbsp; {S.workHours} &nbsp;•&nbsp;
              </span>
            ))}
          </div>
        </div>
      )}
      <header className={`header ${scrolled ? "is-scrolled" : ""}`}>
        <div className="container header-in">
          <button className="icon-btn only-mobile" onClick={() => setMenu(true)} aria-label="منو">
            <Menu size={22} />
          </button>
          <Link to="/" aria-label="صفحه اصلی">
            <Logo name={S.siteName?.replace("پت شاپ ", "") || "گوگوجی"} />
          </Link>
          <nav className="main-nav only-desktop">
            <NavLink to="/" end>خانه</NavLink>
            <NavLink to="/shop">فروشگاه</NavLink>
            <div className="nav-drop">
              <span>دسته‌بندی‌ها ▾</span>
              <div className="nav-drop-menu">
                {CATEGORIES.map((c) => (
                  <Link key={c.name} to={`/shop?cat=${encodeURIComponent(c.name)}`}>
                    <span>{c.icon}</span> {c.name}
                  </Link>
                ))}
              </div>
            </div>
            <NavLink to="/about">درباره ما</NavLink>
            <NavLink to="/contact">تماس</NavLink>
          </nav>
          <form className="search only-desktop" onSubmit={search} role="search">
            <Search size={18} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی غذا، تشویقی، برند..." aria-label="جستجو" />
          </form>
          <div className="header-actions">
            <a className="icon-btn only-desktop" href={telLink(S.phone)} aria-label="تماس">
              <Phone size={20} />
            </a>
            <Link className="icon-btn only-desktop" to="/account/wishlist" aria-label="علاقه‌مندی‌ها">
              <Heart size={20} />
              {wishlist.length > 0 && <span className="dot-badge">{toFa(wishlist.length)}</span>}
            </Link>
            <Link className="icon-btn" to={isAdmin ? "/admin" : user ? "/account" : "/login"} aria-label="حساب کاربری">
              <User size={20} />
            </Link>
            <motion.button
              className="icon-btn cart-btn"
              onClick={() => setCartOpen(true)}
              aria-label="سبد خرید"
              key={cartCount}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 0.35 }}
            >
              <ShoppingBag size={21} />
              {cartCount > 0 && <span className="dot-badge">{toFa(cartCount)}</span>}
            </motion.button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <>
            <motion.div className="drawer-bg" onClick={() => setMenu(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside
              className="drawer drawer-right"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
            >
              <div className="drawer-head">
                <Logo />
                <button className="icon-btn" onClick={() => setMenu(false)} aria-label="بستن"><X /></button>
              </div>
              <form className="search" onSubmit={search}>
                <Search size={18} />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجو..." />
              </form>
              <nav className="mobile-menu" onClick={() => setMenu(false)}>
                <Link to="/">🏠 خانه</Link>
                <Link to="/shop">🛍️ همه محصولات</Link>
                {CATEGORIES.map((c) => (
                  <Link key={c.name} to={`/shop?cat=${encodeURIComponent(c.name)}`}>{c.icon} {c.name}</Link>
                ))}
                <Link to="/about">💜 درباره ما</Link>
                <Link to="/contact">📞 تماس با ما</Link>
                <Link to="/faq">❓ سؤالات متداول</Link>
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
