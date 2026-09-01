import React, {
  useState,
  useEffect,
  createContext,
  useContext,
  useRef,
} from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
  getDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyD4PHoP3O2-MZiB_d1Ryt1Rs2iobViuNas",
  authDomain: "googoji-ae717.firebaseapp.com",
  projectId: "googoji-ae717",
  storageBucket: "googoji-ae717.firebasestorage.app",
  messagingSenderId: "51033389121",
  appId: "1:51033389121:web:a7e3aa6c0c60cc95062ec0",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const ADMIN_USERNAME = "KENSHIN";
const ADMIN_PASSWORD = "Masood1380";

const DEFAULT_SETTINGS = {
  siteName: "گوگوجی پت شاپ",
  siteSlogan: "بهترین لوازم و غذا",
  heroTitle: "بهترین لوازم و غذا برای عزیزانت 🐾",
  heroSubtitle: "در گوگوجی همه چیز برای سلامت و شادی حیوان خانگیت آماده‌ست.",
  heroBtn1: "مشاهده محصولات 🛍️",
  heroBtn2: "ثبت‌نام رایگان",
  feat1Icon: "🚚",
  feat1Title: "ارسال رایگان",
  feat1Desc: "برای خریدهای بالای ۵۰۰ هزار تومان",
  feat2Icon: "✅",
  feat2Title: "تضمین اصالت",
  feat2Desc: "تمام محصولات گارانتی دارند",
  feat3Icon: "💳",
  feat3Title: "پرداخت امن",
  feat3Desc: "درگاه پرداخت معتبر زرین‌پال",
  feat4Icon: "🎁",
  feat4Title: "برنامه معرفی",
  feat4Desc: "دوستت رو معرفی کن، تخفیف بگیر",
  phone: "021-12345678",
  email: "info@googoji.ir",
  address: "تهران",
  footerDesc: "بهترین لوازم و غذا برای حیوانات خانگی. کیفیت تضمین‌شده.",
  freeShippingMin: "500000",
  shippingCost: "30000",
  primaryColor: "#E07B39",
  darkColor: "#2C1810",
  accentColor: "#F5C842",
  bgColor: "#FDF8F3",
};

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);
const fmt = (n) => Number(n).toLocaleString("fa-IR") + " تومان";

