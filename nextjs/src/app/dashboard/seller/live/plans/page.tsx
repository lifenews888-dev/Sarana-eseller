"use client";

import { useState, useEffect } from "react";
import { Check, X, Crown, Zap, Star, Shield } from "lucide-react";

type PlanKey = "BASIC" | "STANDARD" | "PRO" | "ENTERPRISE";

interface PlanInfo {
  key: PlanKey;
  name: string;
  price: number;
  icon: typeof Star;
  color: string;
  features: { label: string; included: boolean }[];
}

const PLANS: PlanInfo[] = [
  {
    key: "BASIC",
    name: "Үндсэн",
    price: 0,
    icon: Star,
    color: "gray",
    features: [
      { label: "Сарын 1 live", included: true },
      { label: "Нийтийн live", included: true },
      { label: "Дэлгүүрийн live", included: false },
      { label: "Барааны live", included: false },
      { label: "Live badge", included: false },
      { label: "Нүүр хуудас байршил", included: false },
      { label: "Брэнд тохируулга", included: false },
    ],
  },
  {
    key: "STANDARD",
    name: "Стандарт",
    price: 50000,
    icon: Zap,
    color: "blue",
    features: [
      { label: "Сарын 10 live", included: true },
      { label: "Нийтийн live", included: true },
      { label: "Дэлгүүрийн live", included: true },
      { label: "Барааны live", included: false },
      { label: "Live badge", included: true },
      { label: "Нүүр хуудас байршил", included: false },
      { label: "Брэнд тохируулга", included: false },
    ],
  },
  {
    key: "PRO",
    name: "Про",
    price: 150000,
    icon: Crown,
    color: "purple",
    features: [
      { label: "Хязгааргүй live", included: true },
      { label: "Нийтийн live", included: true },
      { label: "Дэлгүүрийн live", included: true },
      { label: "Барааны live", included: true },
      { label: "Live badge", included: true },
      { label: "Нүүр хуудас байршил", included: true },
      { label: "Брэнд тохируулга", included: false },
    ],
  },
  {
    key: "ENTERPRISE",
    name: "Энтерпрайз",
    price: 500000,
    icon: Shield,
    color: "amber",
    features: [
      { label: "Хязгааргүй live", included: true },
      { label: "Нийтийн live", included: true },
      { label: "Дэлгүүрийн live", included: true },
      { label: "Барааны live", included: true },
      { label: "Live badge", included: true },
      { label: "Нүүр хуудас байршил", included: true },
      { label: "Брэнд тохируулга", included: true },
    ],
  },
];

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  gray: { bg: "bg-[var(--esl-bg-section)]", border: "border-[var(--esl-border)]", text: "text-[var(--esl-text-primary)]", badge: "bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)]" },
  blue: { bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", badge: "bg-blue-100 text-blue-700" },
  purple: { bg: "bg-purple-50", border: "border-purple-300", text: "text-purple-700", badge: "bg-purple-100 text-purple-700" },
  amber: { bg: "bg-amber-50", border: "border-amber-300", text: "text-amber-700", badge: "bg-amber-100 text-amber-700" },
};

export default function LivePlansPage() {
  const [currentPlan, setCurrentPlan] = useState<PlanKey>("BASIC");
  const [liveCount, setLiveCount] = useState(0);
  const [monthlyLimit, setMonthlyLimit] = useState(1);
  const [subscribing, setSubscribing] = useState<PlanKey | null>(null);

  useEffect(() => {
    fetch("/api/seller/shop")
      .then((r) => r.json())
      .then((res) => {
        const shop = res?.data || res;
        if (shop) {
          setCurrentPlan((shop.livePlan || "BASIC") as PlanKey);
          setLiveCount(shop.liveCount || 0);
          const plan = shop.livePlan || "BASIC";
          setMonthlyLimit(plan === "PRO" || plan === "ENTERPRISE" ? -1 : plan === "STANDARD" ? 10 : 1);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubscribe = async (plan: PlanKey) => {
    if (subscribing) return;
    setSubscribing(plan);

    try {
      const res = await fetch("/api/live/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success || data.data?.success) {
        setCurrentPlan(plan);
        setLiveCount(0);
        const p = PLANS.find((pp) => pp.key === plan);
        setMonthlyLimit(plan === "PRO" || plan === "ENTERPRISE" ? -1 : plan === "STANDARD" ? 10 : 1);
        alert(`${p?.name} багц идэвхжлээ!`);
      } else {
        alert(data.error || "Алдаа гарлаа");
      }
    } catch {
      alert("Алдаа гарлаа");
    } finally {
      setSubscribing(null);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Live багц удирдах</h1>
      <p className="text-[var(--esl-text-secondary)] mb-6">
        Таны одоогийн багц: <span className="font-semibold text-[var(--esl-text-primary)]">{PLANS.find((p) => p.key === currentPlan)?.name}</span>
        {" | "}
        Энэ сарын live: <span className="font-semibold">{liveCount}</span>
        {monthlyLimit > 0 ? ` / ${monthlyLimit}` : " (хязгааргүй)"}
      </p>

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.key === currentPlan;
          const colors = COLOR_MAP[plan.color];
          const Icon = plan.icon;

          return (
            <div
              key={plan.key}
              className={`rounded-xl border-2 p-5 flex flex-col transition ${
                isCurrent ? `${colors.border} ${colors.bg}` : "border-[var(--esl-border)] bg-[var(--esl-bg-card)]"
              }`}
            >
              {/* Header */}
              <div className="flex items-center gap-2 mb-3">
                <Icon className={`w-5 h-5 ${colors.text}`} />
                <h3 className="font-bold text-lg">{plan.name}</h3>
                {isCurrent && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
                    ИДЭВХТЭЙ
                  </span>
                )}
              </div>

              {/* Price */}
              <div className="mb-4">
                <span className="text-2xl font-bold">{plan.price === 0 ? "Үнэгүй" : `${plan.price.toLocaleString()}₮`}</span>
                {plan.price > 0 && <span className="text-sm text-[var(--esl-text-secondary)]"> / сар</span>}
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {f.included ? (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-[var(--esl-text-muted)] flex-shrink-0" />
                    )}
                    <span className={f.included ? "text-[var(--esl-text-primary)]" : "text-[var(--esl-text-muted)]"}>{f.label}</span>
                  </li>
                ))}
              </ul>

              {/* Action button */}
              {plan.key === "ENTERPRISE" ? (
                <a
                  href="/contact"
                  className="block text-center bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-lg font-medium text-sm transition"
                >
                  Холбоо барих
                </a>
              ) : isCurrent ? (
                <button
                  disabled
                  className="bg-[var(--esl-bg-muted)] text-[var(--esl-text-secondary)] py-2.5 rounded-lg font-medium text-sm cursor-not-allowed"
                >
                  Одоогийн багц
                </button>
              ) : (
                <button
                  onClick={() => handleSubscribe(plan.key)}
                  disabled={subscribing !== null}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white py-2.5 rounded-lg font-medium text-sm transition"
                >
                  {subscribing === plan.key ? "Идэвхжүүлж байна..." : "Идэвхжүүлэх"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
