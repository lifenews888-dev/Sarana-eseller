"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Video,
  Globe,
  Store,
  Package,
  Lock,
  ChevronRight,
  ArrowLeft,
  Search,
  AlertTriangle,
  ArrowUpCircle,
  Calendar,
} from "lucide-react";

type Scope = "PUBLIC" | "SHOP" | "PRODUCT";

interface ProductOption {
  id: string;
  name: string;
  price: number;
  images?: string[];
}

interface ShopPlan {
  livePlan: string;
  liveCount: number;
  monthlyLive: number;
}

const SCOPE_INFO: Record<Scope, { icon: typeof Globe; label: string; desc: string; minPlan: string }> = {
  PUBLIC: { icon: Globe, label: "Нийтийн Live", desc: "Бүх хэрэглэгчид харагдана. Нүүр хуудсанд гарна.", minPlan: "BASIC" },
  SHOP: { icon: Store, label: "Дэлгүүрийн Live", desc: "Зөвхөн таны дэлгүүрийн хуудсанд харагдана.", minPlan: "STANDARD" },
  PRODUCT: { icon: Package, label: "Барааны Live", desc: "Тодорхой барааны хуудсанд live badge харагдана.", minPlan: "PRO" },
};

const PLAN_ORDER = ["BASIC", "STANDARD", "PRO", "ENTERPRISE"];

