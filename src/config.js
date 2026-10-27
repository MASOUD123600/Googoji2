// ایمیل مدیر — باید با ایمیل داخل firestore.rules یکی باشد
export const ADMIN_EMAIL = "masood.malek225@gmail.com";
// نام کاربری کوتاه برای ورود ادمین (به ایمیل بالا ترجمه می‌شود)
export const ADMIN_ALIAS = "KENSHIN";

export const SITE_URL = "https://googoji.ir";

export const ORDER_STATUSES = [
  "در انتظار پرداخت",
  "در انتظار تأیید رسید",
  "پرداخت شده",
  "در حال آماده‌سازی",
  "ارسال شده",
  "تحویل داده شد",
  "لغو شده",
];
export const PAID_STATUSES = ["پرداخت شده", "در حال آماده‌سازی", "ارسال شده", "تحویل داده شد"];

export const CATEGORIES = [
  { name: "غذای خشک", icon: "🥣" },
  { name: "غذای مرطوب", icon: "🥫" },
  { name: "تشویقی و اسنک", icon: "🦴" },
  { name: "مکمل و ویتامین", icon: "💊" },
  { name: "شیرخشک", icon: "🍼" },
  { name: "اسباب‌بازی", icon: "🧶" },
  { name: "لباس و پوشاک", icon: "🧥" },
  { name: "بهداشت و نظافت", icon: "🧼" },
  { name: "لوازم و تجهیزات", icon: "🎒" },
];
export const PETS = ["گربه", "سگ", "سگ و گربه", "پرنده", "جوندگان"];

export const THEMES = {
  googoji: { label: "بنفش گوگوجی", primaryColor: "#5B2A86", darkColor: "#24103A", accentColor: "#FFC83D", hotColor: "#FF7A1A", bgColor: "#FAF7FE" },
  sunset: { label: "نارنجی گرم", primaryColor: "#E07B39", darkColor: "#2C1810", accentColor: "#F5C842", hotColor: "#D94F30", bgColor: "#FDF8F3" },
  nature: { label: "سبز طبیعت", primaryColor: "#2F7D5B", darkColor: "#11291E", accentColor: "#F2C14E", hotColor: "#E36A3A", bgColor: "#F5FAF6" },
  ocean: { label: "آبی آرام", primaryColor: "#2459A8", darkColor: "#0D1F3C", accentColor: "#FFC83D", hotColor: "#FF6B6B", bgColor: "#F5F8FD" },
};

export const DEFAULT_SETTINGS = {
  siteName: "پت شاپ گوگوجی",
  tagline: "با عشق، برای دوستای پشمالوت",
  announcement: "🚚 ارسال رایگان به سراسر تهران — سریع، مطمئن، با عشق",
  heroTitle: "هرچی پشمالوت لازم داره،",
  heroHighlight: "یه‌جا تو گوگوجی",
  heroSubtitle: "غذا، تشویقی، مکمل، اسباب‌بازی و لوازم اصل سگ و گربه از برندهای معتبر؛ با مشاوره رایگان و ارسال سریع.",
  heroBtn1: "مشاهده محصولات",
  heroBtn2: "مشاوره رایگان",
  feat1Icon: "🚚", feat1Title: "ارسال رایگان", feat1Desc: "به سراسر تهران",
  feat2Icon: "✅", feat2Title: "تضمین اصالت", feat2Desc: "فقط کالای اصل و تاریخ‌دار",
  feat3Icon: "💳", feat3Title: "پرداخت امن", feat3Desc: "بله‌پی یا کارت به کارت",
  feat4Icon: "🎁", feat4Title: "دوستتو معرفی کن", feat4Desc: "۱۰٪ تخفیف برای هر دوتون",
  phone: "09124890432",
  phone2: "09101962384",
  email: "info@googoji.ir",
  address: "تهران، تهرانپارس، قنات کوثر، بلوار مطهری، نبش کوچه دهم مرکزی، پلاک ۱۰۶ و ۴",
  instagram: "googojipet",
  telegram: "",
  bale: "",
  mapUrl: "",
  workHours: "همه روزه ۱۰ صبح تا ۱۰ شب",
  footerDesc: "پت شاپ گوگوجی؛ همه ملزومات حیوانات خانگی با کیفیت اصل، قیمت منصفانه و ارسال سریع در تهران.",
  freeShippingMin: "0",
  shippingCost: "0",
  referralPercent: "10",
  // پرداخت
  balePayEnabled: false,
  baleBotUsername: "",
  cardPayEnabled: true,
  cardNumber: "",
  cardHolder: "",
  cardBank: "",
  // رنگ‌ها
  ...(({ label, ...colors }) => colors)(THEMES.googoji), // eslint-disable-line no-unused-vars
};
