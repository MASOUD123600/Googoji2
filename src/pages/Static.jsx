import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, Instagram, MapPin, Phone } from "lucide-react";
import { useApp } from "../store/AppContext";
import { Empty, Reveal, Seo } from "../components/ui";
import { telLink, toFa, waLink } from "../lib/utils";

const Doc = ({ title, children }) => (
  <div className="container section narrow">
    <Reveal><h1 className="h-title">{title}</h1></Reveal>
    <Reveal className="card prose" delay={0.05}>{children}</Reveal>
  </div>
);

export function About() {
  const { settings: S } = useApp();
  return (
    <div className="container section">
      <Seo title="درباره ما" description="داستان پت شاپ گوگوجی؛ فروشگاه حضوری و آنلاین لوازم و غذای سگ و گربه در تهرانپارس." path="/about" image="/brand/storefront.webp" />
      <div className="about">
        <Reveal className="about-img"><img src="/brand/storefront.webp" alt="فروشگاه پت شاپ گوگوجی" /></Reveal>
        <Reveal className="prose" delay={0.1}>
          <span className="pill">💜 {S.tagline}</span>
          <h1 className="h-title">درباره <span>گوگوجی</span></h1>
          <p>گوگوجی با یک هدف ساده شروع شد: اینکه صاحبان سگ و گربه بتوانند غذا و لوازم <b>اصل، تازه و باکیفیت</b> را با قیمت منصفانه و بدون دردسر تهیه کنند.</p>
          <p>در فروشگاه حضوری ما در تهرانپارس و همین‌طور فروشگاه آنلاین، برندهای معتبری مثل جوسرا، یوروپت، ویسکاس، فلیکس، بیفار، شایر و دکتر کلادرز را عرضه می‌کنیم و قبل از هر خرید، با کمال میل مشاوره رایگان می‌دهیم.</p>
          <ul className="features">
            <li>✅ تضمین اصالت و تاریخ مصرف همه کالاها</li>
            <li>🚚 ارسال سریع و رایگان به سراسر تهران</li>
            <li>💬 مشاوره رایگان انتخاب غذا و مکمل</li>
            <li>🎁 تخفیف معرفی دوستان و پیشنهادهای ویژه</li>
          </ul>
          <Link to="/shop" className="btn btn-p">مشاهده محصولات</Link>
        </Reveal>
      </div>
    </div>
  );
}

export function Contact() {
  const { settings: S } = useApp();
  return (
    <div className="container section">
      <Seo title="تماس با ما" description={`آدرس و تلفن پت شاپ گوگوجی: ${S.address} — تلفن ${S.phone}`} path="/contact" />
      <h1 className="h-title">تماس با <span>ما</span></h1>
      <div className="contact-grid">
        {[
          { i: <Phone />, t: "تلفن و واتساپ", c: <><a href={telLink(S.phone)}>{toFa(S.phone)}</a>{S.phone2 && <><br /><a href={telLink(S.phone2)}>{toFa(S.phone2)}</a></>}<br /><a href={waLink(S.phone)} target="_blank" rel="noopener noreferrer">گفتگو در واتساپ</a></> },
          { i: <MapPin />, t: "آدرس فروشگاه", c: <>{S.address}{S.mapUrl && <><br /><a href={S.mapUrl} target="_blank" rel="noopener noreferrer">مسیریابی روی نقشه</a></>}</> },
          { i: <Clock />, t: "ساعت کاری", c: S.workHours },
          { i: <Instagram />, t: "شبکه‌های اجتماعی", c: S.instagram && <a href={`https://instagram.com/${S.instagram}`} target="_blank" rel="noopener noreferrer" dir="ltr">@{S.instagram}</a> },
        ].map((x, k) => (
          <Reveal key={k} delay={k * 0.07} className="card contact-card">
            <div className="contact-icon">{x.i}</div>
            <h3>{x.t}</h3>
            <div>{x.c}</div>
          </Reveal>
        ))}
      </div>
      <Reveal className="poster"><img src="/brand/store-poster.webp" alt="پوستر اطلاعات تماس پت شاپ گوگوجی" loading="lazy" /></Reveal>
    </div>
  );
}

