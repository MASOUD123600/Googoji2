import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import { SITE_URL } from "../config";

// تگ‌های سئو — React 19 این‌ها را خودکار به <head> منتقل می‌کند
export function Seo({ title, description, path = "", image, noindex, jsonLd }) {
  const full = title ? `${title} | پت شاپ گوگوجی` : "پت شاپ گوگوجی | خرید غذا، تشویقی و لوازم سگ و گربه در تهران";
  const url = SITE_URL + path;
  return (
    <>
      <title>{full}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={full} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image.startsWith("http") ? image : SITE_URL + image} />}
      {noindex && <meta name="robots" content="noindex" />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </>
  );
}

// عکس‌های آپلودی پنل در کالکشن media ذخیره می‌شوند (media:<id>)
const mediaCache = new Map();
export function useImageSrc(src) {
  const isMedia = typeof src === "string" && src.startsWith("media:");
  const [url, setUrl] = useState(isMedia ? mediaCache.get(src) || "" : src);
  useEffect(() => {
    if (!isMedia) return setUrl(src);
    if (mediaCache.has(src)) return setUrl(mediaCache.get(src));
    let alive = true;
    getDoc(doc(db, "media", src.slice(6)))
      .then((s) => {
        const data = s.data()?.data || "";
        mediaCache.set(src, data);
        if (alive) setUrl(data);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [src, isMedia]);
  return url;
}

export function Img({ src, small, alt = "", className, ...rest }) {
  const resolved = useImageSrc(src);
  const [loaded, setLoaded] = useState(false);
  const finalSrc = small && resolved?.startsWith("/products/") ? resolved.replace(/\.webp$/, "-sm.webp") : resolved;
  if (!finalSrc) return <div className={`img-ph ${className || ""}`}>🐾</div>;
  return (
    <img
      src={finalSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={`${className || ""} ${loaded ? "is-loaded" : "is-loading"}`}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
      ref={(el) => el?.complete && el.naturalWidth > 0 && !loaded && setLoaded(true)}
      {...rest}
    />
  );
}

export const Reveal = ({ children, delay = 0, y = 26, className, as = "div" }) => {
  const M = motion[as];
  return (
    <M
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </M>
  );
};

export const Logo = ({ name = "گوگوجی", light }) => (
  <span className={`logo ${light ? "logo-light" : ""}`}>
    <svg viewBox="0 0 64 64" width="36" height="36" aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="var(--primary)" />
      <g fill="var(--accent)">
        <ellipse cx="32" cy="41" rx="12" ry="10" />
        <ellipse cx="17" cy="28" rx="5" ry="6.5" />
        <ellipse cx="47" cy="28" rx="5" ry="6.5" />
        <ellipse cx="25" cy="18" rx="4.6" ry="6" />
        <ellipse cx="39" cy="18" rx="4.6" ry="6" />
      </g>
    </svg>
    <span className="logo-text">
      <b>{name}</b>
      <small>Googoji Pet</small>
    </span>
  </span>
);

export const Spinner = () => <span className="spinner" />;

export function Empty({ icon = "🐾", title, children }) {
  return (
    <div className="empty">
      <motion.div className="empty-icon" animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 2.4 }}>
        {icon}
      </motion.div>
      {title && <h3>{title}</h3>}
      {children}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <motion.div
        className={`modal ${wide ? "modal-wide" : ""}`}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="بستن">✕</button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}