export default function CreateLivePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [scope, setScope] = useState<Scope>("PUBLIC");
  const [shopPlan, setShopPlan] = useState<ShopPlan | null>(null);

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [embedType, setEmbedType] = useState("YOUTUBE");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [scopeProductId, setScopeProductId] = useState("");

  // Product search
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Submit
  const [creating, setCreating] = useState(false);
  const [planError, setPlanError] = useState("");

  // Load shop plan info
  useEffect(() => {
    fetch("/api/live?my=1")
      .then((r) => r.json())
      .then(() => {
        // We get plan info from the shop endpoint
        fetch("/api/seller/shop")
          .then((r) => r.json())
          .then((res) => {
            const shop = res?.data || res;
            if (shop) {
              setShopPlan({
                livePlan: shop.livePlan || "BASIC",
                liveCount: shop.liveCount || 0,
                monthlyLive: shop.livePlan === "PRO" || shop.livePlan === "ENTERPRISE" ? -1 : shop.livePlan === "STANDARD" ? 10 : 1,
              });
            }
          })
          .catch(() => {
            setShopPlan({ livePlan: "BASIC", liveCount: 0, monthlyLive: 1 });
          });
      })
      .catch(() => {
        setShopPlan({ livePlan: "BASIC", liveCount: 0, monthlyLive: 1 });
      });
  }, []);

  // Load products for product selection
  useEffect(() => {
    if (step === 2) {
      setLoadingProducts(true);
      fetch("/api/seller/products")
        .then((r) => r.json())
        .then((data) => {
          const list = Array.isArray(data) ? data : data?.data || [];
          setProducts(list.map((p: ProductOption) => ({ id: p.id, name: p.name, price: p.price, images: p.images })));
        })
        .catch(() => {})
        .finally(() => setLoadingProducts(false));
    }
  }, [step]);

  const isScopeAvailable = (s: Scope): boolean => {
    if (!shopPlan) return s === "PUBLIC";
    const planIdx = PLAN_ORDER.indexOf(shopPlan.livePlan);
    const requiredIdx = PLAN_ORDER.indexOf(SCOPE_INFO[s].minPlan);
    return planIdx >= requiredIdx;
  };

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!title.trim() || creating) return;
    setCreating(true);
    setPlanError("");

    try {
      const res = await fetch("/api/live", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: description || undefined,
          scheduledAt: scheduledAt || undefined,
          productIds: selectedProductIds.length > 0 ? selectedProductIds : undefined,
          embedType,
          youtubeUrl: youtubeUrl || undefined,
          facebookUrl: facebookUrl || undefined,
          scope,
          productId: scope === "PRODUCT" ? scopeProductId : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard/seller/live");
      } else {
        if (data.error?.includes("багц") || data.error?.includes("live дууссан")) {
          setPlanError(data.error);
          setStep(3);
        } else {
          alert(data.error || "Алдаа гарлаа");
        }
      }
    } catch {
      alert("Алдаа гарлаа");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <button
        onClick={() => (step > 1 ? setStep(step - 1) : router.push("/dashboard/seller/live"))}
        className="flex items-center gap-1 text-sm text-[var(--esl-text-secondary)] hover:text-[var(--esl-text-primary)] mb-4"
      >
        <ArrowLeft className="w-4 h-4" />
        {step > 1 ? "Өмнөх алхам" : "Буцах"}
      </button>

      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Video className="w-6 h-6 text-red-500" />
        Шинэ Live үүсгэх
      </h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                s === step
                  ? "bg-red-600 text-white"
                  : s < step
                  ? "bg-green-500 text-white"
                  : "bg-[var(--esl-bg-elevated)] text-[var(--esl-text-secondary)]"
              }`}
            >
              {s}
            </div>
            <span className="text-sm text-[var(--esl-text-secondary)] hidden sm:inline">
              {s === 1 ? "Төрөл" : s === 2 ? "Тохиргоо" : "Баталгаажуулах"}
            </span>
            {s < 3 && <ChevronRight className="w-4 h-4 text-[var(--esl-text-muted)]" />}
          </div>
        ))}
      </div>

      {/* Step 1: Scope selector */}
      {step === 1 && (
        <div className="space-y-4">
          <p className="text-[var(--esl-text-secondary)] mb-4">Live дамжуулалтын төрлөө сонгоно уу</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["PUBLIC", "SHOP", "PRODUCT"] as Scope[]).map((s) => {
              const info = SCOPE_INFO[s];
              const available = isScopeAvailable(s);
              const Icon = info.icon;

              return (
                <button
                  key={s}
                  onClick={() => available && setScope(s)}
                  disabled={!available}
                  className={`relative p-5 rounded-xl border-2 text-left transition ${
                    scope === s && available
                      ? "border-red-500 bg-red-50"
                      : available
                      ? "border-[var(--esl-border)] hover:border-[var(--esl-border)]"
                      : "border-[var(--esl-border)] bg-[var(--esl-bg-section)] opacity-60 cursor-not-allowed"
                  }`}
                >
                  {!available && (
                    <Lock className="absolute top-3 right-3 w-4 h-4 text-[var(--esl-text-muted)]" />
                  )}
                  <Icon className={`w-8 h-8 mb-3 ${scope === s && available ? "text-red-600" : "text-[var(--esl-text-muted)]"}`} />
                  <h3 className="font-semibold text-[var(--esl-text-primary)]">{info.label}</h3>
                  <p className="text-xs text-[var(--esl-text-secondary)] mt-1">{info.desc}</p>
                  {!available && (
                    <p className="text-xs text-orange-600 mt-2 font-medium">
                      {info.minPlan} багц шаардлагатай
                    </p>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex justify-end mt-6">
            <button
              onClick={() => setStep(2)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition flex items-center gap-2"
            >
              Үргэлжлүүлэх
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Configuration */}
      {step === 2 && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Гарчиг *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Live худалдааны нэр"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Тайлбар</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Дэлгэрэнгүй..."
              rows={3}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Embed type */}
          <div>
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-2">Embed төрөл</label>
            <div className="flex gap-2">
              {[
                { key: "YOUTUBE", label: "YouTube Live" },
                { key: "FACEBOOK", label: "Facebook Live" },
                { key: "CUSTOM", label: "Тусгай (RTMP)" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setEmbedType(opt.key)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition ${
                    embedType === opt.key
                      ? "bg-red-50 border-red-500 text-red-700 font-medium"
                      : "border-[var(--esl-border)] text-[var(--esl-text-secondary)] hover:border-[var(--esl-border)]"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {embedType === "YOUTUBE" && (
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">YouTube Live URL</label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/live/xxxxx"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {embedType === "FACEBOOK" && (
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Facebook Live URL</label>
              <input
                type="url"
                value={facebookUrl}
                onChange={(e) => setFacebookUrl(e.target.value)}
                placeholder="https://facebook.com/xxx/videos/xxxxx"
                className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              Товлосон огноо
            </label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Product scope selector */}
          {scope === "PRODUCT" && (
            <div>
              <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Live барааг сонгох *</label>
              <div className="relative mb-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--esl-text-muted)]" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Бараа хайх..."
                  className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              {loadingProducts ? (
                <p className="text-sm text-[var(--esl-text-muted)]">Ачаалж байна...</p>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
                  {filteredProducts.map((p) => (
                    <label
                      key={p.id}
                      className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer transition ${
                        scopeProductId === p.id ? "bg-red-50" : "hover:bg-[var(--esl-bg-hover)]"
                      }`}
                    >
                      <input
                        type="radio"
                        name="scopeProduct"
                        checked={scopeProductId === p.id}
                        onChange={() => setScopeProductId(p.id)}
                        className="accent-red-600"
                      />
                      <span className="text-sm flex-1">{p.name}</span>
                      <span className="text-sm text-[var(--esl-text-secondary)]">{p.price.toLocaleString()}₮</span>
                    </label>
                  ))}
                  {filteredProducts.length === 0 && (
                    <p className="text-sm text-[var(--esl-text-muted)] p-3">Бараа олдсонгүй</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* General product selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--esl-text-primary)] mb-1">Зарах бүтээгдэхүүнүүд</label>
            {loadingProducts ? (
              <p className="text-sm text-[var(--esl-text-muted)]">Ачаалж байна...</p>
            ) : products.length === 0 ? (
              <p className="text-sm text-[var(--esl-text-muted)]">Бүтээгдэхүүн олдсонгүй</p>
            ) : (
              <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--esl-bg-hover)] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedProductIds.includes(p.id)}
                      onChange={() =>
                        setSelectedProductIds((prev) =>
                          prev.includes(p.id) ? prev.filter((x) => x !== p.id) : [...prev, p.id]
                        )
                      }
                      className="accent-red-600"
                    />
                    <span className="text-sm flex-1">{p.name}</span>
                    <span className="text-sm text-[var(--esl-text-secondary)]">{p.price.toLocaleString()}₮</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={() => setStep(1)}
              className="text-[var(--esl-text-secondary)] hover:text-[var(--esl-text-primary)] px-4 py-2.5 text-sm"
            >
              Буцах
            </button>
            <button
              onClick={handleSubmit}
              disabled={creating || !title.trim() || (scope === "PRODUCT" && !scopeProductId)}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 text-white px-6 py-2.5 rounded-lg font-medium text-sm transition"
            >
              {creating ? "Үүсгэж байна..." : "Live үүсгэх"}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Plan upgrade prompt */}
      {step === 3 && planError && (
        <div className="text-center py-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
            <AlertTriangle className="w-8 h-8 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-[var(--esl-text-primary)] mb-2">Багц шинэчлэх шаардлагатай</h2>
          <p className="text-[var(--esl-text-secondary)] mb-6 max-w-md mx-auto">{planError}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setPlanError("");
                setStep(2);
              }}
              className="text-[var(--esl-text-secondary)] hover:text-[var(--esl-text-primary)] px-4 py-2.5 text-sm"
            >
              Буцах
            </button>
            <a
              href="/dashboard/seller/live/plans"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-medium transition"
            >
              <ArrowUpCircle className="w-5 h-5" />
              Багц шинэчлэх
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
