'use client';

import { useState, useEffect, useRef, useCallback, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingCart, Star, Smartphone, Landmark, Building2, Package } from 'lucide-react';
import { OrdersAPI, PaymentAPI } from '@/lib/api';
import { useCartStore } from '@/lib/cart';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import Toast, { useToast } from '@/components/shared/Toast';
import EsellerLogo from '@/components/shared/EsellerLogo';
import CouponInput from '@/components/checkout/CouponInput';
import SafeImage from '@/components/ui/SafeImage';

/* ═══════════ Constants ═══════════ */
const DISTRICTS = [
  'Баянгол',
  'Баянзүрх',
  'Сүхбаатар',
  'Хан-Уул',
  'Чингэлтэй',
  'Сонгинохайрхан',
  'Налайх',
  'Багануур',
  'Багахангай',
];

const FREE_DELIVERY_THRESHOLD = 50000;
const DELIVERY_FEE = 3000;

const BANK_LINKS = [
  { name: 'Хаан банк', color: '#00A551', icon: <Landmark size={16} color="#00A551" /> },
  { name: 'Голомт', color: '#0066B3', icon: <Building2 size={16} color="#0066B3" /> },
  { name: 'ХАС банк', color: '#E4002B', icon: <Landmark size={16} color="#E4002B" /> },
  { name: 'Төрийн банк', color: '#003DA5', icon: <Building2 size={16} color="#003DA5" /> },
];

const LOYALTY_POINTS_AVAILABLE = 1500;
const POINTS_TO_MNT = 5; // 1 point = 5₮
const MIN_REDEEM_POINTS = 200;
const MAX_REDEEM_PERCENT = 0.3; // 30% of order

/* ═══════════ Form State ═══════════ */
interface DeliveryForm {
  name: string;
  phone: string;
  district: string;
  khoroo: string;
  address: string;
  note: string;
}

const initialForm: DeliveryForm = {
  name: '',
  phone: '',
  district: '',
  khoroo: '',
  address: '',
  note: '',
};

/* ═══════════ Validation ═══════════ */
function validate(form: DeliveryForm): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.name.trim()) errors.name = 'Нэрээ оруулна уу';
  if (!form.phone.trim()) errors.phone = 'Утасны дугаараа оруулна уу';
  else if (!/^\d{8}$/.test(form.phone.trim()))
    errors.phone = 'Утасны дугаар 8 оронтой байх ёстой';
  if (!form.district) errors.district = 'Дүүргээ сонгоно уу';
  if (!form.khoroo.trim()) errors.khoroo = 'Хороогоо оруулна уу';
  if (!form.address.trim()) errors.address = 'Хаягаа оруулна уу';
  return errors;
}