export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [orders, setOrders] = useState([]);
  const [notif, setNotif] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  // Load settings from Firebase
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "main"));
        if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
      } catch (e) {}
    };
    loadSettings();
    // Real-time settings listener
    const unsub = onSnapshot(doc(db, "settings", "main"), (snap) => {
      if (snap.exists()) setSettings({ ...DEFAULT_SETTINGS, ...snap.data() });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) {
      setOrders([]);
      return;
    }
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setOrders(
        snap.docs
          .map((d) => ({ id: d.id, ...d.data() }))
          .filter((o) => o.userId === user.uid)
      );
    });
    return unsub;
  }, [user]);

  const notify = (msg, type = "ok") => {
    setNotif({ msg, type });
    setTimeout(() => setNotif(null), 3500);
  };
  const addToCart = (p) => {
    setCart((prev) => {
      const ex = prev.find((i) => i.id === p.id);
      if (ex)
        return prev.map((i) => (i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
      return [...prev, { ...p, qty: 1 }];
    });
    notify(`${p.name} به سبد اضافه شد 🛒`);
  };
  const removeFromCart = (id) => setCart((p) => p.filter((i) => i.id !== id));
  const updateQty = (id, qty) => {
    if (qty < 1) {
      removeFromCart(id);
      return;
    }
    setCart((p) => p.map((i) => (i.id === id ? { ...i, qty } : i)));
  };
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const logout = async () => {
    if (isAdmin) {
      setIsAdmin(false);
      notify("از پنل ادمین خارج شدی");
      return;
    }
    await signOut(auth);
    notify("خروج انجام شد");
    setPage("home");
  };

  const S = settings;
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800;900&display=swap');
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Vazirmatn',sans-serif;direction:rtl;background:${S.bgColor};color:#1A0F0A}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${S.primaryColor};border-radius:4px}
    .app{min-height:100vh}
    .header{background:${S.darkColor};color:white;padding:0 20px;height:62px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:200;box-shadow:0 2px 20px #0004}
    .logo{font-size:1.4rem;font-weight:900;cursor:pointer;display:flex;align-items:center;gap:8px}
    .logo em{color:${S.accentColor};font-style:normal}
    .nav{display:flex;gap:3px;align-items:center;flex-wrap:wrap}
    .nb{background:none;border:none;color:rgba(255,255,255,0.85);cursor:pointer;padding:7px 12px;border-radius:8px;font-family:inherit;font-size:.82rem;font-weight:600;transition:all .2s}
    .nb:hover,.nb.on{background:${S.primaryColor};color:white}
    .badge{background:${S.accentColor};color:${S.darkColor};font-size:.65rem;font-weight:900;border-radius:50%;width:18px;height:18px;display:inline-flex;align-items:center;justify-content:center;margin-right:3px}
    .notif{position:fixed;top:76px;left:50%;transform:translateX(-50%);background:${S.darkColor};color:white;padding:11px 28px;border-radius:12px;z-index:999;font-weight:700;font-size:.9rem;box-shadow:0 8px 32px #0003;border-right:4px solid ${S.accentColor};animation:sli .3s;white-space:nowrap}
    .notif.err{border-color:#e74c3c}
    @keyframes sli{from{opacity:0;top:56px}to{opacity:1;top:76px}}
    .hero{background:linear-gradient(135deg,${S.darkColor} 0%,${S.primaryColor}99 100%);color:white;padding:72px 24px;text-align:center;position:relative;overflow:hidden}
    .hero::after{content:'🐾';position:absolute;font-size:18rem;opacity:.04;bottom:-40px;left:-20px;transform:rotate(20deg)}
    .h1{font-size:clamp(1.8rem,5vw,3.2rem);font-weight:900;line-height:1.2;margin-bottom:14px}
    .h1 span{color:${S.accentColor}}
    .hsub{font-size:1rem;opacity:.85;max-width:480px;margin:0 auto 28px;line-height:1.8}
    .hbtns{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
    .btn{padding:13px 28px;border-radius:11px;font-family:inherit;font-size:.95rem;font-weight:700;cursor:pointer;border:none;transition:all .2s}
    .btn-p{background:${S.primaryColor};color:white}.btn-p:hover{opacity:.9;transform:translateY(-2px)}
    .btn-o{background:transparent;color:white;border:2px solid rgba(255,255,255,.5)}.btn-o:hover{background:rgba(255,255,255,.1)}
    .btn-a{background:${S.accentColor};color:${S.darkColor}}.btn-a:hover{opacity:.9}
    .btn-g{background:transparent;border:2px solid ${S.primaryColor};color:${S.primaryColor}}.btn-g:hover{background:${S.primaryColor};color:white}
    .btn-r{background:#e74c3c;color:white}.btn-r:hover{opacity:.85}
    .btn-sm{padding:7px 16px;font-size:.8rem;border-radius:8px}
    .feats{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px;padding:40px 20px;max-width:1100px;margin:0 auto}
    .feat{background:white;border-radius:16px;padding:24px;text-align:center;box-shadow:0 2px 12px #0001;transition:transform .2s}
    .feat:hover{transform:translateY(-4px)}
    .feat-icon{font-size:2.2rem;margin-bottom:10px}
    .feat-t{font-weight:800;font-size:.95rem;margin-bottom:5px}
    .feat-d{font-size:.8rem;color:#7A5C4F;line-height:1.7}
    .sec{padding:40px 20px;max-width:1100px;margin:0 auto}
    .sec-h{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}
    .sec-t{font-size:1.5rem;font-weight:900}.sec-t span{color:${S.primaryColor}}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:18px}
    .pcard{background:white;border-radius:18px;overflow:hidden;box-shadow:0 2px 14px #0001;transition:all .3s;position:relative}
    .pcard:hover{transform:translateY(-5px);box-shadow:0 12px 36px #0002}
    .pimg{height:200px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#f8f8f8}
    .pimg img{width:100%;height:100%;object-fit:cover}
    .pimg-ph{font-size:4.5rem}
    .pbadge{position:absolute;top:10px;right:10px;background:${S.accentColor};color:${S.darkColor};font-size:.68rem;font-weight:900;padding:3px 10px;border-radius:20px}
    .pbody{padding:16px}
    .pcat{font-size:.72rem;color:${S.primaryColor};font-weight:800;margin-bottom:5px;text-transform:uppercase}
    .pname{font-weight:800;font-size:.9rem;line-height:1.4;margin-bottom:7px}
    .pdesc{font-size:.78rem;color:#7A5C4F;line-height:1.7;margin-bottom:13px}
    .pfoot{display:flex;align-items:center;justify-content:space-between}
    .pprice{font-size:1rem;font-weight:900;color:${S.primaryColor}}
    .pstock{font-size:.72rem;color:#7A5C4F;margin-top:2px}
    .filt{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
    .fb{padding:7px 16px;border-radius:20px;border:2px solid ${S.primaryColor};background:transparent;color:${S.primaryColor};font-family:inherit;font-size:.82rem;font-weight:700;cursor:pointer;transition:all .2s}
    .fb.on,.fb:hover{background:${S.primaryColor};color:white}
    .sinput{width:100%;max-width:380px;padding:10px 16px;border-radius:10px;border:2px solid #0001;font-family:inherit;font-size:.9rem;outline:none;margin-bottom:20px;background:${S.bgColor}}
    .sinput:focus{border-color:${S.primaryColor}}
    .cart-wrap{max-width:720px;margin:0 auto;padding:40px 20px}
    .citem{background:white;border-radius:14px;padding:14px 18px;display:flex;align-items:center;gap:14px;border:1px solid #0001;margin-bottom:10px}
    .cimg{width:60px;height:60px;border-radius:10px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:1.8rem;overflow:hidden;flex-shrink:0}
    .cimg img{width:100%;height:100%;object-fit:cover}
    .cinfo{flex:1}.cname{font-weight:800;font-size:.9rem;margin-bottom:3px}.cprice{color:${S.primaryColor};font-weight:700;font-size:.88rem}
    .qty{display:flex;align-items:center;gap:8px}
    .qb{width:30px;height:30px;border-radius:7px;border:2px solid ${S.primaryColor};background:transparent;color:${S.primaryColor};font-size:1rem;font-weight:800;cursor:pointer;display:flex;align-items:center;justify-content:center}
    .qb:hover{background:${S.primaryColor};color:white}
    .qn{font-weight:800;min-width:22px;text-align:center}
    .sum{background:white;border-radius:18px;padding:22px;margin-top:20px}
    .srow{display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #0001;font-size:.9rem}
    .srow:last-child{border:none;font-weight:900;font-size:1.05rem;color:${S.primaryColor}}
    .auth-wrap{max-width:400px;margin:70px auto;padding:0 20px}
    .acard{background:white;border-radius:22px;padding:36px;box-shadow:0 8px 40px #0001}
    .at{font-size:1.5rem;font-weight:900;margin-bottom:6px}.as{color:#7A5C4F;font-size:.88rem;margin-bottom:24px}
    .fg{margin-bottom:14px}.fl{font-weight:700;font-size:.82rem;display:block;margin-bottom:5px;color:#7A5C4F}
    .fi{width:100%;padding:11px 14px;border-radius:10px;border:2px solid #0001;font-family:inherit;font-size:.95rem;transition:border .2s;outline:none;background:${S.bgColor}}
    .fi:focus{border-color:${S.primaryColor}}
    .panel-wrap{padding:40px 20px;max-width:1100px;margin:0 auto}
    .pg{display:grid;grid-template-columns:220px 1fr;gap:22px}
    .psb{background:white;border-radius:18px;padding:20px;align-self:start;position:sticky;top:76px}
    .pmi{display:flex;align-items:center;gap:10px;padding:11px 14px;border-radius:9px;cursor:pointer;font-weight:700;font-size:.88rem;transition:all .2s;color:#7A5C4F;margin-bottom:4px}
    .pmi:hover,.pmi.on{background:${S.primaryColor};color:white}
    .pc{background:white;border-radius:18px;padding:26px}
    .stat{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:14px;margin-bottom:24px}
    .scard{background:${S.bgColor};border-radius:14px;padding:18px;text-align:center}
    .sval{font-size:1.6rem;font-weight:900;color:${S.primaryColor};margin-bottom:4px}.slbl{font-size:.78rem;color:#7A5C4F}
    .ocard{border:1px solid #0001;border-radius:12px;padding:14px 18px;margin-bottom:10px}
    .oh{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px}
    .ostatus{background:#3D7A5E;color:white;font-size:.72rem;font-weight:800;padding:3px 10px;border-radius:20px}
    .adp{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px}
    .apcard{border:1px solid #0001;border-radius:12px;padding:12px 16px;display:flex;align-items:center;gap:12px}
    .apimg{width:48px;height:48px;border-radius:8px;background:#f0f0f0;display:flex;align-items:center;justify-content:center;font-size:1.4rem;overflow:hidden;flex-shrink:0}
    .apimg img{width:100%;height:100%;object-fit:cover}
    .upload-area{border:2px dashed ${S.primaryColor}50;border-radius:12px;padding:20px;text-align:center;cursor:pointer;transition:all .2s;margin-bottom:12px}
    .upload-area:hover{background:${S.primaryColor}10;border-color:${S.primaryColor}}
    .preview-img{width:100%;max-height:160px;object-fit:cover;border-radius:10px;margin-bottom:10px}
    .settings-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
    .settings-section{background:${S.bgColor};border-radius:14px;padding:18px;margin-bottom:16px}
    .settings-section h4{font-weight:800;margin-bottom:14px;color:${S.primaryColor};font-size:.95rem;border-bottom:2px solid ${S.primaryColor}20;padding-bottom:8px}
    .color-row{display:flex;align-items:center;gap:10px;margin-bottom:10px}
    .color-input{width:50px;height:36px;border-radius:8px;border:2px solid #0001;cursor:pointer;padding:2px}
    .empty{text-align:center;padding:60px 20px;color:#7A5C4F}
    .empty-icon{font-size:4rem;margin-bottom:14px}
    .admin-bar{background:${S.accentColor};color:${S.darkColor};padding:7px 22px;display:flex;align-items:center;justify-content:space-between;font-weight:800;font-size:.82rem}
    @media(max-width:700px){.pg{grid-template-columns:1fr}.psb{position:static}.nav .nb{padding:5px 8px;font-size:.75rem}.citem{flex-wrap:wrap}}
  `;

  const ctx = {
    settings: S,
    page,
    setPage,
    user,
    isAdmin,
    setIsAdmin,
    products,
    cart,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQty,
    orders,
    notify,
    logout,
    loading,
    db,
    auth,
    storage,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <style>{css}</style>
      <div className="app">
        {notif && (
          <div className={`notif ${notif.type === "err" ? "err" : ""}`}>
            {notif.msg}
          </div>
        )}
        {isAdmin && (
          <div className="admin-bar">
            <span>⚙️ حالت مدیریت — KENSHIN</span>
            <button
              style={{
                background: S.darkColor,
                color: "white",
                border: "none",
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: 700,
                borderRadius: 8,
                padding: "5px 14px",
              }}
              onClick={logout}
            >
              خروج
            </button>
          </div>
        )}
        <Header />
        {page === "home" && <HomePage />}
        {page === "shop" && <ShopPage />}
        {page === "cart" && <CartPage />}
        {page === "login" && <LoginPage />}
        {page === "register" && <RegisterPage />}
        {page === "admin-login" && <AdminLoginPage />}
        {page === "panel" && <UserPanel />}
        {page === "admin" && <AdminPanel />}
        <Footer />
      </div>
    </AppCtx.Provider>
  );
}

function Header() {
  const {
    settings: S,
    setPage,
    page,
    cartCount,
    user,
    isAdmin,
    logout,
  } = useApp();
  return (
    <header className="header">
      <div className="logo" onClick={() => setPage("home")}>
        🐾 {S.siteName?.split(" ")[0] || "گوگوجی"}
        <em> {S.siteName?.split(" ").slice(1).join(" ") || "پت شاپ"}</em>
      </div>
      <nav className="nav">
        <button
          className={`nb ${page === "home" ? "on" : ""}`}
          onClick={() => setPage("home")}
        >
          خانه
        </button>
        <button
          className={`nb ${page === "shop" ? "on" : ""}`}
          onClick={() => setPage("shop")}
        >
          فروشگاه
        </button>
        {isAdmin ? (
          <button
            className={`nb ${page === "admin" ? "on" : ""}`}
            onClick={() => setPage("admin")}
          >
            ⚙️ مدیریت
          </button>
        ) : user ? (
          <button
            className={`nb ${page === "panel" ? "on" : ""}`}
            onClick={() => setPage("panel")}
          >
            👤 پنل من
          </button>
        ) : (
          <>
            <button
              className={`nb ${page === "login" ? "on" : ""}`}
              onClick={() => setPage("login")}
            >
              ورود
            </button>
            <button
              className={`nb ${page === "register" ? "on" : ""}`}
              onClick={() => setPage("register")}
            >
              ثبت‌نام
            </button>
          </>
        )}
        {(user || isAdmin) && (
          <button className="nb" onClick={logout}>
            خروج
          </button>
        )}
        <button
          className={`nb ${page === "cart" ? "on" : ""}`}
          onClick={() => setPage("cart")}
        >
          {cartCount > 0 && <span className="badge">{cartCount}</span>}🛒
        </button>
      </nav>
    </header>
  );
}

function HomePage() {
  const { settings: S, setPage, products } = useApp();
  return (
    <main>
      <section className="hero">
        <h1
          className="h1"
          dangerouslySetInnerHTML={{
            __html:
              S.heroTitle?.replace(/\*\*(.*?)\*\*/g, "<span>$1</span>") ||
              S.heroTitle,
          }}
        />
        <p className="hsub">{S.heroSubtitle}</p>
        <div className="hbtns">
          <button className="btn btn-p" onClick={() => setPage("shop")}>
            {S.heroBtn1}
          </button>
          <button className="btn btn-o" onClick={() => setPage("register")}>
            {S.heroBtn2}
          </button>
        </div>
      </section>
      <div className="feats">
        {[
          { i: S.feat1Icon, t: S.feat1Title, d: S.feat1Desc },
          { i: S.feat2Icon, t: S.feat2Title, d: S.feat2Desc },
          { i: S.feat3Icon, t: S.feat3Title, d: S.feat3Desc },
          { i: S.feat4Icon, t: S.feat4Title, d: S.feat4Desc },
        ].map((f) => (
          <div key={f.t} className="feat">
            <div className="feat-icon">{f.i}</div>
            <div className="feat-t">{f.t}</div>
            <div className="feat-d">{f.d}</div>
          </div>
        ))}
      </div>
      <div className="sec">
        <div className="sec-h">
          <h2 className="sec-t">
            پر<span>فروش‌ترین</span>ها
          </h2>
          <button className="btn btn-g btn-sm" onClick={() => setPage("shop")}>
            همه محصولات ←
          </button>
        </div>
        <div className="grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {products.length === 0 && (
            <div className="empty">
              <div className="empty-icon">📦</div>
              <p>هنوز محصولی اضافه نشده</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ProductCard({ product: p }) {
  const { addToCart } = useApp();
  return (
    <div className="pcard">
      <div className="pimg">
        {p.imageUrl ? (
          <img src={p.imageUrl} alt={p.name} />
        ) : (
          <div className="pimg-ph">{p.emoji || "🐾"}</div>
        )}
      </div>
      {p.badge && <span className="pbadge">{p.badge}</span>}
      <div className="pbody">
        <div className="pcat">
          {p.category} • {p.pet}
        </div>
        <div className="pname">{p.name}</div>
        <div className="pdesc">{p.desc}</div>
        <div className="pfoot">
          <div>
            <div className="pprice">{fmt(p.price)}</div>
            <div className="pstock">موجودی: {p.stock}</div>
          </div>
          <button
            className="btn btn-p btn-sm"
            onClick={() => addToCart(p)}
            disabled={p.stock < 1}
          >
            {p.stock < 1 ? "ناموجود" : "افزودن 🛒"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ShopPage() {
  const { products } = useApp();
  const [filter, setFilter] = useState("همه");
  const [pet, setPet] = useState("همه");
  const [search, setSearch] = useState("");
  const cats = [
    "همه",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];
  const pets = ["همه", ...new Set(products.map((p) => p.pet).filter(Boolean))];
  const filtered = products.filter(
    (p) =>
      (filter === "همه" || p.category === filter) &&
      (pet === "همه" || p.pet === pet) &&
      (!search || p.name?.includes(search))
  );
  return (
    <div className="sec">
      <div className="sec-h">
        <h2 className="sec-t">
          فروشگاه <span>گوگوجی</span>
        </h2>
        <span style={{ fontSize: ".85rem", color: "#999" }}>
          {filtered.length} محصول
        </span>
      </div>
      <input
        className="sinput"
        placeholder="🔍 جستجو..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div className="filt">
        {cats.map((c) => (
          <button
            key={c}
            className={`fb ${filter === c ? "on" : ""}`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="filt">
        {pets.map((p) => (
          <button
            key={p}
            className={`fb ${pet === p ? "on" : ""}`}
            onClick={() => setPet(p)}
          >
            {p}
          </button>
        ))}
      </div>
      <div className="grid">
        {filtered.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
        {filtered.length === 0 && (
          <div className="empty" style={{ gridColumn: "1/-1" }}>
            <div className="empty-icon">🔍</div>
            <p>محصولی پیدا نشد</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CartPage() {
  const {
    settings: S,
    cart,
    removeFromCart,
    updateQty,
    cartTotal,
    user,
    notify,
    setPage,
    db,
  } = useApp();
  const [paying, setPaying] = useState(false);
  const shipping =
    cartTotal >= parseInt(S.freeShippingMin || 500000)
      ? 0
      : parseInt(S.shippingCost || 30000);
  const checkout = async () => {
    if (!user) {
      notify("ابتدا وارد شو!", "err");
      setPage("login");
      return;
    }
    setPaying(true);
    try {
      await addDoc(collection(db, "orders"), {
        userId: user.uid,
        userEmail: user.email,
        items: cart.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          qty: i.qty,
        })),
        total: cartTotal + shipping,
        status: "در انتظار پرداخت",
        createdAt: new Date(),
      });
      notify("سفارش ثبت شد! برای پرداخت تماس بگیرید 📞");
      setPage("panel");
    } catch {
      notify("خطا در ثبت سفارش", "err");
    }
    setPaying(false);
  };
  if (cart.length === 0)
    return (
      <div className="empty" style={{ padding: "80px 20px" }}>
        <div className="empty-icon">🛒</div>
        <h3 style={{ fontWeight: 800, marginBottom: 8 }}>سبد خریدت خالیه!</h3>
        <button
          className="btn btn-p"
          style={{ marginTop: 16 }}
          onClick={() => useApp().setPage("shop")}
        >
          رفتن به فروشگاه
        </button>
      </div>
    );
  return (
    <div className="cart-wrap">
      <h2 className="sec-t" style={{ marginBottom: 22 }}>
        سبد <span>خرید</span>
      </h2>
      {cart.map((item) => (
        <div key={item.id} className="citem">
          <div className="cimg">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} />
            ) : (
              item.emoji || "🐾"
            )}
          </div>
          <div className="cinfo">
            <div className="cname">{item.name}</div>
            <div className="cprice">{fmt(item.price)}</div>
          </div>
          <div className="qty">
            <button
              className="qb"
              onClick={() => updateQty(item.id, item.qty - 1)}
            >
              −
            </button>
            <span className="qn">{item.qty}</span>
            <button
              className="qb"
              onClick={() => updateQty(item.id, item.qty + 1)}
            >
              +
            </button>
          </div>
          <button
            onClick={() => removeFromCart(item.id)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "1.1rem",
            }}
          >
            🗑️
          </button>
        </div>
      ))}
      <div className="sum">
        <div className="srow">
          <span>جمع:</span>
          <span>{fmt(cartTotal)}</span>
        </div>
        <div className="srow">
          <span>ارسال:</span>
          <span>{shipping === 0 ? "رایگان 🎉" : fmt(shipping)}</span>
        </div>
        <div className="srow">
          <span>قابل پرداخت:</span>
          <span>{fmt(cartTotal + shipping)}</span>
        </div>
        <div
          style={{
            background: `linear-gradient(135deg,${S.darkColor},${S.primaryColor}88)`,
            color: "white",
            borderRadius: 16,
            padding: 22,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.1rem", fontWeight: 800, marginBottom: 8 }}>
            💳 پرداخت
          </div>
          <p style={{ fontSize: ".85rem", opacity: 0.85, marginBottom: 14 }}>
            درگاه پرداخت بعد از دریافت اینماد فعال می‌شه. فعلاً سفارش ثبت کن.
          </p>
          <button
            className="btn btn-a"
            style={{ width: "100%" }}
            onClick={checkout}
            disabled={paying}
          >
            {paying ? "در حال ثبت..." : "ثبت سفارش 📋"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LoginPage() {
  const { auth, notify, setPage } = useApp();
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const login = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      notify("خوش اومدی! 👋");
      setPage("panel");
    } catch {
      notify("ایمیل یا رمز اشتباهه", "err");
    }
    setLoading(false);
  };
  const { settings: S } = useApp();
  return (
    <div className="auth-wrap">
      <div className="acard">
        <div
          style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: 14 }}
        >
          🐾
        </div>
        <h2 className="at">ورود</h2>
        <p className="as">خوش اومدی!</p>
        <div className="fg">
          <label className="fl">ایمیل</label>
          <input
            className="fi"
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="fg">
          <label className="fl">رمز عبور</label>
          <input
            className="fi"
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
        </div>
        <button
          className="btn btn-p"
          style={{ width: "100%", marginTop: 6 }}
          onClick={login}
          disabled={loading}
        >
          {loading ? "..." : "ورود"}
        </button>
        <p
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: ".85rem",
            color: "#999",
          }}
        >
          حساب نداری؟{" "}
          <span
            style={{
              color: S.primaryColor,
              cursor: "pointer",
              fontWeight: 700,
            }}
            onClick={() => setPage("register")}
          >
            ثبت‌نام کن
          </span>
        </p>
        <p
          style={{
            textAlign: "center",
            marginTop: 8,
            fontSize: ".8rem",
            color: "#bbb",
          }}
        >
          <span
            style={{ cursor: "pointer" }}
            onClick={() => setPage("admin-login")}
          >
            ورود ادمین ⚙️
          </span>
        </p>
      </div>
    </div>
  );
}

function RegisterPage() {
  const { auth, notify, setPage } = useApp();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const { settings: S } = useApp();
  const register = async () => {
    if (!name || !email || !pass) {
      notify("همه فیلدها رو پر کن!", "err");
      return;
    }
    if (pass.length < 6) {
      notify("رمز باید حداقل ۶ کاراکتر باشه", "err");
      return;
    }
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await sendEmailVerification(cred.user);
      notify("ثبت‌نام موفق! ایمیل تأیید فرستادیم 📧");
      setPage("panel");
    } catch (e) {
      if (e.code === "auth/email-already-in-use")
        notify("این ایمیل قبلاً ثبت شده", "err");
      else notify("خطا در ثبت‌نام", "err");
    }
    setLoading(false);
  };
  return (
    <div className="auth-wrap">
      <div className="acard">
        <div
          style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: 14 }}
        >
          🎉
        </div>
        <h2 className="at">ثبت‌نام</h2>
        <p className="as">عضو خانواده گوگوجی بشو!</p>
        <div className="fg">
          <label className="fl">نام</label>
          <input
            className="fi"
            placeholder="مثلاً: علی"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="fg">
          <label className="fl">ایمیل</label>
          <input
            className="fi"
            type="email"
            placeholder="example@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="fg">
          <label className="fl">رمز عبور</label>
          <input
            className="fi"
            type="password"
            placeholder="حداقل ۶ کاراکتر"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
          />
        </div>
        <button
          className="btn btn-p"
          style={{ width: "100%", marginTop: 6 }}
          onClick={register}
          disabled={loading}
        >
          {loading ? "..." : "ثبت‌نام"}
        </button>
        <p
          style={{
            textAlign: "center",
            marginTop: 14,
            fontSize: ".85rem",
            color: "#999",
          }}
        >
          حساب داری؟{" "}
          <span
            style={{
              color: S.primaryColor,
              cursor: "pointer",
              fontWeight: 700,
            }}
            onClick={() => setPage("login")}
          >
            وارد شو
          </span>
        </p>
      </div>
    </div>
  );
}

function AdminLoginPage() {
  const { notify, setPage, setIsAdmin } = useApp();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const login = () => {
    if (u === ADMIN_USERNAME && p === ADMIN_PASSWORD) {
      setIsAdmin(true);
      notify("خوش اومدی KENSHIN! ⚙️");
      setPage("admin");
    } else {
      notify("یوزر یا رمز اشتباهه", "err");
    }
  };
  return (
    <div className="auth-wrap">
      <div className="acard">
        <div
          style={{ textAlign: "center", fontSize: "2.5rem", marginBottom: 14 }}
        >
          ⚙️
        </div>
        <h2 className="at">ورود ادمین</h2>
        <p className="as">فقط برای مدیر سایت</p>
        <div className="fg">
          <label className="fl">نام کاربری</label>
          <input
            className="fi"
            placeholder="KENSHIN"
            value={u}
            onChange={(e) => setU(e.target.value)}
          />
        </div>
        <div className="fg">
          <label className="fl">رمز عبور</label>
          <input
            className="fi"
            type="password"
            placeholder="••••••••"
            value={p}
            onChange={(e) => setP(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
          />
        </div>
        <button
          className="btn btn-p"
          style={{ width: "100%", marginTop: 6 }}
          onClick={login}
        >
          ورود
        </button>
      </div>
    </div>
  );
}

function UserPanel() {
  const { user, orders, setPage } = useApp();
  const [tab, setTab] = useState("dash");
  if (!user)
    return (
      <div className="empty" style={{ padding: "80px 20px" }}>
        <div className="empty-icon">🔒</div>
        <p>ابتدا وارد شو</p>
        <button
          className="btn btn-p"
          style={{ marginTop: 16 }}
          onClick={() => setPage("login")}
        >
          ورود
        </button>
      </div>
    );
  return (
    <div className="panel-wrap">
      <h2 className="sec-t" style={{ marginBottom: 22 }}>
        پنل <span>شخصی</span>
      </h2>
      <div className="pg">
        <div className="psb">
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: "3rem" }}>👤</div>
            <div style={{ fontWeight: 800 }}>{user.email?.split("@")[0]}</div>
            <div style={{ fontSize: ".78rem", color: "#7A5C4F" }}>
              {user.email}
            </div>
          </div>
          {[
            { id: "dash", i: "🏠", l: "خلاصه" },
            { id: "orders", i: "📦", l: "سفارشات" },
          ].map((t) => (
            <div
              key={t.id}
              className={`pmi ${tab === t.id ? "on" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.i}</span>
              {t.l}
            </div>
          ))}
        </div>
        <div className="pc">
          {tab === "dash" && (
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 18 }}>خلاصه حساب</h3>
              <div className="stat">
                <div className="scard">
                  <div className="sval">{orders.length}</div>
                  <div className="slbl">سفارشات</div>
                </div>
              </div>
            </div>
          )}
          {tab === "orders" && (
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 18 }}>
                سفارشات من 📦
              </h3>
              {orders.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📭</div>
                  <p>هنوز سفارشی ندادی</p>
                  <button
                    className="btn btn-p btn-sm"
                    style={{ marginTop: 14 }}
                    onClick={() => setPage("shop")}
                  >
                    برو خرید کن!
                  </button>
                </div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="ocard">
                    <div className="oh">
                      <div>
                        <div style={{ fontWeight: 800, fontSize: ".88rem" }}>
                          #{o.id.slice(-6)}
                        </div>
                        <div style={{ fontSize: ".75rem", color: "#7A5C4F" }}>
                          {o.createdAt?.toDate?.()?.toLocaleDateString("fa-IR")}
                        </div>
                      </div>
                      <span className="ostatus">{o.status}</span>
                    </div>
                    <div
                      style={{
                        fontSize: ".82rem",
                        color: "#7A5C4F",
                        marginBottom: 6,
                      }}
                    >
                      {o.items?.map((i) => `${i.name} (×${i.qty})`).join(" — ")}
                    </div>
                    <div style={{ fontWeight: 800, color: "#E07B39" }}>
                      {fmt(o.total)}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminPanel() {
  const {
    settings: S,
    isAdmin,
    products,
    db,
    storage,
    notify,
    setPage,
  } = useApp();
  const [tab, setTab] = useState("products");
  const [form, setForm] = useState({
    name: "",
    price: "",
    category: "غذا",
    pet: "سگ",
    desc: "",
    emoji: "🐾",
    stock: "10",
    badge: "",
  });
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [siteSettings, setSiteSettings] = useState(S);
  const [savingSettings, setSavingSettings] = useState(false);
  const fileRef = useRef();

  if (!isAdmin)
    return (
      <div className="empty" style={{ padding: "80px 20px" }}>
        <div className="empty-icon">🔒</div>
        <p>دسترسی ندارید</p>
      </div>
    );

  useEffect(() => {
    setSiteSettings(S);
  }, [S]);

  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) =>
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return unsub;
  }, []);

  const handleImg = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImgFile(f);
    setImgPreview(URL.createObjectURL(f));
  };

  const addProduct = async () => {
    if (!form.name || !form.price) {
      notify("نام و قیمت الزامیه!", "err");
      return;
    }
    setUploading(true);
    try {
      let imageUrl = "";
      if (imgFile) {
        const r = ref(storage, `products/${Date.now()}_${imgFile.name}`);
        await uploadBytes(r, imgFile);
        imageUrl = await getDownloadURL(r);
      }
      await addDoc(collection(db, "products"), {
        ...form,
        price: parseInt(form.price),
        stock: parseInt(form.stock),
        imageUrl,
        createdAt: new Date(),
      });
      setForm({
        name: "",
        price: "",
        category: "غذا",
        pet: "سگ",
        desc: "",
        emoji: "🐾",
        stock: "10",
        badge: "",
      });
      setImgFile(null);
      setImgPreview(null);
      notify("محصول اضافه شد ✅");
    } catch {
      notify("خطا در اضافه کردن", "err");
    }
    setUploading(false);
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("مطمئنی؟")) return;
    await deleteDoc(doc(db, "products", id));
    notify("محصول حذف شد");
  };
  const updateOrderStatus = async (id, status) => {
    await updateDoc(doc(db, "orders", id), { status });
    notify("وضعیت بروز شد ✅");
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "main"), siteSettings);
      notify("تنظیمات ذخیره شد ✅");
    } catch {
      notify("خطا در ذخیره", "err");
    }
    setSavingSettings(false);
  };

  const SettingField = ({ label, field, type = "text", placeholder }) => (
    <div className="fg">
      <label className="fl">{label}</label>
      <input
        className="fi"
        type={type}
        placeholder={placeholder || label}
        value={siteSettings[field] || ""}
        onChange={(e) =>
          setSiteSettings((p) => ({ ...p, [field]: e.target.value }))
        }
        style={{ fontSize: ".88rem" }}
      />
    </div>
  );

  const tabs = [
    { id: "products", i: "📦", l: "محصولات" },
    { id: "add", i: "➕", l: "افزودن" },
    { id: "orders", i: "🧾", l: "سفارشات" },
    { id: "settings", i: "⚙️", l: "تنظیمات سایت" },
  ];

  return (
    <div className="panel-wrap">
      <h2 className="sec-t" style={{ marginBottom: 22 }}>
        پنل <span>مدیریت</span>
      </h2>
      <div className="pg">
        <div className="psb">
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <div style={{ fontSize: "2.5rem" }}>⚙️</div>
            <div style={{ fontWeight: 800 }}>KENSHIN</div>
            <div style={{ fontSize: ".78rem", color: "#7A5C4F" }}>
              مدیر سایت
            </div>
          </div>
          {tabs.map((t) => (
            <div
              key={t.id}
              className={`pmi ${tab === t.id ? "on" : ""}`}
              onClick={() => setTab(t.id)}
            >
              <span>{t.i}</span>
              {t.l}
            </div>
          ))}
        </div>
        <div className="pc">
          {tab === "products" && (
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 18 }}>
                مدیریت محصولات ({products.length})
              </h3>
              <div className="adp">
                {products.map((p) => (
                  <div key={p.id} className="apcard">
                    <div className="apimg">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} />
                      ) : (
                        p.emoji || "🐾"
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: ".88rem" }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: ".78rem", color: "#7A5C4F" }}>
                        {fmt(p.price)}
                      </div>
                      <div style={{ fontSize: ".72rem", color: "#7A5C4F" }}>
                        موجودی: {p.stock}
                      </div>
                    </div>
                    <button
                      className="btn btn-r btn-sm"
                      onClick={() => deleteProduct(p.id)}
                    >
                      حذف
                    </button>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="empty">
                    <div className="empty-icon">📦</div>
                    <p>هنوز محصولی نیست</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "add" && (
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 18 }}>
                افزودن محصول ➕
              </h3>
              <div
                className="upload-area"
                onClick={() => fileRef.current?.click()}
              >
                {imgPreview ? (
                  <img src={imgPreview} className="preview-img" alt="preview" />
                ) : (
                  <div>
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📷</div>
                    <p style={{ fontSize: ".85rem", color: "#7A5C4F" }}>
                      برای آپلود عکس کلیک کن
                    </p>
                  </div>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={handleImg}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                {[
                  { l: "نام محصول *", k: "name", ph: "مثلاً: غذای خشک" },
                  {
                    l: "قیمت (تومان) *",
                    k: "price",
                    ph: "285000",
                    t: "number",
                  },
                  { l: "دسته‌بندی", k: "category", ph: "غذا" },
                  { l: "نوع حیوان", k: "pet", ph: "سگ" },
                  { l: "موجودی", k: "stock", ph: "10", t: "number" },
                  { l: "ایموجی", k: "emoji", ph: "🐾" },
                  { l: "برچسب (اختیاری)", k: "badge", ph: "پرفروش" },
                ].map((f) => (
                  <div className="fg" key={f.k}>
                    <label className="fl">{f.l}</label>
                    <input
                      className="fi"
                      type={f.t || "text"}
                      placeholder={f.ph}
                      value={form[f.k]}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, [f.k]: e.target.value }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="fg">
                <label className="fl">توضیحات</label>
                <textarea
                  className="fi"
                  rows={3}
                  placeholder="توضیح مختصر..."
                  value={form.desc}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, desc: e.target.value }))
                  }
                  style={{ resize: "vertical" }}
                />
              </div>
              <button
                className="btn btn-p"
                onClick={addProduct}
                disabled={uploading}
                style={{ marginTop: 6 }}
              >
                {uploading ? "در حال آپلود..." : "افزودن محصول ✅"}
              </button>
            </div>
          )}

          {tab === "orders" && (
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 18 }}>
                سفارشات ({orders.length})
              </h3>
              {orders.length === 0 ? (
                <div className="empty">
                  <div className="empty-icon">📭</div>
                  <p>هنوز سفارشی نیست</p>
                </div>
              ) : (
                orders.map((o) => (
                  <div key={o.id} className="ocard">
                    <div className="oh">
                      <div>
                        <div style={{ fontWeight: 800, fontSize: ".88rem" }}>
                          #{o.id.slice(-6)}
                        </div>
                        <div style={{ fontSize: ".75rem", color: "#7A5C4F" }}>
                          {o.userEmail} •{" "}
                          {o.createdAt?.toDate?.()?.toLocaleDateString("fa-IR")}
                        </div>
                      </div>
                      <span className="ostatus">{o.status}</span>
                    </div>
                    <div
                      style={{
                        fontSize: ".82rem",
                        color: "#7A5C4F",
                        marginBottom: 8,
                      }}
                    >
                      {o.items?.map((i) => `${i.name} (×${i.qty})`).join(" — ")}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: 8,
                      }}
                    >
                      <div style={{ fontWeight: 800, color: S.primaryColor }}>
                        {fmt(o.total)}
                      </div>
                      <select
                        style={{
                          padding: "5px 10px",
                          borderRadius: 8,
                          border: `2px solid ${S.primaryColor}`,
                          fontFamily: "inherit",
                          fontSize: ".82rem",
                          cursor: "pointer",
                        }}
                        value={o.status}
                        onChange={(e) =>
                          updateOrderStatus(o.id, e.target.value)
                        }
                      >
                        {[
                          "در انتظار پرداخت",
                          "پرداخت شده",
                          "در حال پردازش",
                          "ارسال شده",
                          "تحویل داده شد",
                          "لغو شده",
                        ].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "settings" && (
            <div>
              <h3 style={{ fontWeight: 800, marginBottom: 18 }}>
                ⚙️ تنظیمات سایت
              </h3>
              <p
                style={{
                  fontSize: ".85rem",
                  color: "#7A5C4F",
                  marginBottom: 20,
                }}
              >
                هر چیزی که اینجا تغییر بدی، فوری روی سایت اعمال میشه!
              </p>

              <div className="settings-section">
                <h4>🏪 اطلاعات اصلی</h4>
                <SettingField
                  label="نام سایت"
                  field="siteName"
                  placeholder="گوگوجی پت شاپ"
                />
                <SettingField label="شعار سایت" field="siteSlogan" />
              </div>

              <div className="settings-section">
                <h4>🎯 صفحه اصلی (Hero)</h4>
                <SettingField label="تیتر اصلی" field="heroTitle" />
                <SettingField label="متن زیر تیتر" field="heroSubtitle" />
                <SettingField label="متن دکمه اول" field="heroBtn1" />
                <SettingField label="متن دکمه دوم" field="heroBtn2" />
              </div>

              <div className="settings-section">
                <h4>✨ ویژگی‌ها (۴ کارت)</h4>
                {[1, 2, 3, 4].map((n) => (
                  <div
                    key={n}
                    style={{
                      borderBottom: "1px solid #0001",
                      paddingBottom: 12,
                      marginBottom: 12,
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: ".85rem",
                        marginBottom: 8,
                        color: "#7A5C4F",
                      }}
                    >
                      کارت {n}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "60px 1fr 2fr",
                        gap: 8,
                      }}
                    >
                      <div className="fg">
                        <label className="fl">آیکن</label>
                        <input
                          className="fi"
                          value={siteSettings[`feat${n}Icon`] || ""}
                          onChange={(e) =>
                            setSiteSettings((p) => ({
                              ...p,
                              [`feat${n}Icon`]: e.target.value,
                            }))
                          }
                          style={{ fontSize: "1.2rem", textAlign: "center" }}
                        />
                      </div>
                      <div className="fg">
                        <label className="fl">عنوان</label>
                        <input
                          className="fi"
                          value={siteSettings[`feat${n}Title`] || ""}
                          onChange={(e) =>
                            setSiteSettings((p) => ({
                              ...p,
                              [`feat${n}Title`]: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="fg">
                        <label className="fl">توضیح</label>
                        <input
                          className="fi"
                          value={siteSettings[`feat${n}Desc`] || ""}
                          onChange={(e) =>
                            setSiteSettings((p) => ({
                              ...p,
                              [`feat${n}Desc`]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="settings-section">
                <h4>📞 اطلاعات تماس</h4>
                <SettingField
                  label="شماره تلفن"
                  field="phone"
                  placeholder="021-12345678"
                />
                <SettingField
                  label="ایمیل"
                  field="email"
                  placeholder="info@googoji.ir"
                />
                <SettingField
                  label="آدرس"
                  field="address"
                  placeholder="تهران"
                />
                <SettingField label="متن فوتر" field="footerDesc" />
              </div>

              <div className="settings-section">
                <h4>🚚 تنظیمات ارسال</h4>
                <SettingField
                  label="حداقل خرید برای ارسال رایگان (تومان)"
                  field="freeShippingMin"
                  type="number"
                  placeholder="500000"
                />
                <SettingField
                  label="هزینه ارسال (تومان)"
                  field="shippingCost"
                  type="number"
                  placeholder="30000"
                />
              </div>

              <div className="settings-section">
                <h4>🎨 رنگ‌بندی سایت</h4>
                {[
                  { l: "رنگ اصلی", f: "primaryColor" },
                  { l: "رنگ تیره", f: "darkColor" },
                  { l: "رنگ تأکیدی", f: "accentColor" },
                  { l: "رنگ پس‌زمینه", f: "bgColor" },
                ].map((c) => (
                  <div className="color-row" key={c.f}>
                    <input
                      type="color"
                      className="color-input"
                      value={siteSettings[c.f] || "#000"}
                      onChange={(e) =>
                        setSiteSettings((p) => ({
                          ...p,
                          [c.f]: e.target.value,
                        }))
                      }
                    />
                    <div className="fl" style={{ margin: 0 }}>
                      {c.l}
                    </div>
                    <input
                      className="fi"
                      value={siteSettings[c.f] || ""}
                      onChange={(e) =>
                        setSiteSettings((p) => ({
                          ...p,
                          [c.f]: e.target.value,
                        }))
                      }
                      style={{ maxWidth: 120, fontSize: ".85rem" }}
                    />
                  </div>
                ))}
              </div>

              <button
                className="btn btn-p"
                style={{ width: "100%", fontSize: "1rem", padding: "14px" }}
                onClick={saveSettings}
                disabled={savingSettings}
              >
                {savingSettings ? "در حال ذخیره..." : "💾 ذخیره همه تنظیمات"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  const { settings: S } = useApp();
  return (
    <footer
      style={{
        background: S.darkColor,
        color: "rgba(255,255,255,0.85)",
        padding: "36px 20px 18px",
        marginTop: 60,
        direction: "rtl",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
          gap: 28,
        }}
      >
        <div>
          <div
            style={{ fontSize: "1.3rem", fontWeight: 900, marginBottom: 10 }}
          >
            🐾 {S.siteName}
          </div>
          <p style={{ fontSize: ".82rem", opacity: 0.7, lineHeight: 1.8 }}>
            {S.footerDesc}
          </p>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 10 }}>تماس با ما</div>
          <div style={{ fontSize: ".82rem", opacity: 0.7, lineHeight: 2 }}>
            📞 {S.phone}
            <br />
            📧 {S.email}
            <br />
            📍 {S.address}
          </div>
        </div>
      </div>
      <div
        style={{
          textAlign: "center",
          marginTop: 28,
          paddingTop: 18,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          fontSize: ".75rem",
          opacity: 0.45,
        }}
      >
        © ۱۴۰۳ {S.siteName} — تمام حقوق محفوظ
      </div>
    </footer>
  );
}
