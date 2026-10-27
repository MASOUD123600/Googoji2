import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowLeft, Instagram, MapPin, Phone, Sparkles } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Img, Reveal, Seo } from "../components/ui";
import { ProductGrid, SkeletonGrid } from "../components/ProductCard";
import { CATEGORIES } from "../config";
import { telLink, toFa } from "../lib/utils";

const PAWS = Array.from({ length: 9 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  size: 14 + ((i * 7) % 22),
  delay: i * 1.3,
  dur: 11 + (i % 4) * 3,
}));

function Hero() {
  const { settings: S, visibleProducts } = useApp();
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y1 = useTransform(scrollYProgress, [0, 1], [0, 90]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const pick = visibleProducts.find((p) => p.slug === "zarix-transparent-backpack") || visibleProducts[0];
  const words = S.heroTitle.split(" ");

  return (
    <section className="hero" ref={ref}>
      <div className="hero-blob b1" />
      <div className="hero-blob b2" />
      <div className="paws" aria-hidden="true">
        {PAWS.map((p, i) => (
          <span key={i} style={{ left: p.left, fontSize: p.size, animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s` }}>🐾</span>
        ))}
      </div>
      <div className="container hero-in">
        <div className="hero-text">
          <motion.span className="pill" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Sparkles size={15} /> {S.tagline}
          </motion.span>
          <h1>
            {words.map((w, i) => (
              <motion.span key={i} className="word" initial={{ opacity: 0, y: 30, rotate: -4 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: 0.1 + i * 0.07, type: "spring", damping: 14 }}>
                {w}&nbsp;
              </motion.span>
            ))}
            <motion.em initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + words.length * 0.07, type: "spring" }}>
              {S.heroHighlight}
              <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true"><motion.path d="M4 14 C80 4 200 4 296 12" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.9, duration: 0.8 }} /></svg>
            </motion.em>
          </h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>{S.heroSubtitle}</motion.p>
          <motion.div className="hero-btns" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.75 }}>
            <Link to="/shop" className="btn btn-p btn-lg">{S.heroBtn1} <ArrowLeft size={18} /></Link>
            <a href={telLink(S.phone)} className="btn btn-ghost btn-lg"><Phone size={17} /> {S.heroBtn2}</a>
          </motion.div>
          <motion.div className="hero-stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>
            <div><b>{toFa(visibleProducts.length)}+</b><span>محصول اصل</span></div>
            <div><b>۱۰۰٪</b><span>ضمانت اصالت</span></div>
            <div><b>رایگان</b><span>ارسال در تهران</span></div>
          </motion.div>
        </div>
        <div className="hero-visual">
          <motion.div className="hero-card main" style={{ y: y1 }} initial={{ opacity: 0, scale: 0.85, rotate: 4 }} animate={{ opacity: 1, scale: 1, rotate: -3 }} transition={{ type: "spring", damping: 16, delay: 0.2 }}>
            <img src="/brand/europet-banner.webp" alt="محصولات یوروپت در پت شاپ گوگوجی" />
          </motion.div>
          {pick && (
            <motion.div className="hero-card side" style={{ y: y2 }} initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5, type: "spring" }}>
              <Link to={`/p/${pick.slug || pick.id}`}><Img src={pick.images?.[0]} small alt={pick.name} /></Link>
            </motion.div>
          )}
          <motion.div className="float-badge fb1" animate={{ y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 3.2 }}>🚚 ارسال رایگان تهران</motion.div>
          <motion.div className="float-badge fb2" animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 3.8, delay: 0.6 }}>✅ ۱۰۰٪ اصل</motion.div>
          <motion.div className="float-badge fb3" animate={{ rotate: [0, 8, -8, 0] }} transition={{ repeat: Infinity, duration: 4 }}>😻</motion.div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { settings: S } = useApp();
  const items = [1, 2, 3, 4].map((n) => ({ i: S[`feat${n}Icon`], t: S[`feat${n}Title`], d: S[`feat${n}Desc`] }));
  return (
    <section className="container feats">
      {items.map((f, i) => (
        <Reveal key={i} delay={i * 0.08} className="feat">
          <motion.div className="feat-icon" whileHover={{ rotate: [0, -12, 12, 0], scale: 1.15 }}>{f.i}</motion.div>
          <div><b>{f.t}</b><span>{f.d}</span></div>
        </Reveal>
      ))}
    </section>
  );
}

function Categories() {
  const { visibleProducts } = useApp();
  const counts = useMemo(() => visibleProducts.reduce((m, p) => ({ ...m, [p.category]: (m[p.category] || 0) + 1 }), {}), [visibleProducts]);
  return (
    <section className="container section">
      <Reveal className="sec-head">
        <h2>دسته‌بندی <span>محصولات</span></h2>
        <Link to="/shop" className="link-more">همه <ArrowLeft size={16} /></Link>
      </Reveal>
      <div className="cats">
        {CATEGORIES.map((c, i) => (
          <motion.div key={c.name} initial={{ opacity: 0, scale: 0.8 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.05, type: "spring", damping: 15 }}>
            <Link to={`/shop?cat=${encodeURIComponent(c.name)}`} className="cat">
              <motion.span className="cat-icon" whileHover={{ scale: 1.15, rotate: 8 }}>{c.icon}</motion.span>
              <b>{c.name}</b>
              <small>{toFa(counts[c.name] || 0)} محصول</small>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function PetPicker() {
  return (
    <section className="container pets">
      {[
        { pet: "گربه", t: "دنیای گربه‌ها", d: "غذا، پوچ، شیرخشک، اسباب‌بازی و هرچی پیشی لازم داره", e: "🐈", cls: "pet-cat" },
        { pet: "سگ", t: "دنیای سگ‌ها", d: "تشویقی، غذای خشک، لباس، پوشک و لوازم پیاده‌روی", e: "🐕", cls: "pet-dog" },
      ].map((x, i) => (
        <Reveal key={x.pet} delay={i * 0.1}>
          <Link to={`/shop?pet=${encodeURIComponent(x.pet)}`} className={`pet-card ${x.cls}`}>
            <div>
              <h3>{x.t}</h3>
              <p>{x.d}</p>
              <span className="btn btn-white btn-sm">مشاهده <ArrowLeft size={15} /></span>
            </div>
            <motion.span className="pet-emoji" animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }} transition={{ repeat: Infinity, duration: 3 + i }}>{x.e}</motion.span>
          </Link>
        </Reveal>
      ))}
    </section>
  );
}

function TabbedProducts() {
  const { visibleProducts, productsLoading } = useApp();
  const tabs = ["ویژه", "غذای خشک", "غذای مرطوب", "تشویقی و اسنک", "مکمل و ویتامین"];
  const [tab, setTab] = useState(tabs[0]);
  const list = (tab === "ویژه" ? visibleProducts.filter((p) => p.featured || p.badge) : visibleProducts.filter((p) => p.category === tab)).slice(0, 8);
  return (
    <section className="container section">
      <Reveal className="sec-head">
        <h2>پیشنهادهای <span>گوگوجی</span></h2>
        <Link to="/shop" className="link-more">مشاهده همه <ArrowLeft size={16} /></Link>
      </Reveal>
      <div className="tabs" role="tablist">
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "on" : ""} onClick={() => setTab(t)}>
            {tab === t && <motion.span layoutId="tab-bg" className="tab-bg" transition={{ type: "spring", damping: 22, stiffness: 300 }} />}
            <span>{t}</span>
          </button>
        ))}
      </div>
      {productsLoading && visibleProducts.length === 0 ? <SkeletonGrid /> : <ProductGrid key={tab} products={list.length ? list : visibleProducts.slice(0, 8)} />}
    </section>
  );
}

function Brands() {
  const brands = ["Josera", "Europet", "Whiskas", "Felix", "Beaphar", "Shayer", "Dr.Clauder's", "Wanpy", "Nobby", "JosiCat", "Relax Plus", "Nerano", "Winston", "Zarix"];
  return (
    <section className="brands" aria-label="برندها">
      <div className="brands-track">
        {[...brands, ...brands].map((b, i) => <span key={i}>{b}</span>)}
      </div>
    </section>
  );
}

function ReferralBanner() {
  const { settings: S } = useApp();
  return (
    <section className="container section">
      <Reveal className="promo">
        <div className="promo-text">
          <span className="pill pill-light">🎁 برنامه معرفی دوستان</span>
          <h2>دوستتو معرفی کن، <em>{toFa(S.referralPercent || 10)}٪ تخفیف</em> بگیر!</h2>
          <p>کد معرف اختصاصی‌ات رو از پنل کاربری بردار و برای دوستات بفرست. اولین خرید دوستت با تخفیف، و یه کد تخفیف هم برای خودت!</p>
          <Link to="/account/referral" className="btn btn-accent">دریافت کد معرف</Link>
        </div>
        <motion.div className="promo-art" animate={{ rotate: [0, 6, -6, 0] }} transition={{ repeat: Infinity, duration: 5 }}>🎁</motion.div>
      </Reveal>
    </section>
  );
}

function StoreSection() {
  const { settings: S } = useApp();
  return (
    <section className="container section store">
      <Reveal className="store-img">
        <img src="/brand/storefront.webp" alt="نمای فروشگاه حضوری پت شاپ گوگوجی در تهرانپارس" loading="lazy" />
      </Reveal>
      <Reveal className="store-info" delay={0.1}>
        <span className="pill">📍 فروشگاه حضوری</span>
        <h2>به <span>گوگوجی</span> سر بزن!</h2>
        <p>دوست داری محصولات رو از نزدیک ببینی یا مشاوره بگیری؟ در فروشگاه حضوری منتظرت هستیم.</p>
        <ul className="contact-list">
          <li><MapPin size={17} /> {S.address}</li>
          <li><Phone size={17} /> <a href={telLink(S.phone)}>{toFa(S.phone)}</a>{S.phone2 && <> — <a href={telLink(S.phone2)}>{toFa(S.phone2)}</a></>}</li>
          {S.instagram && <li><Instagram size={17} /> <a href={`https://instagram.com/${S.instagram}`} target="_blank" rel="noopener noreferrer" dir="ltr">@{S.instagram}</a></li>}
        </ul>
        <div className="hero-btns">
          {S.mapUrl && <a className="btn btn-p" href={S.mapUrl} target="_blank" rel="noopener noreferrer">مسیریابی</a>}
          <Link className="btn btn-ghost" to="/contact">اطلاعات تماس</Link>
        </div>
      </Reveal>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <Seo path="/" description="پت شاپ گوگوجی؛ خرید آنلاین غذای خشک و مرطوب، تشویقی، مکمل، شیرخشک، اسباب‌بازی و لوازم سگ و گربه از برندهای اصل با ارسال رایگان به سراسر تهران." image="/brand/store-poster.webp" />
      <Hero />
      <Features />
      <Categories />
      <PetPicker />
      <TabbedProducts />
      <Brands />
      <ReferralBanner />
      <StoreSection />
    </>
  );
}
