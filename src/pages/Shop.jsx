import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Empty, Seo } from "../components/ui";
import { ProductGrid, SkeletonGrid } from "../components/ProductCard";
import { CATEGORIES } from "../config";
import { toFa } from "../lib/utils";

const norm = (s) => String(s || "").replace(/ي/g, "ی").replace(/ك/g, "ک").replace(/‌/g, " ").toLowerCase();

export default function Shop() {
  const { visibleProducts, productsLoading } = useApp();
  const [sp, setSp] = useSearchParams();
  const q = sp.get("q") || "";
  const cat = sp.get("cat") || "";
  const pet = sp.get("pet") || "";
  const brand = sp.get("brand") || "";
  const sort = sp.get("sort") || "default";
  const avail = sp.get("avail") === "1";

  const set = (k, v) => {
    const next = new URLSearchParams(sp);
    if (v) next.set(k, v);
    else next.delete(k);
    setSp(next, { replace: true });
  };

  const brands = useMemo(() => [...new Set(visibleProducts.map((p) => p.brand).filter(Boolean))].sort(), [visibleProducts]);

  const list = useMemo(() => {
    const nq = norm(q);
    let r = visibleProducts.filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!pet || p.pet === pet || (pet !== "سگ و گربه" && p.pet === "سگ و گربه")) &&
        (!brand || p.brand === brand) &&
        (!avail || (Number(p.price) > 0 && Number(p.stock) > 0)) &&
        (!nq || norm(`${p.name} ${p.brand} ${p.category} ${p.desc}`).includes(nq)),
    );
    if (sort === "cheap") r = [...r].sort((a, b) => (Number(a.price) || 9e12) - (Number(b.price) || 9e12));
    if (sort === "expensive") r = [...r].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === "new") r = [...r].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
    return r;
  }, [visibleProducts, q, cat, pet, brand, sort, avail]);

  const title = [cat, pet && `برای ${pet}`].filter(Boolean).join(" ") || "همه محصولات";
  const active = [q && ["q", `«${q}»`], cat && ["cat", cat], pet && ["pet", pet], brand && ["brand", brand], avail && ["avail", "فقط موجود"]].filter(Boolean);

  return (
    <div className="container section">
      <Seo
        title={title === "همه محصولات" ? "فروشگاه آنلاین لوازم و غذای سگ و گربه" : `خرید ${title}`}
        description={`خرید ${title} با بهترین قیمت از پت شاپ گوگوجی؛ محصولات اصل و ارسال رایگان در تهران.`}
        path={`/shop${cat ? `?cat=${encodeURIComponent(cat)}` : ""}`}
      />
      <nav className="crumbs"><Link to="/">خانه</Link> / <span>فروشگاه</span>{cat && <> / <span>{cat}</span></>}</nav>
      <div className="sec-head">
        <h1 className="h-title">{title} <small>({toFa(list.length)} محصول)</small></h1>
      </div>

      <div className="shop-bar">
        <label className="search grow">
          <Search size={18} />
          <input value={q} onChange={(e) => set("q", e.target.value)} placeholder="جستجو در محصولات..." />
        </label>
        <select value={sort} onChange={(e) => set("sort", e.target.value === "default" ? "" : e.target.value)} aria-label="مرتب‌سازی">
          <option value="default">پیشنهاد گوگوجی</option>
          <option value="new">جدیدترین</option>
          <option value="cheap">ارزان‌ترین</option>
          <option value="expensive">گران‌ترین</option>
        </select>
        <select value={brand} onChange={(e) => set("brand", e.target.value)} aria-label="برند">
          <option value="">همه برندها</option>
          {brands.map((b) => <option key={b}>{b}</option>)}
        </select>
        <label className="check"><input type="checkbox" checked={avail} onChange={(e) => set("avail", e.target.checked ? "1" : "")} /> فقط موجود</label>
      </div>

      <div className="chips">
        <SlidersHorizontal size={16} />
        {["", "گربه", "سگ"].map((x) => (
          <button key={x || "all"} className={`chip ${pet === x ? "on" : ""}`} onClick={() => set("pet", x)}>{x ? (x === "گربه" ? "🐈 گربه" : "🐕 سگ") : "همه حیوانات"}</button>
        ))}
      </div>
      <div className="chips scroll">
        <button className={`chip ${!cat ? "on" : ""}`} onClick={() => set("cat", "")}>همه دسته‌ها</button>
        {CATEGORIES.map((c) => (
          <button key={c.name} className={`chip ${cat === c.name ? "on" : ""}`} onClick={() => set("cat", c.name)}>{c.icon} {c.name}</button>
        ))}
      </div>

      {active.length > 0 && (
        <motion.div className="active-filters" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {active.map(([k, label]) => (
            <button key={k} onClick={() => set(k, "")}>{label} <X size={13} /></button>
          ))}
          <button className="clear" onClick={() => setSp({}, { replace: true })}>پاک کردن همه</button>
        </motion.div>
      )}

      {productsLoading && visibleProducts.length === 0 ? (
        <SkeletonGrid />
      ) : (
        <ProductGrid
          products={list}
          empty={
            <Empty icon="🔍" title="محصولی پیدا نشد">
              <p>فیلترها را تغییر بده یا با ما تماس بگیر تا برات پیدا کنیم.</p>
              <button className="btn btn-p" onClick={() => setSp({}, { replace: true })}>نمایش همه محصولات</button>
            </Empty>
          }
        />
      )}
    </div>
  );
}
