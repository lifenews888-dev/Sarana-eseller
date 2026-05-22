'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mountain, ShieldCheck, Truck, Beef, Shirt, Milk,
  ChevronRight, MapPin, Star, BadgeCheck, Search,
} from 'lucide-react';
import { HERDER_PROVINCES, HERDER_CATEGORIES, getDeliveryEstimate } from '@/lib/herder-delivery';
import SafeImage from '@/components/ui/SafeImage';

/* ═══ Types ═══ */
interface HerderProduct {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  images: string[];
  category?: string | null;
  herder?: {
    herderName: string;
    province: string;
    provinceName: string;
    district: string;
    isVerified: boolean;
  } | null;
}

/* ═══ Category icon map ═══ */
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'мах': <Beef className="w-6 h-6" />,
  'ноос': <Shirt className="w-6 h-6" />,
  'арьс': <Shirt className="w-6 h-6" />,
  'сүү': <Milk className="w-6 h-6" />,
  'бяслаг': <Milk className="w-6 h-6" />,
  'дэгэл': <Shirt className="w-6 h-6" />,
  'аарц': <Milk className="w-6 h-6" />,
  'тараг': <Milk className="w-6 h-6" />,
};

function fmt(n: number) {
  return n.toLocaleString() + '₮';
}

export default function HerderLandingPage() {
  const [featured, setFeatured] = useState<HerderProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams({ limit: '12' });
    if (selectedCategory) params.set('category', selectedCategory);

    fetch(`/api/herder/products?${params}`)
      .then(r => r.json())
      .then(res => {
        if (res.success && res.data?.products) {
          setFeatured(res.data.products);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ═══ Hero ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-600 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-yellow-300/20 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24">
          <div className="flex items-center gap-2 mb-4">
            <Mountain className="w-8 h-8 text-emerald-200" />
            <span className="text-emerald-200 font-medium text-lg">eseller.mn</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
            Малчнаас шууд
          </h1>
          <p className="text-xl sm:text-2xl text-emerald-100 max-w-2xl mb-8">
            Монгол малчдын шинэ, байгалийн бүтээгдэхүүнийг зуучлагчгүйгээр шууд захиалаарай
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              href="#products"
              className="inline-flex items-center gap-2 bg-white text-emerald-800 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors"
            >
              <Search className="w-5 h-5" />
              Бүтээгдэхүүн үзэх
            </Link>
            <Link
              href="/become-seller"
              className="inline-flex items-center gap-2 bg-emerald-600/50 backdrop-blur text-white border border-emerald-400/30 px-6 py-3 rounded-xl font-semibold hover:bg-emerald-600/70 transition-colors"
            >
              <Mountain className="w-5 h-5" />
              Малчин болох
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ Trust badges ═══ */}
      <section className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap justify-center gap-8 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>Баталгаажсан малчид</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-600" />
            <span>Аймгаас хүргэлттэй</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-emerald-600" />
            <span>Шинэ бүтээгдэхүүн</span>
          </div>
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-emerald-600" />
            <span>Чанарын баталгаа</span>
          </div>
        </div>
      </section>

      {/* ═══ Verified badge explanation ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-start gap-4">
          <div className="bg-emerald-600 text-white rounded-full p-3">
            <BadgeCheck className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-emerald-900 mb-1">Баталгаажсан малчин</h3>
            <p className="text-emerald-700">
              &ldquo;Баталгаажсан малчин&rdquo; тэмдэгтэй малчид бол бүртгэлээ баталгаажуулсан,
              байршил нь тодорхой, бүтээгдэхүүний чанар шалгагдсан найдвартай малчид юм.
              Энэ тэмдэг нь таны захиалгын аюулгүй байдлыг баталгаажуулна.
            </p>
          </div>
        </div>
      </section>

      {/* ═══ Province grid ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Аймгаар хайх</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {HERDER_PROVINCES.map(prov => (
            <Link
              key={prov.code}
              href={`/herder/${prov.code}`}
              className="group bg-white border border-stone-200 rounded-xl p-4 hover:border-emerald-400 hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span className="font-semibold text-stone-800 group-hover:text-emerald-700 transition-colors">
                  {prov.name}
                </span>
              </div>
              <p className="text-xs text-stone-500">{prov.deliveryDays} хоног</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ Categories ═══ */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Ангилал</h2>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full border font-medium transition-all ${
              !selectedCategory
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-400'
            }`}
          >
            Бүгд
          </button>
          {HERDER_CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border font-medium capitalize transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-stone-700 border-stone-200 hover:border-emerald-400'
              }`}
            >
              {CATEGORY_ICONS[cat]}
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ═══ Featured products ═══ */}
      <section id="products" className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold text-stone-800 mb-6">Малчдын бүтээгдэхүүн</h2>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : featured.length === 0 ? (
          <div className="text-center py-20 text-stone-500">
            <Mountain className="w-12 h-12 mx-auto mb-3 text-stone-300" />
            <p className="text-lg">Одоогоор бүтээгдэхүүн байхгүй байна</p>
            <p className="text-sm mt-1">Удахгүй малчид бүтээгдэхүүнээ нэмнэ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {featured.map(product => (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Product image */}
                <div className="aspect-square bg-stone-100 relative">
                  {product.images?.[0] ? (
                    <SafeImage
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-stone-300">
                      <Mountain className="w-12 h-12" />
                    </div>
                  )}
                  {product.herder?.isVerified && (
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Баталгаатай
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="p-4">
                  <h3 className="font-semibold text-stone-800 mb-1 line-clamp-2">{product.name}</h3>

                  {product.herder && (
                    <div className="flex items-center gap-1 text-xs text-stone-500 mb-2">
                      <MapPin className="w-3 h-3" />
                      <span>{product.herder.provinceName}, {product.herder.district}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      {product.salePrice ? (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-emerald-700">{fmt(product.salePrice)}</span>
                          <span className="text-xs text-stone-400 line-through">{fmt(product.price)}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-emerald-700">{fmt(product.price)}</span>
                      )}
                    </div>
                  </div>

                  {product.herder && (
                    <p className="text-xs text-stone-400 mt-2">
                      <Truck className="w-3 h-3 inline mr-1" />
                      {getDeliveryEstimate(product.herder.province)}
                    </p>
                  )}

                  <button className="mt-3 w-full bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition-colors text-sm">
                    Захиалах
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ═══ CTA ═══ */}
      <section className="bg-gradient-to-r from-emerald-700 to-green-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <Mountain className="w-12 h-12 mx-auto mb-4 text-emerald-200" />
          <h2 className="text-3xl font-bold mb-4">Малчин болох</h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
            Та малчин уу? eseller.mn-д бүртгүүлж, бүтээгдэхүүнээ Монгол даяар зараарай.
            Бүртгэл үнэгүй, комисс бага.
          </p>
          <Link
            href="/become-seller"
            className="inline-flex items-center gap-2 bg-white text-emerald-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-emerald-50 transition-colors"
          >
            Бүртгүүлэх
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
