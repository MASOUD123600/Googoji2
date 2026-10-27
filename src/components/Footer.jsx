import { Link } from "react-router-dom";
import { Instagram, MapPin, Phone, Send } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Logo } from "./ui";
import { CATEGORIES } from "../config";
import { telLink, toFa } from "../lib/utils";

export default function Footer() {
  const { settings: S } = useApp();
  return (
    <footer className="footer">
      <div className="footer-wave" aria-hidden="true">
        <svg viewBox="0 0 1440 80" preserveAspectRatio="none"><path d="M0,40 C240,90 480,0 720,30 C960,60 1200,10 1440,40 L1440,80 L0,80 Z" /></svg>
      </div>
      <div className="container footer-grid">
        <div>
          <Logo light name={S.siteName?.replace("پت شاپ ", "")} />
          <p className="footer-desc">{S.footerDesc}</p>
          <div className="socials">
            {S.instagram && <a href={`https://instagram.com/${S.instagram}`} target="_blank" rel="noopener noreferrer" aria-label="اینستاگرام"><Instagram size={19} /></a>}
            {S.telegram && <a href={`https://t.me/${S.telegram}`} target="_blank" rel="noopener noreferrer" aria-label="تلگرام"><Send size={19} /></a>}
            {S.bale && <a href={`https://ble.ir/${S.bale}`} target="_blank" rel="noopener noreferrer" aria-label="بله">ب</a>}
          </div>
        </div>
        <div>
          <h4>دسته‌بندی‌ها</h4>
          <ul>
            {CATEGORIES.slice(0, 6).map((c) => (
              <li key={c.name}><Link to={`/shop?cat=${encodeURIComponent(c.name)}`}>{c.name}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h4>راهنما</h4>
          <ul>
            <li><Link to="/about">درباره گوگوجی</Link></li>
            <li><Link to="/faq">سؤالات متداول</Link></li>
            <li><Link to="/terms">قوانین و شرایط</Link></li>
            <li><Link to="/privacy">حریم خصوصی</Link></li>
            <li><Link to="/account/orders">پیگیری سفارش</Link></li>
          </ul>
        </div>
        <div>
          <h4>تماس با ما</h4>
          <ul className="contact-list">
            <li><Phone size={15} /> <a href={telLink(S.phone)}>{toFa(S.phone)}</a></li>
            {S.phone2 && <li><Phone size={15} /> <a href={telLink(S.phone2)}>{toFa(S.phone2)}</a></li>}
            <li><MapPin size={15} /> <span>{S.address}</span></li>
            {S.instagram && <li><Instagram size={15} /> <span dir="ltr">@{S.instagram}</span></li>}
          </ul>
        </div>
      </div>
      <div className="footer-bottom">© {toFa(1405)} {S.siteName} — تمام حقوق محفوظ است • ساخته شده با 💜 برای دوستای پشمالو</div>
    </footer>
  );
}
