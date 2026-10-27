import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { ADMIN_EMAIL, DEFAULT_SETTINGS } from "../config";
import { SEED_PRODUCTS } from "../data/seedProducts";
import { storage } from "../lib/utils";

const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const sortProducts = (list) =>
  [...list].sort(
    (a, b) =>
      (b.featured ? 1 : 0) - (a.featured ? 1 : 0) ||
      (a.order ?? 999) - (b.order ?? 999) ||
      (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
  );

function applyTheme(s) {
  const r = document.documentElement.style;
  r.setProperty("--primary", s.primaryColor);
  r.setProperty("--dark", s.darkColor);
  r.setProperty("--accent", s.accentColor);
  r.setProperty("--hot", s.hotColor || "#FF7A1A");
  r.setProperty("--bg", s.bgColor);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", s.primaryColor);
}

export function AppProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [products, setProducts] = useState(SEED_PRODUCTS);
  const [productsSource, setProductsSource] = useState("seed");
  const [productsLoading, setProductsLoading] = useState(true);
  const [user, setUser] = useState(undefined); // undefined = هنوز مشخص نیست
  const [profile, setProfile] = useState(null);
  const [cart, setCart] = useState(() => storage.get("ggj-cart", []));
  const [wishlist, setWishlist] = useState(() => storage.get("ggj-wish", []));
  const [cartOpen, setCartOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const notify = useCallback((msg, type = "ok") => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  useEffect(() => { applyTheme(settings); }, [settings]);

  useEffect(
    () =>
      onSnapshot(
        doc(db, "settings", "main"),
        (snap) => snap.exists() && setSettings({ ...DEFAULT_SETTINGS, ...snap.data() }),
        () => {},
      ),
    [],
  );

  useEffect(
    () =>
      onSnapshot(
        collection(db, "products"),
        (snap) => {
          if (!snap.empty) {
            setProducts(sortProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
            setProductsSource("db");
          }
          setProductsLoading(false);
        },
        () => setProductsLoading(false),
      ),
    [],
  );

  useEffect(() => onAuthStateChanged(auth, (u) => setUser(u)), []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    return onSnapshot(
      doc(db, "users", user.uid),
      (snap) => setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setProfile(null),
    );
  }, [user]);

  useEffect(() => { storage.set("ggj-cart", cart); }, [cart]);
  useEffect(() => { storage.set("ggj-wish", wishlist); }, [wishlist]);
  // همگام‌سازی علاقه‌مندی‌ها با حساب کاربر
  useEffect(() => {
    if (profile?.wishlist) setWishlist((w) => Array.from(new Set([...profile.wishlist, ...w])));
  }, [profile?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const isAdmin = !!user && user.email === ADMIN_EMAIL && user.emailVerified;
  const productMap = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const visibleProducts = useMemo(() => products.filter((p) => p.active !== false), [products]);

  // سبد فقط id و تعداد را نگه می‌دارد؛ قیمت همیشه از آخرین اطلاعات محصول خوانده می‌شود
  const cartItems = useMemo(
    () =>
      cart
        .map((c) => ({ ...productMap[c.id], id: c.id, qty: c.qty }))
        .filter((i) => i.name && i.active !== false && Number(i.price) > 0),
    [cart, productMap],
  );
  const cartCount = cartItems.reduce((s, i) => s + i.qty, 0);
  const cartSubtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = useCallback(
    (p, qty = 1) => {
      if (!(Number(p.price) > 0)) return notify("قیمت این محصول هنوز اعلام نشده؛ برای استعلام تماس بگیرید", "err");
      const inCart = cart.find((c) => c.id === p.id)?.qty || 0;
      if (p.stock !== undefined && inCart + qty > Number(p.stock)) return notify("موجودی کافی نیست", "err");
      setCart((c) => (c.some((x) => x.id === p.id) ? c.map((x) => (x.id === p.id ? { ...x, qty: x.qty + qty } : x)) : [...c, { id: p.id, qty }]));
      notify(`«${p.name}» به سبد اضافه شد`);
    },
    [cart, notify],
  );
  const updateQty = (id, qty) => setCart((c) => (qty < 1 ? c.filter((x) => x.id !== id) : c.map((x) => (x.id === id ? { ...x, qty } : x))));
  const removeFromCart = (id) => setCart((c) => c.filter((x) => x.id !== id));
  const clearCart = () => setCart([]);

  const toggleWish = (id) => {
    const next = wishlist.includes(id) ? wishlist.filter((x) => x !== id) : [...wishlist, id];
    setWishlist(next);
    if (user) setDoc(doc(db, "users", user.uid), { wishlist: next }, { merge: true }).catch(() => {});
  };

  const logout = async () => {
    await signOut(auth);
    notify("از حساب خارج شدی");
  };

  const value = {
    settings, products, visibleProducts, productMap, productsSource, productsLoading,
    user, profile, isAdmin, logout,
    cart, cartItems, cartCount, cartSubtotal, addToCart, updateQty, removeFromCart, clearCart,
    cartOpen, setCartOpen, wishlist, toggleWish,
    toasts, notify,
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