const FAQ = [
  ["ارسال سفارش چقدر طول می‌کشد؟", "سفارش‌های تهران معمولاً همان روز یا روز کاری بعد ارسال می‌شوند و ارسال در سراسر تهران رایگان است."],
  ["محصولات اصل هستند؟", "بله؛ همه محصولات از واردکنندگان و نمایندگی‌های معتبر تهیه می‌شوند و تاریخ مصرف آن‌ها قبل از ارسال بررسی می‌شود."],
  ["چطور پرداخت کنم؟", "بعد از ثبت سفارش، می‌توانید آنلاین با بله‌پی پرداخت کنید یا مبلغ را کارت به کارت کرده و عکس رسید را در صفحه سفارش بفرستید."],
  ["کد پیگیری را از کجا ببینم؟", "بلافاصله بعد از ثبت سفارش کد پیگیری نمایش داده می‌شود و همیشه در «حساب کاربری › سفارش‌ها» در دسترس است."],
  ["امکان مرجوعی هست؟", "کالای سالم و باز نشده تا ۷ روز قابل مرجوع است. در صورت ایراد یا اشتباه در ارسال، هزینه بازگشت با ماست."],
  ["تخفیف معرفی دوستان چطور کار می‌کند؟", "کد معرف اختصاصی خود را از پنل کاربری بردارید. دوستتان با این کد ثبت‌نام می‌کند و روی اولین خرید تخفیف می‌گیرد و پس از خرید او، یک کد تخفیف هم برای شما صادر می‌شود."],
];

export function Faq() {
  const [open, setOpen] = useState(0);
  const jsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) };
  return (
    <div className="container section narrow">
      <Seo title="سؤالات متداول" description="پاسخ سؤالات رایج درباره ارسال، پرداخت، اصالت کالا و مرجوعی در پت شاپ گوگوجی." path="/faq" jsonLd={jsonLd} />
      <h1 className="h-title">سؤالات <span>متداول</span></h1>
      <div className="faq">
        {FAQ.map(([q, a], k) => (
          <div key={k} className={`faq-item ${open === k ? "on" : ""}`}>
            <button onClick={() => setOpen(open === k ? -1 : k)} aria-expanded={open === k}>{q}<span>{open === k ? "−" : "+"}</span></button>
            <AnimatePresence initial={false}>
              {open === k && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <p>{a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Terms() {
  const { settings: S } = useApp();
  return (
    <Doc title="قوانین و شرایط خرید">
      <Seo title="قوانین و شرایط" path="/terms" description="قوانین خرید، ارسال، پرداخت و مرجوعی کالا در پت شاپ گوگوجی." />
      <h3>۱. ثبت سفارش</h3>
      <p>ثبت سفارش نیازمند ایجاد حساب کاربری و وارد کردن اطلاعات صحیح گیرنده است. مسئولیت صحت اطلاعات بر عهده خریدار است.</p>
      <h3>۲. قیمت و پرداخت</h3>
      <p>قیمت‌ها به تومان و شامل همه هزینه‌ها هستند. پرداخت از طریق بله‌پی یا کارت به کارت انجام می‌شود و سفارش پس از تأیید پرداخت پردازش خواهد شد.</p>
      <h3>۳. ارسال</h3>
      <p>ارسال در محدوده تهران رایگان است و معمولاً ظرف ۲۴ تا ۴۸ ساعت کاری انجام می‌شود.</p>
      <h3>۴. مرجوعی</h3>
      <p>کالای سالم و بازنشده تا ۷ روز پس از تحویل قابل مرجوع است. محصولات خوراکی بازشده به‌دلایل بهداشتی قابل مرجوع نیستند، مگر اینکه ایراد از سمت فروشگاه باشد.</p>
      <h3>۵. پشتیبانی</h3>
      <p>برای هرگونه سؤال یا مشکل با شماره {toFa(S.phone)} تماس بگیرید.</p>
    </Doc>
  );
}

export function Privacy() {
  return (
    <Doc title="حریم خصوصی">
      <Seo title="حریم خصوصی" path="/privacy" description="سیاست حفظ حریم خصوصی کاربران پت شاپ گوگوجی." />
      <p>اطلاعاتی که هنگام ثبت‌نام و خرید وارد می‌کنید (نام، موبایل، ایمیل و آدرس) فقط برای پردازش و ارسال سفارش و ارتباط با شما استفاده می‌شود و در اختیار هیچ شخص ثالثی قرار نمی‌گیرد.</p>
      <p>اطلاعات پرداخت مستقیماً در درگاه/کیف پول بله پردازش می‌شود و فروشگاه به اطلاعات کارت بانکی شما دسترسی ندارد.</p>
      <p>رمز عبور شما به‌صورت رمزنگاری‌شده توسط سرویس احراز هویت Google Firebase نگهداری می‌شود.</p>
    </Doc>
  );
}

export function NotFound() {
  return (
    <div className="container section">
      <Seo title="صفحه پیدا نشد" noindex />
      <Empty icon="🙀" title="این صفحه پیدا نشد!">
        <p>شاید آدرس اشتباه باشه یا صفحه جابه‌جا شده.</p>
        <Link className="btn btn-p" to="/">بازگشت به خانه</Link>
      </Empty>
    </div>
  );
}
