import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Heart, Phone, ShoppingBag } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Img } from "./ui";
import { fmt, telLink } from "../lib/utils";

export default function ProductCard({ product: p, index = 0 }) {
  const { addToCart, wishlist, toggleWish, settings } = useApp();
  const [added, setAdded] = useState(false);
  const priced = Number(p.price) > 0;
  const out = priced && Number(p.stock) < 1;
  const off = priced && Number(p.comparePrice) > Number(p.price) ? Math.round((1 - p.price / p.comparePrice) * 100) : 0;
  const img = p.images?.[0] || p.imageUrl;
  const wished = wishlist.includes(p.id);
  const url = `/p/${p.slug || p.id}`;

  const add = () => {
    addToCart(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <motion.article
      className="pcard"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
    >
      <Link to={url} className="pcard-img" aria-label={p.name}>
        <Img src={img} small alt={p.name} />
        {img && p.images?.[1] && <Img src={p.images[1]} small alt="" className="pcard-img-2" />}
      </Link>
      <div className="pcard-tags">
        {off > 0 && <span className="tag tag-hot">٪{off.toLocaleString("fa-IR")} تخفیف</span>}
        {p.badge && <span className="tag">{p.badge}</span>}
      </div>
      <motion.button
        className={`wish ${wished ? "on" : ""}`}
        onClick={() => toggleWish(p.id)}
        whileTap={{ scale: 1.4 }}
        aria-label={wished ? "حذف از علاقه‌مندی" : "افزودن به علاقه‌مندی"}
      >
        <Heart size={18} fill={wished ? "currentColor" : "none"} />
      </motion.button>
      <div className="pcard-body">
        <div className="pcard-meta">{[p.brand, p.pet].filter(Boolean).join(" • ")}</div>
        <Link to={url} className="pcard-name">{p.name}</Link>
        <div className="pcard-foot">
          <div>
            {priced ? (
              <>
                {off > 0 && <del>{fmt(p.comparePrice)}</del>}
                <div className="price">{fmt(p.price)}</div>
              </>
            ) : (
              <div className="price-soon">استعلام قیمت</div>
            )}
          </div>
          {priced ? (
            <motion.button className={`add-btn ${added ? "is-added" : ""}`} onClick={add} disabled={out} whileTap={{ scale: 0.9 }} aria-label="افزودن به سبد">
              {out ? "ناموجود" : added ? <Check size={18} /> : <ShoppingBag size={18} />}
            </motion.button>
          ) : (
            <a className="add-btn add-call" href={telLink(settings.phone)} aria-label="تماس برای استعلام"><Phone size={17} /></a>
          )}
        </div>
      </div>
    </motion.article>
  );
}

export function ProductGrid({ products, empty }) {
  if (!products.length) return empty || null;
  return (
    <div className="grid">
      {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
    </div>
  );
}

export function SkeletonGrid({ n = 8 }) {
  return (
    <div className="grid">
      {Array.from({ length: n }, (_, i) => (
        <div key={i} className="pcard skeleton"><div className="pcard-img" /><div className="pcard-body"><i /><i /><i /></div></div>
      ))}
    </div>
  );
}
