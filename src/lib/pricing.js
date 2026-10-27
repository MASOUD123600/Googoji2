// محاسبه مبلغ سفارش — هم در مرورگر و هم در سرور (Netlify Function) استفاده می‌شود تا قیمت قابل دستکاری نباشد
const n = (v) => Number(String(v ?? 0).replace(/[^\d.]/g, "")) || 0;

export function couponProblem(coupon, { subtotal, uid }) {
  if (!coupon) return "کد تخفیف معتبر نیست";
  if (coupon.active === false) return "این کد تخفیف غیرفعال است";
  if (coupon.uid && coupon.uid !== uid) return "این کد مخصوص حساب دیگری است";
  if (coupon.maxUses && n(coupon.used) >= n(coupon.maxUses)) return "ظرفیت این کد تمام شده";
  const exp = coupon.expiresAt?.toDate ? coupon.expiresAt.toDate() : coupon.expiresAt ? new Date(coupon.expiresAt) : null;
  if (exp && exp < new Date()) return "این کد منقضی شده";
  if (coupon.minTotal && subtotal < n(coupon.minTotal)) return `حداقل خرید برای این کد ${n(coupon.minTotal).toLocaleString("fa-IR")} تومان است`;
  return null;
}

/**
 * items: [{price, qty}] — قیمت‌ها باید از دیتابیس محصولات خوانده شوند
 * opts: { settings, coupon, uid, referralFirstOrder }
 */
export function computeTotals(items, { settings = {}, coupon = null, uid = null, referralFirstOrder = false } = {}) {
  const subtotal = items.reduce((s, i) => s + n(i.price) * n(i.qty), 0);
  let discount = 0;
  let discountLabel = "";
  if (coupon && !couponProblem(coupon, { subtotal, uid })) {
    discount = coupon.amount ? n(coupon.amount) : Math.round((subtotal * n(coupon.percent)) / 100);
    discountLabel = `کد ${coupon.code}`;
  }
  if (referralFirstOrder) {
    const ref = Math.round((subtotal * n(settings.referralPercent || 10)) / 100);
    if (ref > discount) {
      discount = ref;
      discountLabel = "تخفیف معرفی دوستان";
    }
  }
  discount = Math.min(discount, subtotal);
  const cost = n(settings.shippingCost);
  const freeMin = n(settings.freeShippingMin);
  const shipping = cost === 0 || (freeMin > 0 && subtotal - discount >= freeMin) ? 0 : cost;
  return { subtotal, discount, discountLabel, shipping, total: subtotal - discount + shipping };
}