/* ═══════════ Page Component ═══════════ */
export default function CheckoutPage() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const cart = useCartStore();
  const toast = useToast();

  const [form, setForm] = useState<DeliveryForm>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paymentMethod, setPaymentMethod] = useState<'qpay'>('qpay');
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // QPay state
  const [qpayStatus, setQpayStatus] = useState<'idle' | 'pending' | 'paid'>('idle');
  const [qpayChecking, setQpayChecking] = useState(false);
  const [qpayInvoiceId, setQpayInvoiceId] = useState<string | null>(null);
  const qpayPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Loyalty points state
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [pointsApplied, setPointsApplied] = useState(false);

  // eBarimit state
  const [wantEbarimт, setWantEbarimт] = useState(false);
  const [ebarimitType, setEbarimitType] = useState<'person' | 'org'>('person');
  const [tin, setTin] = useState('');

  // Load cart on mount
  useEffect(() => {
    cart.load();
    setMounted(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auth guard
  useEffect(() => {
    if (mounted && !isLoggedIn) {
      router.replace('/login?redirect=/checkout');
    }
  }, [mounted, isLoggedIn, router]);

  // Pre-fill name from user
  useEffect(() => {
    if (user?.name && !form.name) {
      setForm((prev) => ({ ...prev, name: user.name }));
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup QPay polling on unmount
  useEffect(() => {
    return () => {
      if (qpayPollRef.current) clearInterval(qpayPollRef.current);
    };
  }, []);

  /* ── Derived values ── */
  const items = cart.items;
  const subtotal = cart.total();
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const pointsDiscount = pointsApplied ? redeemPoints * POINTS_TO_MNT : 0;
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const total = Math.max(0, subtotal + deliveryFee - pointsDiscount - couponDiscount);

  // Max redeemable points (30% of order or available points, whichever is less)
  const maxRedeemPoints = Math.min(
    LOYALTY_POINTS_AVAILABLE,
    Math.floor((subtotal + deliveryFee) * MAX_REDEEM_PERCENT / POINTS_TO_MNT)
  );

  /* ── Field change helper ── */
  function updateField(field: keyof DeliveryForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  /* ── QPay check ── */
  const checkQpayPayment = useCallback(async () => {
    if (!qpayInvoiceId || qpayStatus === 'paid') return;
    setQpayChecking(true);
    try {
      const res = await fetch(`/api/payment/qpay/check/${encodeURIComponent(qpayInvoiceId)}`);
      const body = await res.json();
      // Envelope: { success: true, data: {paid, ...} } | { success: false, error }
      // Legacy:    {paid, ...}
      if (body?.success === false) return;
      const data = body?.success === true ? body.data : body;
      if (data?.paid) {
        setQpayStatus('paid');
        toast.show('Төлбөр амжилттай хийгдлээ!', 'ok');
        if (qpayPollRef.current) {
          clearInterval(qpayPollRef.current);
          qpayPollRef.current = null;
        }
      }
    } catch {
      // silent fail on poll
    } finally {
      setQpayChecking(false);
    }
  }, [qpayInvoiceId, qpayStatus, toast]);

  /* ── Apply loyalty points ── */
  function handleApplyPoints() {
    if (redeemPoints < MIN_REDEEM_POINTS) {
      toast.show(`Хамгийн багадаа ${MIN_REDEEM_POINTS} оноо хэрэглэнэ`, 'warn');
      return;
    }
    setPointsApplied(true);
    toast.show(`${redeemPoints} оноо амжилттай хэрэглэгдлээ`, 'ok');
  }

  function handleRemovePoints() {
    setPointsApplied(false);
    setRedeemPoints(0);
  }

  /* ── Submit ── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.show('Мэдээллээ бүрэн бөглөнө үү', 'warn');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        items: items.map((item) => ({
          product: item._id,
          name: item.name,
          price: item.salePrice || item.price,
          quantity: item.qty,
        })),
        total,
        delivery: {
          phone: form.phone.trim(),
          address: {
            district: form.district,
            street: form.khoroo.trim(),
            building: form.address.trim(),
          },
          note: form.note.trim() || undefined,
        },
        ...(pointsApplied && redeemPoints > 0
          ? { loyaltyPoints: redeemPoints, pointsDiscount }
          : {}),
        ...(wantEbarimт
          ? {
              ebarimт: {
                type: ebarimitType,
                ...(ebarimitType === 'org' ? { tin: tin.trim() } : {}),
              },
            }
          : {}),
      };

      const order = await OrdersAPI.create(orderData);

      // Create QPay invoice
      try {
        const qpayRes = await PaymentAPI.createQPay({
          orderId: order._id,
          amount: total,
          description: `eseller.mn захиалга #${order.orderNumber || order._id}`,
        });
        // Accept both envelope {success, data} and legacy bare-body shapes.
        const qpayData: Record<string, unknown> =
          qpayRes && typeof qpayRes === 'object' && (qpayRes as { success?: unknown }).success === true
            ? ((qpayRes as { data: Record<string, unknown> }).data ?? {})
            : (qpayRes as Record<string, unknown>) ?? {};
        const invId = (qpayData.invoiceId ?? qpayData.invoice_id) as string | undefined;
        if (invId) setQpayInvoiceId(invId);
      } catch {
        // QPay invoice creation failure is non-blocking
      }

      cart.clear();
      setOrderNumber(order.orderNumber || order._id);
      setOrderId(order._id);
      setQpayStatus('pending');

      // Start polling for QPay status
      qpayPollRef.current = setInterval(() => {
        checkQpayPayment();
      }, 5000);

      toast.show('Захиалга амжилттай үүслээ!', 'ok');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'message' in err
          ? (err as { message: string }).message
          : 'Захиалга үүсгэхэд алдаа гарлаа';
      toast.show(message, 'error');
    } finally {
      setSubmitting(false);
    }
  }

  /* ── Loading / Auth guard ── */
  if (!mounted || !isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--esl-bg-page)]">
        <div className="animate-spin h-8 w-8 border-4 rounded-full border-[var(--esl-brand)] border-t-transparent" />
      </div>
    );
  }

  /* ── Success State ── */
  if (orderNumber) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--esl-bg-page)]">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-8 md:p-12 text-center max-w-lg w-full shadow-sm space-y-6">
            {/* Success icon */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto bg-[var(--esl-success)]">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[var(--esl-text-primary)]">Захиалга амжилттай!</h2>
            <p className="text-[var(--esl-text-muted)]">Таны захиалгын дугаар:</p>
            <p className="text-lg font-mono font-bold text-[var(--esl-brand)]">
              #{orderNumber}
            </p>

            {/* QPay QR Section */}
            {paymentMethod === 'qpay' && qpayStatus !== 'paid' && (
              <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] p-6 space-y-4">
                <h3 className="font-semibold text-[var(--esl-text-primary)]">QPay-р төлбөр төлөх</h3>
                {/* QR Code Placeholder */}
                <div className="mx-auto w-[200px] h-[200px] rounded-xl bg-[var(--esl-bg-elevated)] border border-[var(--esl-border)] flex items-center justify-center">
                  <span className="text-[var(--esl-text-muted)] font-medium text-sm">QPay QR</span>
                </div>

                {/* Payment status */}
                <div className="flex items-center justify-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                  <span className="text-sm text-[var(--esl-text-secondary)]">
                    Төлбөр хүлээгдэж байна...
                  </span>
                </div>

                {/* Check payment button */}
                <button
                  type="button"
                  onClick={checkQpayPayment}
                  disabled={qpayChecking}
                  className="w-full py-2.5 rounded-xl font-semibold text-sm border border-[var(--esl-brand-border)] text-[var(--esl-brand)] bg-[var(--esl-brand-bg)] hover:opacity-80 transition-opacity disabled:opacity-50"
                >
                  {qpayChecking ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block w-3.5 h-3.5 border-2 border-[var(--esl-brand)] border-t-transparent rounded-full animate-spin" />
                      Шалгаж байна...
                    </span>
                  ) : (
                    'Төлбөр шалгах'
                  )}
                </button>

                {/* Bank deep links */}
                <div className="grid grid-cols-2 gap-2">
                  {BANK_LINKS.map((bank) => (
                    <button
                      key={bank.name}
                      type="button"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] text-sm font-medium text-[var(--esl-text-primary)] hover:border-[var(--esl-border-strong)] transition-colors"
                    >
                      <span>{bank.icon}</span>
                      <span className="truncate">{bank.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* QPay paid confirmation */}
            {qpayStatus === 'paid' && (
              <div className="bg-[var(--esl-success-bg)] rounded-xl border border-[var(--esl-success)] p-4 flex items-center gap-3">
                <svg className="w-5 h-5 text-[var(--esl-success)] shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm font-semibold text-[var(--esl-success)]">Төлбөр амжилттай хийгдлээ!</span>
              </div>
            )}

            {/* eBarimт section */}
            {wantEbarimт && orderId && (
              <div className="bg-[var(--esl-bg-section)] rounded-xl border border-[var(--esl-border)] p-4">
                <Link
                  href={`/receipt/${orderId}`}
                  className="flex items-center justify-center gap-2 text-sm font-semibold text-[var(--esl-brand)] hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  еБаримт харах
                </Link>
              </div>
            )}

            <p className="text-sm text-[var(--esl-text-muted)]">
              {qpayStatus === 'paid'
                ? 'Таны захиалга баталгаажлаа. Бид удахгүй хүргэлтэнд гаргана.'
                : 'Бид таны захиалгыг хүлээн авлаа. QPay-р төлбөрөө төлсний дараа захиалга баталгаажна.'}
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/store"
                className="inline-block w-full py-3 rounded-xl font-semibold text-white text-center transition-colors bg-[var(--esl-brand)] hover:bg-[var(--esl-brand-dark)]"
              >
                Дэлгүүр рүү буцах
              </Link>
              <Link
                href="/dashboard"
                className="inline-block w-full py-3 rounded-xl font-semibold border border-[var(--esl-border)] text-[var(--esl-text-primary)] text-center hover:bg-[var(--esl-bg-card-hover)] transition-colors"
              >
                Захиалгуудаа харах
              </Link>
            </div>
          </div>
        </div>
        <Toast />
      </div>
    );
  }

  /* ── Empty Cart ── */
  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--esl-bg-page)]">
        <Header />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-8 md:p-12 text-center max-w-md w-full shadow-sm">
            <div className="flex justify-center mb-4"><ShoppingCart size={48} className="text-[var(--esl-text-muted)]" strokeWidth={1.5} /></div>
            <h2 className="text-xl font-bold text-[var(--esl-text-primary)] mb-2">Сагс хоосон байна</h2>
            <p className="text-[var(--esl-text-muted)] mb-6">
              Захиалга хийхийн тулд эхлээд бараа сонгоно уу.
            </p>
            <Link
              href="/store"
              className="inline-block px-8 py-3 rounded-xl font-semibold text-white transition-colors bg-[var(--esl-brand)] hover:bg-[var(--esl-brand-dark)]"
            >
              Дэлгүүр рүү очих
            </Link>
          </div>
        </div>
        <Toast />
      </div>
    );
  }

  /* ── Main Checkout ── */
  return (
    <div className="min-h-screen flex flex-col bg-[var(--esl-bg-page)]">
      <Header />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 md:py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--esl-text-primary)] mb-6">Захиалга баталгаажуулах</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ═══ LEFT: Form ═══ */}
          <div className="lg:col-span-3 space-y-6">
            {/* Delivery Info */}
            <section className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 shadow-[var(--esl-shadow-card)]">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full text-white text-sm flex items-center justify-center font-bold bg-[var(--esl-brand)]">1</span>
                Хүргэлтийн мэдээлэл
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Нэр" error={errors.name}>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="Жишээ: Бат"
                    className={inputClass(errors.name)}
                  />
                </Field>

                <Field label="Утас" error={errors.phone}>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="8 оронтой дугаар"
                    className={inputClass(errors.phone)}
                  />
                </Field>

                <Field label="Дүүрэг" error={errors.district}>
                  <select
                    value={form.district}
                    onChange={(e) => updateField('district', e.target.value)}
                    className={inputClass(errors.district)}
                  >
                    <option value="">Сонгох...</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Хороо" error={errors.khoroo}>
                  <input
                    type="text"
                    value={form.khoroo}
                    onChange={(e) => updateField('khoroo', e.target.value)}
                    placeholder="Жишээ: 3-р хороо"
                    className={inputClass(errors.khoroo)}
                  />
                </Field>

                <div className="sm:col-span-2">
                  <Field label="Байр / Гудамж" error={errors.address}>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => updateField('address', e.target.value)}
                      placeholder="Байр, орц, тоот эсвэл гудамжны нэр"
                      className={inputClass(errors.address)}
                    />
                  </Field>
                </div>

                <div className="sm:col-span-2">
                  <Field label="Нэмэлт тайлбар">
                    <textarea
                      value={form.note}
                      onChange={(e) => updateField('note', e.target.value)}
                      placeholder="Жолоочид нэмэлт заавар (заавал биш)"
                      rows={2}
                      className={inputClass()}
                    />
                  </Field>
                </div>
              </div>
            </section>

            {/* Payment Method */}
            <section className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 shadow-[var(--esl-shadow-card)]">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full text-white text-sm flex items-center justify-center font-bold bg-[var(--esl-brand)]">2</span>
                Төлбөрийн арга
              </h2>

              <div className="space-y-3">
                <label
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                    paymentMethod === 'qpay'
                      ? 'border-[var(--esl-brand)] bg-[var(--esl-brand-bg)]'
                      : 'border-[var(--esl-border)] hover:border-[var(--esl-border-strong)]'
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === 'qpay'}
                    onChange={() => setPaymentMethod('qpay')}
                    className="accent-[var(--esl-brand)]"
                  />
                  <div className="flex-1">
                    <span className="font-semibold text-[var(--esl-text-primary)]">QPay</span>
                    <p className="text-sm text-[var(--esl-text-muted)]">Банкны аппликэйшнээр төлөх</p>
                  </div>
                  <Smartphone size={24} className="text-[var(--esl-text-primary)]" />
                </label>

              </div>

              {/* QPay QR Preview (shows bank links when QPay selected) */}
              {paymentMethod === 'qpay' && (
                <div className="mt-4 pt-4 border-t border-[var(--esl-border)] space-y-3">
                  <p className="text-sm text-[var(--esl-text-secondary)]">
                    Захиалга баталгаажуулсны дараа QR код болон банкны холбоос гарч ирнэ.
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {BANK_LINKS.map((bank) => (
                      <div
                        key={bank.name}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--esl-bg-section)] border border-[var(--esl-border)] text-xs text-[var(--esl-text-secondary)]"
                      >
                        <span>{bank.icon}</span>
                        <span>{bank.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* eBarimт Option */}
            <section className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 shadow-[var(--esl-shadow-card)]">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)] mb-4 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full text-white text-sm flex items-center justify-center font-bold bg-[var(--esl-brand)]">3</span>
                еБаримт
              </h2>

              {/* Checkbox */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wantEbarimт}
                  onChange={(e) => setWantEbarimт(e.target.checked)}
                  className="w-4.5 h-4.5 accent-[var(--esl-brand)] rounded"
                />
                <span className="text-sm font-medium text-[var(--esl-text-primary)]">еБаримт авах</span>
              </label>

              {wantEbarimт && (
                <div className="mt-4 space-y-4 pl-7">
                  {/* Radio: person / org */}
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="ebarimtType"
                        checked={ebarimitType === 'person'}
                        onChange={() => setEbarimitType('person')}
                        className="accent-[var(--esl-brand)]"
                      />
                      <span className="text-sm text-[var(--esl-text-primary)]">Хувь хүн</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="ebarimtType"
                        checked={ebarimitType === 'org'}
                        onChange={() => setEbarimitType('org')}
                        className="accent-[var(--esl-brand)]"
                      />
                      <span className="text-sm text-[var(--esl-text-primary)]">Байгууллага</span>
                    </label>
                  </div>

                  {/* TIN input for org */}
                  {ebarimitType === 'org' && (
                    <Field label="Байгууллагын регистрийн дугаар (TIN)">
                      <input
                        type="text"
                        value={tin}
                        onChange={(e) => setTin(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="7 оронтой дугаар"
                        className={inputClass()}
                      />
                    </Field>
                  )}
                </div>
              )}
            </section>
          </div>

          {/* ═══ RIGHT: Order Summary ═══ */}
          <div className="lg:col-span-2">
            <div className="bg-[var(--esl-bg-card)] rounded-2xl border border-[var(--esl-border)] p-6 shadow-[var(--esl-shadow-card)] lg:sticky lg:top-6 space-y-5">
              <h2 className="text-lg font-bold text-[var(--esl-text-primary)]">Захиалгын мэдээлэл</h2>

              {/* Items */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[var(--esl-bg-section)] flex items-center justify-center text-lg shrink-0 overflow-hidden">
                      {item.images && item.images.length > 0 ? (
                        <SafeImage src={item.images[0]} alt={item.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package size={20} className="text-[var(--esl-text-muted)]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--esl-text-primary)] truncate">{item.name}</p>
                      <p className="text-xs text-[var(--esl-text-muted)]">{item.qty} x {formatPrice(item.salePrice || item.price)}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--esl-text-primary)] shrink-0">
                      {formatPrice((item.salePrice || item.price) * item.qty)}
                    </span>
                  </div>
                ))}
              </div>

              {/* ── Loyalty Points Redeem ── */}
              <div
                className="rounded-xl p-4 space-y-3"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,215,0,0.08) 0%, rgba(255,215,0,0.03) 100%)',
                  border: '1px solid rgba(255,215,0,0.25)',
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold flex items-center" style={{ color: '#D4A017' }}>
                    <Star size={14} fill="#D4A017" stroke="#D4A017" style={{ marginRight: 4, flexShrink: 0 }} /> {LOYALTY_POINTS_AVAILABLE.toLocaleString()} оноо байна (≈ {formatPrice(LOYALTY_POINTS_AVAILABLE * POINTS_TO_MNT)})
                  </span>
                </div>

                {!pointsApplied ? (
                  <>
                    <div className="space-y-1.5">
                      <input
                        type="range"
                        min={0}
                        max={maxRedeemPoints}
                        step={50}
                        value={redeemPoints}
                        onChange={(e) => setRedeemPoints(Number(e.target.value))}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #D4A017 0%, #D4A017 ${maxRedeemPoints > 0 ? (redeemPoints / maxRedeemPoints) * 100 : 0}%, var(--esl-bg-section) ${maxRedeemPoints > 0 ? (redeemPoints / maxRedeemPoints) * 100 : 0}%, var(--esl-bg-section) 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-[var(--esl-text-muted)]">
                        <span>0</span>
                        <span>{maxRedeemPoints.toLocaleString()} оноо</span>
                      </div>
                    </div>

                    {redeemPoints > 0 && (
                      <p className="text-xs font-medium" style={{ color: '#D4A017' }}>
                        {redeemPoints.toLocaleString()} оноо = {formatPrice(redeemPoints * POINTS_TO_MNT)} хямдрал
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={handleApplyPoints}
                      disabled={redeemPoints < MIN_REDEEM_POINTS}
                      className="w-full py-2 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: redeemPoints >= MIN_REDEEM_POINTS ? '#D4A017' : 'var(--esl-bg-section)',
                        color: redeemPoints >= MIN_REDEEM_POINTS ? '#fff' : 'var(--esl-text-muted)',
                      }}
                    >
                      Хэрэглэх
                    </button>
                    {redeemPoints > 0 && redeemPoints < MIN_REDEEM_POINTS && (
                      <p className="text-xs text-[var(--esl-text-muted)]">Хамгийн багадаа {MIN_REDEEM_POINTS} оноо</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--esl-success)]">
                      -{formatPrice(pointsDiscount)} хямдрал хэрэглэгдсэн
                    </span>
                    <button
                      type="button"
                      onClick={handleRemovePoints}
                      className="text-xs text-[var(--esl-text-muted)] hover:text-[var(--esl-danger)] underline transition-colors"
                    >
                      Болих
                    </button>
                  </div>
                )}
              </div>

              {/* ── Totals ── */}
              <div className="border-t border-[var(--esl-border)] pt-4 space-y-2">
                <div className="flex justify-between text-sm text-[var(--esl-text-secondary)]">
                  <span>Дүн</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-[var(--esl-text-secondary)]">
                  <span>Хүргэлт</span>
                  {deliveryFee === 0 ? (
                    <span className="text-[var(--esl-success)] font-medium">Үнэгүй</span>
                  ) : (
                    <span>{formatPrice(deliveryFee)}</span>
                  )}
                </div>
                {deliveryFee > 0 && (
                  <p className="text-xs text-[var(--esl-text-muted)]">
                    {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} нэмбэл хүргэлт үнэгүй
                  </p>
                )}
                {pointsApplied && pointsDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#D4A017' }}>Оноо хямдрал</span>
                    <span className="text-[var(--esl-success)] font-medium">-{formatPrice(pointsDiscount)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#E8242C' }}>Купон ({couponCode})</span>
                    <span className="text-[var(--esl-success)] font-medium">-{formatPrice(couponDiscount)}</span>
                  </div>
                )}

                {/* Купон код */}
                {couponDiscount === 0 && (
                  <div className="pt-2">
                    <CouponInput cartAmount={subtotal} onDiscount={(d, code) => { setCouponDiscount(d); setCouponCode(code); }} />
                  </div>
                )}
                <div className="flex justify-between text-base font-bold text-[var(--esl-text-primary)] pt-2 border-t border-[var(--esl-border)]">
                  <span>Нийт</span>
                  <span className="text-[var(--esl-brand)]">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-xl font-bold text-white text-center transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer bg-[var(--esl-brand)] hover:bg-[var(--esl-brand-dark)] disabled:bg-[var(--esl-text-muted)]"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Уншиж байна...
                  </span>
                ) : (
                  `Захиалга баталгаажуулах — ${formatPrice(total)}`
                )}
              </button>

              <p className="text-xs text-[var(--esl-text-muted)] text-center">
                Захиалга баталгаажуулснаар та үйлчилгээний нөхцлийг зөвшөөрч байна.
              </p>
            </div>
          </div>
        </form>
      </main>

      <Toast />
    </div>
  );
}

