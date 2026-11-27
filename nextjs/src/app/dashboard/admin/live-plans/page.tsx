"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  Users,
  Video,
  DollarSign,
  Store,
} from "lucide-react";

interface ShopItem {
  id: string;
  name: string;
  logo?: string;
  livePlan: string;
  liveCount: number;
  liveResetAt?: string;
}

interface PlanStats {
  plans: Record<string, number>;
  activeLives: number;
  totalViewers: number;
  shops: ShopItem[];
}

interface RevenueStats {
  basicShops: number;
  standardShops: number;
  proShops: number;
  enterpriseShops: number;
  monthlyRevenue: number;
}

const PLAN_LABELS: Record<string, string> = {
  BASIC: "Үндсэн",
  STANDARD: "Стандарт",
  PRO: "Про",
  ENTERPRISE: "Энтерпрайз",
};

const PLAN_COLORS: Record<string, string> = {
  BASIC: "bg-[var(--esl-bg-muted)] text-[var(--esl-text-primary)]",
  STANDARD: "bg-blue-100 text-blue-700",
  PRO: "bg-purple-100 text-purple-700",
  ENTERPRISE: "bg-amber-100 text-amber-700",
};

export default function AdminLivePlansPage() {
  const [stats, setStats] = useState<PlanStats | null>(null);
  const [revenue, setRevenue] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/live-plans").then((r) => r.json()),
      fetch("/api/admin/live-plans/revenue").then((r) => r.json()),
    ])
      .then(([statsRes, revRes]) => {
        if (statsRes.success) setStats(statsRes.data);
        if (revRes.success) setRevenue(revRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePlanChange = async (shopId: string, plan: string) => {
    setUpdating(shopId);
    try {
      const res = await fetch("/api/admin/live-plans", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId, plan }),
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Алдаа");
      }
    } catch {
      alert("Алдаа гарлаа");
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-red-500" />
        Live багц удирдлага
      </h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-[var(--esl-bg-card)] border rounded-xl p-4">
          <div className="flex items-center gap-2 text-[var(--esl-text-secondary)] text-sm mb-1">
            <DollarSign className="w-4 h-4" />
            Сарын орлого
          </div>
          <p className="text-2xl font-bold text-green-600">
            {(revenue?.monthlyRevenue || 0).toLocaleString()}₮
          </p>
        </div>
        <div className="bg-[var(--esl-bg-card)] border rounded-xl p-4">
          <div className="flex items-center gap-2 text-[var(--esl-text-secondary)] text-sm mb-1">
            <Video className="w-4 h-4" />
            Идэвхтэй live
          </div>
          <p className="text-2xl font-bold text-red-600">{stats?.activeLives || 0}</p>
        </div>
        <div className="bg-[var(--esl-bg-card)] border rounded-xl p-4">
          <div className="flex items-center gap-2 text-[var(--esl-text-secondary)] text-sm mb-1">
            <Users className="w-4 h-4" />
            Нийт үзэгчид
          </div>
          <p className="text-2xl font-bold">{stats?.totalViewers || 0}</p>
        </div>
        <div className="bg-[var(--esl-bg-card)] border rounded-xl p-4">
          <div className="flex items-center gap-2 text-[var(--esl-text-secondary)] text-sm mb-1">
            <Store className="w-4 h-4" />
            Нийт дэлгүүр
          </div>
          <p className="text-2xl font-bold">
            {Object.values(stats?.plans || {}).reduce((a, b) => a + b, 0)}
          </p>
        </div>
      </div>

      {/* Plan distribution */}
      <div className="bg-[var(--esl-bg-card)] border rounded-xl p-5 mb-8">
        <h2 className="font-semibold text-lg mb-4">Багц тархалт</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(["BASIC", "STANDARD", "PRO", "ENTERPRISE"] as const).map((key) => (
            <div key={key} className={`rounded-lg p-4 ${PLAN_COLORS[key].replace("text-", "bg-").split(" ")[0]}`}>
              <p className="text-sm text-[var(--esl-text-secondary)]">{PLAN_LABELS[key]}</p>
              <p className="text-3xl font-bold mt-1">{stats?.plans?.[key] || 0}</p>
              <p className="text-xs text-[var(--esl-text-secondary)] mt-1">дэлгүүр</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shops table */}
      <div className="bg-[var(--esl-bg-card)] border rounded-xl overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="font-semibold text-lg">Дэлгүүрийн жагсаалт</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--esl-bg-section)]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[var(--esl-text-secondary)]">Дэлгүүр</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--esl-text-secondary)]">Одоогийн багц</th>
                <th className="text-center px-4 py-3 font-medium text-[var(--esl-text-secondary)]">Энэ сарын live</th>
                <th className="text-left px-4 py-3 font-medium text-[var(--esl-text-secondary)]">Багц өөрчлөх</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(stats?.shops || []).map((shop) => (
                <tr key={shop.id} className="hover:bg-[var(--esl-bg-hover)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {shop.logo ? (
                        <img src={shop.logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[var(--esl-bg-elevated)] flex items-center justify-center text-xs font-bold text-[var(--esl-text-secondary)]">
                          {shop.name?.charAt(0)}
                        </div>
                      )}
                      <span className="font-medium">{shop.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${PLAN_COLORS[shop.livePlan] || PLAN_COLORS.BASIC}`}>
                      {PLAN_LABELS[shop.livePlan] || "Үндсэн"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">{shop.liveCount}</td>
                  <td className="px-4 py-3">
                    <select
                      value={shop.livePlan}
                      onChange={(e) => handlePlanChange(shop.id, e.target.value)}
                      disabled={updating === shop.id}
                      className="border rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {Object.entries(PLAN_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
              {(stats?.shops || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--esl-text-muted)]">
                    Дэлгүүр олдсонгүй
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
