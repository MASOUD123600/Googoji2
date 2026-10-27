import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import Toasts from "./components/Toasts";
import MobileNav from "./components/MobileNav";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Order from "./pages/Order";
import { Login, Register, ResetPassword } from "./pages/Auth";
import Account from "./pages/Account";
import { About, Contact, Faq, Terms, Privacy, NotFound } from "./pages/Static";
import { storage } from "./lib/utils";

const Admin = lazy(() => import("./admin/Admin"));

function ScrollTop() {
  const { pathname, search } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [pathname]);
  // ذخیره کد معرف از لینک دعوت (?ref=CODE) برای ثبت‌نام بعدی
  useEffect(() => {
    const ref = new URLSearchParams(search).get("ref");
    if (ref) storage.set("ggj-ref", ref);
  }, [search]);
  return null;
}

const Page = ({ children }) => (
  <motion.main
    className="page"
    initial={{ opacity: 0, y: 14 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.28, ease: "easeOut" }}
  >
    {children}
  </motion.main>
);

export default function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");
  const p = (el) => <Page>{el}</Page>;
  return (
    <>
      <ScrollTop />
      <Toasts />
      {!isAdminRoute && <Header />}
      <CartDrawer />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={p(<Home />)} />
          <Route path="/shop" element={p(<Shop />)} />
          <Route path="/p/:slug" element={p(<Product />)} />
          <Route path="/cart" element={p(<Cart />)} />
          <Route path="/checkout" element={p(<Checkout />)} />
          <Route path="/order/:id" element={p(<Order />)} />
          <Route path="/login" element={p(<Login />)} />
          <Route path="/register" element={p(<Register />)} />
          <Route path="/reset-password" element={p(<ResetPassword />)} />
          <Route path="/account/*" element={p(<Account />)} />
          <Route path="/about" element={p(<About />)} />
          <Route path="/contact" element={p(<Contact />)} />
          <Route path="/faq" element={p(<Faq />)} />
          <Route path="/terms" element={p(<Terms />)} />
          <Route path="/privacy" element={p(<Privacy />)} />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={<div className="center-load"><span className="spinner" /></div>}>
                <Admin />
              </Suspense>
            }
          />
          <Route path="*" element={p(<NotFound />)} />
        </Routes>
      </AnimatePresence>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <MobileNav />}
    </>
  );
}
