import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, ShoppingBag, User } from "lucide-react";
import { useApp } from "../store/AppContext";
import { toFa } from "../lib/utils";

export default function MobileNav() {
  const { cartCount, setCartOpen, user, isAdmin } = useApp();
  return (
    <nav className="mobile-nav" aria-label="منوی پایین">
      <NavLink to="/" end><Home size={21} /><span>خانه</span></NavLink>
      <NavLink to="/shop"><LayoutGrid size={21} /><span>فروشگاه</span></NavLink>
      <button onClick={() => setCartOpen(true)}>
        <ShoppingBag size={21} />
        {cartCount > 0 && <i className="dot-badge">{toFa(cartCount)}</i>}
        <span>سبد</span>
      </button>
      <NavLink to={isAdmin ? "/admin" : user ? "/account" : "/login"}><User size={21} /><span>{isAdmin ? "مدیریت" : "حساب"}</span></NavLink>
    </nav>
  );
}