/* ═══════════ Sub-components ═══════════ */

function Header() {
  return (
    <header className="bg-[var(--esl-bg-navbar)] border-b border-[var(--esl-border)] sticky top-0 z-30 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/store" className="flex items-center gap-2">
          <EsellerLogo size={24} />
          <span className="font-bold text-[var(--esl-text-primary)] text-sm">eseller.mn</span>
        </Link>
        <Link
          href="/store"
          className="text-sm font-medium text-[var(--esl-text-secondary)] hover:text-[var(--esl-text-primary)] transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Буцах
        </Link>
      </div>
    </header>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-[var(--esl-text-secondary)] mb-1">{label}</label>
      {children}
      {error && <p className="text-xs mt-1 text-[var(--esl-danger)]">{error}</p>}
    </div>
  );
}

function inputClass(error?: string) {
  return `w-full px-4 py-2.5 rounded-xl border text-sm text-[var(--esl-text-primary)] bg-[var(--esl-bg-input)] placeholder-[var(--esl-text-muted)] outline-none transition-colors ${
    error
      ? 'border-[var(--esl-danger)] bg-[var(--esl-danger-bg)] focus:border-[var(--esl-danger)]'
      : 'border-[var(--esl-border)] focus:border-[var(--esl-brand)]'
  }`;
}
