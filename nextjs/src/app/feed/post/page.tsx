'use client';

/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import EsellerLogo from '@/components/shared/EsellerLogo';
import {
  AlertCircle, Camera, CheckCircle2, X, Crown, Info, ArrowLeft, Send, Play, Video,
  MapPin, Phone, Eye, Clock,
  ImageIcon, ChevronLeft, ChevronRight,
  Armchair, Baby, BookOpen, BriefcaseBusiness, Building2, Car, Construction, Dog,
  Dumbbell, Factory, Gamepad2, Gem, Gift, GraduationCap, HeartPulse, Home, Laptop,
  Mars, Monitor, Package, Palette, Plug, Printer, Scissors, Shield, Shirt, Smartphone,
  Sparkles, TentTree, UtensilsCrossed, User, Venus, Wrench,
} from 'lucide-react';
import { type LucideIcon } from 'lucide-react';
import CategorySelector from '@/components/shared/CategorySelector';
import { findMarketplaceCategory, normalizeMarketplaceCategory } from '@/lib/marketplaceCategories';
import {
  listingMetadataPreviewItems,
  metadataFieldsForCategory,
  normalizeListingMetadata,
  requiredMetadataComplete,
  type ListingMetadataField,
  type ListingMetadataRecord,
} from '@/lib/listingMetadata';

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Armchair,
  Baby,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Camera,
  Car,
  Construction,
  Dog,
  Dumbbell,
  Factory,
  Gamepad2,
  Gem,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Laptop,
  Mars,
  Monitor,
  Palette,
  Plug,
  Printer,
  Scissors,
  Shield,
  Shirt,
  Smartphone,
  Sparkles,
  TentTree,
  UtensilsCrossed,
  Venus,
  Wrench,
};

const DISTRICTS = ['СБД', 'ХУД', 'БЗД', 'ЧД', 'БГД', 'СХД', 'НД', 'БНД', 'Багахангай'];
const CONDITIONS = [
  { key: 'new', label: 'Шинэ' },
  { key: 'like_new', label: 'Бараг шинэ' },
  { key: 'used', label: 'Хэрэглэсэн' },
  { key: 'broken', label: 'Эвдэрсэн' },
];

type MediaFile = {
  id: string;
  type: 'image' | 'video';
  file: File;
  preview: string;
};

type FeedCreateResponse = {
  success?: boolean;
  data?: { id?: string; _id?: string } | null;
  error?: string;
};

const FEED_POST_DRAFT_KEY = 'eseller.feedPostDraft.v1';
const FEED_POST_DRAFT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type FeedPostDraft = {
  title: string;
  description: string;
  price: string;
  category: string;
  district: string;
  province: string;
  condition: string;
  phone: string;
  isVip: boolean;
  metadataDraft: Record<string, string>;
  savedAt: number;
};

const GENERIC_PRODUCT_META_GROUPS = [
  {
    title: 'Барааны мэдээлэл',
    description: 'Худалдан авагчийн хамгийн түрүүнд шалгах үндсэн үзүүлэлтүүд.',
    keys: ['brand', 'model', 'productType', 'condition', 'material', 'size', 'color', 'usageDuration', 'warranty'],
  },
  {
    title: 'Худалдааны нөхцөл',
    description: 'Хүргэлт, авах байршил, үнэ тохиролцох эсэхийг тодорхой бичнэ.',
    keys: ['deliveryOptions', 'pickupLocation', 'negotiable', 'returnPolicy'],
  },
  {
    title: 'Иж бүрдэл ба шалгалт',
    description: 'Дагалдах зүйлс болон ажиллагааны шалгалтыг тусад нь оруулна.',
    keys: ['includedItems', 'checks', 'features'],
  },
] as const;

type MetadataFieldGroup = {
  title: string;
  description: string;
  keys: readonly string[];
  fields: ListingMetadataField[];
};

function formatPrice(n: number) {
  if (n >= 1000000000) return (n / 1000000000).toFixed(1) + ' тэрбум₮';
  if (n >= 1000000) return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + ' сая₮';
  if (n > 0) return n.toLocaleString() + '₮';
  return '0₮';
}

function genericProductMetadataGroups(fields: ListingMetadataField[]): MetadataFieldGroup[] {
  const byKey = new Map(fields.map((field) => [field.key, field]));
  const used = new Set<string>();
  const groups: MetadataFieldGroup[] = GENERIC_PRODUCT_META_GROUPS
    .map((group) => {
      const groupFields = group.keys
        .map((key) => byKey.get(key))
        .filter((field): field is ListingMetadataField => Boolean(field));
      groupFields.forEach((field) => used.add(field.key));
      return { ...group, fields: groupFields };
    })
    .filter((group) => group.fields.length > 0);

  const otherFields = fields.filter((field) => !used.has(field.key));
  if (otherFields.length > 0) {
    groups.push({
      title: 'Нэмэлт мэдээлэл',
      description: 'Ангилалд хэрэгтэй бусад дэлгэрэнгүй мэдээлэл.',
      keys: otherFields.map((field) => field.key),
      fields: otherFields,
    });
  }

  return groups;
}

function metadataPreviewTitle(category: string) {
  const root = normalizeMarketplaceCategory(category);
  if (root === 'phones') return 'Утасны мэдээлэл';
  if (root === 'vehicles') return 'Машины мэдээлэл';
  if (root === 'real-estate') return 'Байрны мэдээлэл';
  if (root === 'new-buildings') return 'Төслийн мэдээлэл';
  if (category && root !== 'all') return 'Барааны мэдээлэл';
  return 'Үзүүлэлт';
}

function isGenericProductCategory(category: string) {
  const root = normalizeMarketplaceCategory(category);
  return Boolean(category)
    && !['phones', 'vehicles', 'real-estate', 'new-buildings'].includes(root)
    && ![
      'education-training',
      'beauty-services',
      'tech-it-services',
      'professional-consulting',
      'auto-services',
      'repair-services',
      'printing-services',
      'manufacturing-custom',
      'photo-video',
      'design-creative',
    ].includes(root);
}

export default function PostAdPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [district, setDistrict] = useState('');
  const [province, setProvince] = useState('');
  const [condition, setCondition] = useState('');
  const [phone, setPhone] = useState('');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [isVip, setIsVip] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMediaIdx, setPreviewMediaIdx] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [metadataDraft, setMetadataDraft] = useState<Record<string, string>>({});
  const [previewMetadata, setPreviewMetadata] = useState<ListingMetadataRecord>({});
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState('');
  const [publishedItemId, setPublishedItemId] = useState('');
  const [draftRestored, setDraftRestored] = useState(false);
  const [draftSavedAt, setDraftSavedAt] = useState<number | null>(null);
  const [draftNoticeDismissed, setDraftNoticeDismissed] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const imageCount = mediaFiles.filter(m => m.type === 'image').length;
  const videoCount = mediaFiles.filter(m => m.type === 'video').length;
  const metadataFields = metadataFieldsForCategory(category);
  const metadataComplete = requiredMetadataComplete(metadataFields, metadataDraft);
  const previewMetadataItems = listingMetadataPreviewItems(metadataFields, previewMetadata, 8);
  const previewMetadataTitle = metadataPreviewTitle(category);
  const metadataGroups = isGenericProductCategory(category)
    ? genericProductMetadataGroups(metadataFields)
    : [{ title: previewMetadataTitle, description: 'Сонгосон ангилалд хэрэгтэй мэдээллээ бөглөнө.', keys: metadataFields.map((field) => field.key), fields: metadataFields }];
  const previewMetadataGroups = metadataGroups
    .map((group) => ({
      title: group.title,
      items: listingMetadataPreviewItems(group.fields, previewMetadata, group.fields.length),
    }))
    .filter((group) => group.items.length > 0);
  const canSubmit = title.trim() && price.trim() && category && (district || province) && metadataComplete;

  const clearSavedDraft = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(FEED_POST_DRAFT_KEY);
    }
    setDraftSavedAt(null);
    setDraftRestored(false);
  }, []);

  useEffect(() => {
    try {
      const rawDraft = window.localStorage.getItem(FEED_POST_DRAFT_KEY);
      if (!rawDraft) return;

      const draft = JSON.parse(rawDraft) as Partial<FeedPostDraft>;
      if (!draft.savedAt || Date.now() - draft.savedAt > FEED_POST_DRAFT_MAX_AGE_MS) {
        window.localStorage.removeItem(FEED_POST_DRAFT_KEY);
        return;
      }

      setTitle(draft.title || '');
      setDescription(draft.description || '');
      setPrice(draft.price || '');
      setCategory(draft.category || '');
      setDistrict(draft.district || '');
      setProvince(draft.province || '');
      setCondition(draft.condition || '');
      setPhone(draft.phone || '');
      setIsVip(Boolean(draft.isVip));
      setMetadataDraft(draft.metadataDraft || {});
      setDraftSavedAt(draft.savedAt);
      setDraftRestored(true);
    } catch {
      window.localStorage.removeItem(FEED_POST_DRAFT_KEY);
    } finally {
      setDraftLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!draftLoaded) return;

    const metadataHasContent = Object.values(metadataDraft).some((value) => value.trim());
    const hasDraftContent = Boolean(
      title.trim()
      || description.trim()
      || price.trim()
      || category
      || district
      || province
      || condition
      || phone
      || isVip
      || metadataHasContent,
    );

    if (!hasDraftContent) {
      clearSavedDraft();
      return;
    }

    const timer = window.setTimeout(() => {
      const savedAt = Date.now();
      const draft: FeedPostDraft = {
        title,
        description,
        price,
        category,
        district,
        province,
        condition,
        phone,
        isVip,
        metadataDraft,
        savedAt,
      };
      window.localStorage.setItem(FEED_POST_DRAFT_KEY, JSON.stringify(draft));
      setDraftSavedAt(savedAt);
    }, 500);

    return () => window.clearTimeout(timer);
  }, [draftLoaded, title, description, price, category, district, province, condition, phone, isVip, metadataDraft, clearSavedDraft]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const remaining = 10 - mediaFiles.length;
    if (remaining <= 0) return;

    const newMedia: MediaFile[] = [];
    const allowedImages = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const allowedVideos = ['video/mp4', 'video/webm', 'video/quicktime'];
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB

    for (let i = 0; i < Math.min(files.length, remaining); i++) {
      const file = files[i];
      const isImage = allowedImages.includes(file.type);
      const isVideo = allowedVideos.includes(file.type);

      if (!isImage && !isVideo) continue;
      if (isImage && file.size > maxImageSize) continue;
      if (isVideo && file.size > maxVideoSize) continue;
      if (isVideo && videoCount + newMedia.filter(m => m.type === 'video').length >= 3) continue;

      newMedia.push({
        id: crypto.randomUUID(),
        type: isVideo ? 'video' : 'image',
        file,
        preview: URL.createObjectURL(file),
      });
    }

    setMediaFiles(prev => [...prev, ...newMedia]);
  };

  const removeMedia = (id: string) => {
    setMediaFiles(prev => {
      const item = prev.find(m => m.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter(m => m.id !== id);
    });
  };

  const setCover = (id: string) => {
    setMediaFiles(prev => {
      const idx = prev.findIndex(m => m.id === id);
      if (idx <= 0) return prev;
      const item = prev[idx];
      return [item, ...prev.filter(m => m.id !== id)];
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  };

  const updateMetadata = (key: string, value: string) => {
    setMetadataDraft(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setPreviewMetadata(normalizeListingMetadata(metadataFields, metadataDraft));
    setPublishError('');
    setPublishedItemId('');
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setShowPreview(true);
    }, 1500);
  };

  const uploadMedia = async (media: MediaFile): Promise<{ type: MediaFile['type']; url: string }> => {
    const res = await fetch(`/api/upload?filename=${encodeURIComponent(media.file.name)}`, {
      method: 'POST',
      body: media.file,
      headers: { 'Content-Type': media.file.type || 'application/octet-stream' },
    });
    const body = await res.json().catch(() => ({})) as { url?: string; error?: string };
    if (!res.ok || !body.url) throw new Error(body.error || 'Медиа байршуулахад алдаа гарлаа');
    return { type: media.type, url: body.url };
  };

  const handlePublish = async () => {
    if (publishing || publishedItemId) return;

    setPublishing(true);
    setPublishError('');

    try {
      const uploadedMedia = await Promise.all(mediaFiles.map(uploadMedia));
      const imageUrls = uploadedMedia.filter((media) => media.type === 'image').map((media) => media.url);
      const videoUrls = uploadedMedia.filter((media) => media.type === 'video').map((media) => media.url);
      const rootCategory = normalizeMarketplaceCategory(category);
      const metadata: ListingMetadataRecord = { ...previewMetadata };
      const selectedCondition = CONDITIONS.find(c => c.key === condition)?.label;
      if (selectedCondition && !metadata.condition) metadata.condition = selectedCondition;
      if (phone) metadata.ownerPhone = `+976 ${phone}`;

      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          price,
          images: imageUrls,
          videoUrls,
          category: rootCategory === 'all' ? category : rootCategory,
          subcategory: category && category !== rootCategory ? category : undefined,
          entityType: 'store',
          district,
          province,
          metadata,
          tier: isVip ? 'vip' : 'normal',
        }),
      });
      const body = await res.json().catch(() => ({})) as FeedCreateResponse;

      if (!res.ok || body.success === false) {
        if (res.status === 401) throw new Error('Нэвтэрч орсны дараа зар нийтлэх боломжтой.');
        throw new Error(body.error || 'Зар нийтлэхэд алдаа гарлаа.');
      }

      const createdId = body.data?.id || body.data?._id;
      if (!createdId) throw new Error('Зар үүссэн боловч дугаар буцаж ирсэнгүй.');
      setPublishedItemId(createdId);
      clearSavedDraft();
    } catch (error) {
      setPublishError(error instanceof Error ? error.message : 'Зар нийтлэхэд алдаа гарлаа.');
    } finally {
      setPublishing(false);
    }
  };

  const selectedCategory = findMarketplaceCategory(category);
  const catInfo = selectedCategory
    ? {
        key: selectedCategory.key,
        label: selectedCategory.label,
        icon: CATEGORY_ICON_MAP[selectedCategory.icon] || Package,
      }
    : null;

  const renderMetadataField = (field: ListingMetadataField) => {
    const value = metadataDraft[field.key] || '';

    return (
      <label key={field.key} className={field.type === 'list' ? 'sm:col-span-2' : ''}>
        <span className="mb-1.5 block text-xs font-bold text-[var(--esl-text-secondary)]">
          {field.label} {field.required && <span className="text-[#E8242C]">*</span>}
        </span>

        {field.type === 'select' ? (
          <select
            name={field.key}
            value={value}
            onChange={(e) => updateMetadata(field.key, e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-sm text-white outline-none transition focus:border-[#E8242C]"
          >
            <option value="">Сонгох</option>
            {(field.options || []).map((option) => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        ) : field.type === 'boolean' ? (
          <select
            name={field.key}
            value={value}
            onChange={(e) => updateMetadata(field.key, e.target.value)}
            className="h-11 w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-sm text-white outline-none transition focus:border-[#E8242C]"
          >
            <option value="">Сонгох</option>
            <option value="true">Тийм</option>
            <option value="false">Үгүй</option>
          </select>
        ) : field.type === 'list' ? (
          <textarea
            name={field.key}
            value={value}
            onChange={(e) => updateMetadata(field.key, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className="w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 py-2 text-sm text-white outline-none transition placeholder:text-[#555] focus:border-[#E8242C]"
          />
        ) : (
          <input
            name={field.key}
            type="text"
            inputMode={field.type === 'number' ? 'decimal' : 'text'}
            value={value}
            onChange={(e) => updateMetadata(
              field.key,
              field.type === 'number' ? e.target.value.replace(/[^0-9.]/g, '') : e.target.value,
            )}
            placeholder={field.placeholder}
            className="h-11 w-full rounded-xl border border-[var(--esl-border)] bg-[var(--esl-bg-card)] px-3 text-sm text-white outline-none transition placeholder:text-[#555] focus:border-[#E8242C]"
          />
        )}

        {field.hint && <span className="mt-1 block text-[11px] text-[var(--esl-text-muted)]">{field.hint}</span>}
      </label>
    );
  };

  /* ═══ Preview Modal ═══ */
  if (showPreview) {
    return (
      <div className="min-h-screen bg-[var(--esl-bg-page)]">
        <header className="sticky top-0 z-50 bg-[var(--esl-bg-section)] border-b border-[var(--esl-border)]">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
            <button onClick={() => setShowPreview(false)} className="w-10 h-10 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] flex items-center justify-center text-white cursor-pointer hover:bg-[var(--esl-bg-elevated)] transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-black text-white">Зарын урьдчилсан харагдац</h1>
              <p className={`text-xs ${publishedItemId ? 'text-green-400' : 'text-[var(--esl-text-muted)]'}`}>
                {publishedItemId ? 'Зар амжилттай нийтлэгдлээ.' : 'Мэдээллээ нягтлаад нийтлэх товч дарна уу.'}
              </p>
            </div>
          </div>
        </header>

        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Preview card — how it looks in the feed */}
          <p className="text-xs font-bold text-[var(--esl-text-muted)] mb-3 uppercase tracking-wider">Жагсаалтад ийм харагдана</p>
          <div className={`rounded-2xl border overflow-hidden mb-8 ${isVip ? 'border-amber-500/30 bg-amber-500/5' : 'border-[var(--esl-border)] bg-[var(--esl-bg-card)]'}`}>
            <div className="flex flex-col sm:flex-row">
              <div className={`relative h-48 sm:h-auto sm:w-56 shrink-0 overflow-hidden ${isVip ? 'bg-[#1A1500]' : 'bg-[var(--esl-bg-elevated)]'}`}>
                {mediaFiles.length > 0 ? (
                  mediaFiles[0].type === 'video' ? (
                    <video src={mediaFiles[0].preview} className="w-full h-full object-cover" />
                  ) : (
                    <img loading="lazy" src={mediaFiles[0].preview} alt={title} className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {(() => { const CatIcon = catInfo?.icon || Package; return <CatIcon className="w-14 h-14 text-[var(--esl-text-muted)]" />; })()}
                  </div>
                )}
                {isVip && (
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[rgba(212,175,55,0.2)] text-[#D4AF37]">
                    <Crown className="w-3.5 h-3.5" /> ВИП
                  </div>
                )}
                {mediaFiles.length > 1 && (
                  <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-bold bg-black/60 text-white">
                    <ImageIcon className="w-3 h-3" /> {imageCount}
                    {videoCount > 0 && <><span className="mx-0.5">·</span><Play className="w-3 h-3" /> {videoCount}</>}
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs text-[var(--esl-text-muted)] mb-2">
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> Та</span>
                  {district && <><span className="text-[#3D3D3D]">·</span><span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{district}</span></>}
                </div>
                <h3 className={`text-base font-extrabold mb-1.5 leading-snug ${isVip ? 'text-[#FFD700]' : 'text-white'}`}>{title || 'Гарчиг...'}</h3>
                <p className="text-sm text-[#888] line-clamp-2 mb-3">{description || 'Тайлбар...'}</p>
                {condition && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className="text-[11px] font-semibold text-[#D0D0D0] bg-[var(--esl-bg-elevated)] px-2 py-1 rounded">{CONDITIONS.find(c => c.key === condition)?.label}</span>
                  </div>
                )}
                {previewMetadataItems.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {previewMetadataItems.slice(0, 4).map((item) => (
                      <span key={item.key} className="text-[11px] font-semibold text-[#D0D0D0] bg-[var(--esl-bg-elevated)] px-2 py-1 rounded">
                        {item.value}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex items-end justify-between">
                  <span className={`text-xl font-black ${isVip ? 'text-[#FFD700]' : 'text-[#E8242C]'}`}>{formatPrice(Number(price) || 0)}</span>
                  <div className="flex items-center gap-3 text-[11px] text-[#555]">
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" />0</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />Өнөөдөр</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Preview detail — what users see when they click */}
          <p className="text-xs font-bold text-[var(--esl-text-muted)] mb-3 uppercase tracking-wider">Дарахад ийм харагдана</p>
          <div className="rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] overflow-hidden mb-8">
            {/* Media carousel */}
            <div className={`relative h-64 sm:h-80 ${isVip ? 'bg-[#1A1500]' : 'bg-[var(--esl-bg-elevated)]'}`}>
              {mediaFiles.length > 0 ? (
                mediaFiles[previewMediaIdx]?.type === 'video' ? (
                  <video src={mediaFiles[previewMediaIdx].preview} controls className="w-full h-full object-contain bg-black" />
                ) : (
                  <img loading="lazy" src={mediaFiles[previewMediaIdx]?.preview} alt={title} className="w-full h-full object-cover" />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {(() => { const CatIcon = catInfo?.icon || Package; return <CatIcon className="w-20 h-20 text-[var(--esl-text-muted)]" />; })()}
                </div>
              )}
              {mediaFiles.length > 1 && (
                <>
                  <button
                    onClick={() => setPreviewMediaIdx(i => i > 0 ? i - 1 : mediaFiles.length - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition cursor-pointer border-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPreviewMediaIdx(i => i < mediaFiles.length - 1 ? i + 1 : 0)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition cursor-pointer border-none"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg text-xs font-bold bg-black/60 text-white">
                    {previewMediaIdx + 1} / {mediaFiles.length}
                  </div>
                  <div className="absolute bottom-3 left-3 flex gap-1.5">
                    {mediaFiles.map((m, i) => (
                      <button
                        key={m.id}
                        onClick={() => setPreviewMediaIdx(i)}
                        className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${i === previewMediaIdx ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                        {m.type === 'video' ? (
                          <div className="w-full h-full bg-black/80 flex items-center justify-center relative">
                            <video src={m.preview} className="w-full h-full object-cover absolute inset-0" />
                            <Play className="w-3 h-3 text-white relative z-10" fill="white" />
                          </div>
                        ) : (
                          <img loading="lazy" src={m.preview} alt="" className="w-full h-full object-cover" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {isVip && (
                <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold bg-[rgba(212,175,55,0.25)] text-[#D4AF37]" style={{ backdropFilter: 'blur(8px)' }}>
                  <Crown className="w-4 h-4" /> ВИП
                </div>
              )}
            </div>

            {/* Detail content */}
            <div className="p-6">
              <div className="flex items-center gap-2 text-sm text-[var(--esl-text-muted)] mb-3">
                <User className="w-4 h-4" />
                <span className="font-semibold text-[var(--esl-text-secondary)]">Та</span>
                <span className="text-[#3D3D3D]">·</span>
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{district || '—'}</span>
              </div>
              <h2 className={`text-2xl font-black mb-2 ${isVip ? 'text-[#FFD700]' : 'text-white'}`}>{title || 'Гарчиг...'}</h2>
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-3xl font-black ${isVip ? 'text-[#FFD700]' : 'text-[#E8242C]'}`}>{formatPrice(Number(price) || 0)}</span>
              </div>
              {condition && (
                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="text-xs font-semibold text-[#D0D0D0] bg-[var(--esl-bg-elevated)] px-3 py-1.5 rounded-lg">
                    {CONDITIONS.find(c => c.key === condition)?.label}
                  </span>
                </div>
              )}
              {previewMetadataGroups.length > 0 && (
                <div className="mb-6 space-y-4">
                  {previewMetadataGroups.map((group) => (
                    <div key={group.title}>
                      <h3 className="text-sm font-bold text-[var(--esl-text-secondary)] mb-2">{group.title}</h3>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {group.items.map((item) => (
                          <div key={item.key} className="rounded-lg bg-[var(--esl-bg-elevated)] border border-[var(--esl-border)] px-3 py-2">
                            <p className="text-[11px] text-[var(--esl-text-muted)]">{item.label}</p>
                            <p className="text-sm font-semibold text-white mt-0.5 leading-tight">{item.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-sm font-bold text-[var(--esl-text-secondary)] mb-2">Тайлбар</h3>
                <p className="text-sm text-[#999] leading-relaxed whitespace-pre-wrap">{description || 'Тайлбар оруулаагүй'}</p>
              </div>
              {phone && (
                <div className="flex items-center gap-2 text-sm text-[#999] mb-6 pb-6 border-b border-[var(--esl-border)]">
                  <Phone className="w-3.5 h-3.5" /> +976 {phone}
                </div>
              )}
              <div className="flex gap-3">
                <div className="flex-1 flex items-center justify-center gap-2 h-12 bg-[#E8242C] text-white font-bold rounded-xl text-sm">
                  <Phone className="w-4 h-4" /> Залгах
                </div>
                <div className="flex-1 flex items-center justify-center gap-2 h-12 bg-[var(--esl-bg-elevated)] text-white font-bold rounded-xl border border-[var(--esl-border)] text-sm">
                  💬 Мессеж
                </div>
              </div>
            </div>
          </div>

          {publishError && (
            <div className="mb-4 flex gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
              <div className="flex-1">
                <p className="font-bold text-red-100">Нийтлэх боломжгүй байна</p>
                <p className="mt-1 text-xs leading-relaxed text-red-200/90">{publishError}</p>
                {publishError.includes('Нэвтэрч') && (
                  <button
                    onClick={() => router.push('/login?redirect=/feed/post')}
                    className="mt-3 rounded-lg bg-[#E8242C] px-4 py-2 text-xs font-bold text-white"
                  >
                    Нэвтрэх
                  </button>
                )}
              </div>
            </div>
          )}

          {publishedItemId && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-100">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-green-400" />
              <div>
                <p className="font-bold">Зар нийтлэгдлээ</p>
                <p className="mt-1 text-xs text-green-100/80">Одоо хэрэглэгчид зарын буланд харах боломжтой.</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {!publishedItemId ? (
              <>
                <button
                  onClick={() => { setShowPreview(false); }}
                  disabled={publishing}
                  className="flex-1 h-12 rounded-xl bg-[var(--esl-bg-elevated)] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#3D3D3D] transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" /> Засах
                </button>
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex-1 h-12 rounded-xl bg-[#E8242C] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#CC0000] transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Send className="w-4 h-4" />
                  {publishing ? 'Нийтэлж байна...' : 'Нийтлэх'}
                </button>
              </>
            ) : (
              <>
                <Link href={`/feed/${publishedItemId}`} className="flex-1 h-12 rounded-xl bg-[#E8242C] text-white text-sm font-bold no-underline hover:bg-[#CC0000] transition flex items-center justify-center gap-2">
                  Дэлгэрэнгүй харах
                </Link>
                <button onClick={() => router.push('/feed')} className="flex-1 h-12 rounded-xl bg-[var(--esl-bg-elevated)] text-white text-sm font-bold border-none cursor-pointer hover:bg-[#3D3D3D] transition flex items-center justify-center gap-2">
                  Зарын булан
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═══ Form ═══ */
  return (
    <div className="min-h-screen bg-[var(--esl-bg-page)]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
        className="hidden"
        onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--esl-bg-section)] border-b border-[var(--esl-border)]">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] flex items-center justify-center text-white cursor-pointer hover:bg-[var(--esl-bg-elevated)] transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-white">Зар оруулах</h1>
            <p className="text-xs text-[var(--esl-text-muted)]">Зурагтай зар 5x илүү олон хүнд хүрнэ</p>
          </div>
          <Link href="/" className="flex items-center gap-2 no-underline">
            <EsellerLogo size={24} />
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {!draftNoticeDismissed && (draftRestored || draftSavedAt) && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-blue-500/25 bg-blue-500/10 p-4 sm:flex-row sm:items-center">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-300">
              <Clock className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-extrabold text-blue-100">
                {draftRestored ? 'Өмнөх ноорог сэргээгдлээ' : 'Ноорог автоматаар хадгалагдлаа'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-blue-100/70">
                Нэвтрэх шаардлага гарсан ч бөглөсөн талбарууд хадгалагдана. Зураг, видео файлыг хөтөч дахин сэргээдэггүй тул нийтлэхийн өмнө дахин сонгоно.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDraftNoticeDismissed(true)}
              className="h-9 rounded-xl border border-blue-300/20 bg-blue-500/10 px-3 text-xs font-bold text-blue-100 transition hover:bg-blue-500/20"
            >
              Мэдэгдлийг хаах
            </button>
          </div>
        )}

        {/* Media Upload */}
        <div className="mb-8">
          <label className="text-sm font-bold text-[var(--esl-text-secondary)] mb-1 block">
            Зураг & Видео <span className="text-[#888] font-normal">({mediaFiles.length}/10)</span>
          </label>
          <p className="text-xs text-[#555] mb-3">Зураг: JPG, PNG, WebP (10MB хүртэл) · Видео: MP4, WebM (50MB хүртэл, 3 хүртэл)</p>

          <div
            className={`flex gap-3 flex-wrap p-4 rounded-2xl border-2 border-dashed transition-colors ${
              dragOver ? 'border-[#E8242C] bg-[rgba(232,36,44,0.05)]' : 'border-[var(--esl-border)] bg-transparent'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            {/* Add button */}
            {mediaFiles.length < 10 && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-xl border-2 border-dashed border-[var(--esl-border)] bg-[var(--esl-bg-card)] flex flex-col items-center justify-center gap-1.5 cursor-pointer hover:border-[#E8242C] transition-colors text-[var(--esl-text-muted)]"
              >
                <Camera className="w-6 h-6" />
                <span className="text-xs font-semibold">Нэмэх</span>
                <span className="text-[10px] text-[#555]">{mediaFiles.length}/10</span>
              </button>
            )}

            {/* Thumbnails */}
            {mediaFiles.map((m, i) => (
              <div key={m.id} className="relative w-28 h-28 rounded-xl overflow-hidden group">
                {m.type === 'video' ? (
                  <div className="w-full h-full bg-black relative">
                    <video src={m.preview} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="w-6 h-6 text-white" fill="white" />
                    </div>
                  </div>
                ) : (
                  <img loading="lazy" src={m.preview} alt="" className="w-full h-full object-cover" />
                )}

                {/* Remove */}
                <button
                  onClick={() => removeMedia(m.id)}
                  className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#E8242C] text-white flex items-center justify-center border-2 border-[var(--esl-bg-page)] cursor-pointer z-10"
                >
                  <X className="w-3 h-3" />
                </button>

                {/* Cover badge */}
                {i === 0 && (
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-[#E8242C] text-white px-1.5 py-0.5 rounded">Нүүр</span>
                )}

                {/* Set as cover */}
                {i > 0 && m.type === 'image' && (
                  <button
                    onClick={() => setCover(m.id)}
                    className="absolute bottom-1.5 left-1.5 text-[9px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-none"
                  >
                    Нүүр болгох
                  </button>
                )}

                {/* Type badge */}
                {m.type === 'video' && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                    <Video className="w-2.5 h-2.5" /> Видео
                  </span>
                )}

                {/* File size */}
                <span className="absolute top-1.5 right-1.5 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {(m.file.size / (1024 * 1024)).toFixed(1)}MB
                </span>
              </div>
            ))}
          </div>

          {dragOver && (
            <p className="text-xs text-[#E8242C] mt-2 font-semibold">Файлуудаа энд тавина уу...</p>
          )}
        </div>

        {/* Title */}
        <div className="mb-6">
          <label className="text-sm font-bold text-[var(--esl-text-secondary)] mb-2 block">Гарчиг <span className="text-[#E8242C]">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Жишээ: iPhone 15 Pro, бараг шинэ"
            maxLength={100}
            className="w-full h-12 px-4 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] text-white text-sm outline-none focus:border-[#E8242C] placeholder:text-[#555] transition-all"
          />
          <p className="text-right text-[11px] text-[#555] mt-1">{title.length}/100</p>
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="text-sm font-bold text-[var(--esl-text-secondary)] mb-3 block">Ангилал <span className="text-[#E8242C]">*</span></label>
          <CategorySelector
            value={category}
            onChange={(_id, slug) => {
              setCategory(slug);
              setMetadataDraft({});
              setPreviewMetadata({});
            }}
            label=""
          />
        </div>

        {metadataFields.length > 0 && (
          <section className="mb-6 rounded-2xl border border-[var(--esl-border)] bg-[var(--esl-bg-section)] p-4">
            <div className="mb-4">
              <h2 className="text-sm font-black text-white">{previewMetadataTitle}</h2>
              <p className="mt-1 text-xs text-[var(--esl-text-muted)]">
                Сонгосон ангилалд хэрэгтэй мэдээллээ бөглөнө. Одтой талбарууд зарын чанарт заавал хэрэгтэй.
              </p>
            </div>

            <div className="space-y-5">
              {metadataGroups.map((group) => (
                <div key={group.title}>
                  <div className="mb-3">
                    <p className="text-xs font-black text-white">{group.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--esl-text-muted)]">{group.description}</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {group.fields.map(renderMetadataField)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Price */}
        <div className="mb-6">
          <label className="text-sm font-bold text-[var(--esl-text-secondary)] mb-2 block">Үнэ <span className="text-[#E8242C]">*</span></label>
          <div className="flex">
            <input
              type="text"
              value={price ? Number(price).toLocaleString() : ''}
              onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="0"
              className="flex-1 h-12 px-4 rounded-l-xl bg-[var(--esl-bg-card)] border border-r-0 border-[var(--esl-border)] text-white text-lg font-bold outline-none focus:border-[#E8242C] placeholder:text-[#555] transition-all"
            />
            <div className="h-12 px-5 bg-[var(--esl-bg-elevated)] border border-l-0 border-[var(--esl-border)] rounded-r-xl flex items-center">
              <span className="text-lg font-black text-white">₮</span>
            </div>
          </div>
          {price && Number(price) >= 1000000 && (
            <p className="text-xs text-[#888] mt-1">{formatPrice(Number(price))}</p>
          )}
        </div>

        {/* Condition */}
        <div className="mb-6">
          <label className="text-sm font-bold text-[var(--esl-text-secondary)] mb-3 block">Нөхцөл байдал</label>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <button
                key={c.key}
                onClick={() => setCondition(condition === c.key ? '' : c.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${
                  condition === c.key
                    ? 'bg-[#E8242C] border-[#E8242C] text-white'
                    : 'bg-[var(--esl-bg-card)] border-[var(--esl-border)] text-[var(--esl-text-muted)] hover:border-[#555]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Location: District or Province */}
        <div className="mb-6">
          <label className="text-sm font-bold text-[var(--esl-text-secondary)] mb-3 block">Байршил <span className="text-[#E8242C]">*</span></label>
          <p className="text-xs text-[var(--esl-text-muted)] mb-2">УБ дүүрэг:</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {DISTRICTS.map((d) => (
              <button key={d} onClick={() => { setDistrict(d); setProvince(''); }}
                className={`px-4 py-2 rounded-xl text-sm font-semibold border cursor-pointer transition-all ${
                  district === d ? 'bg-[#E8242C] border-[#E8242C] text-white' : 'bg-[var(--esl-bg-section)] border-[var(--esl-border)] text-[var(--esl-text-primary)] hover:border-[#E8242C]'
                }`}>{d}</button>
            ))}
          </div>
          <p className="text-xs text-[var(--esl-text-muted)] mb-2">Аймаг:</p>
          <div className="flex flex-wrap gap-2">
            {['Архангай', 'Баян-Өлгий', 'Баянхонгор', 'Булган', 'Говь-Алтай', 'Дорноговь', 'Дорнод', 'Дундговь', 'Завхан', 'Орхон', 'Өвөрхангай', 'Өмнөговь', 'Сүхбаатар', 'Сэлэнгэ', 'Төв', 'Увс', 'Ховд', 'Хөвсгөл', 'Хэнтий', 'Дархан-Уул', 'Говьсүмбэр'].map((p) => (
              <button key={p} onClick={() => { setProvince(p); setDistrict(''); }}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer transition-all ${
                  province === p ? 'bg-[#E8242C] border-[#E8242C] text-white' : 'bg-[var(--esl-bg-section)] border-[var(--esl-border)] text-[var(--esl-text-primary)] hover:border-[#E8242C]'
                }`}>{p}</button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="text-sm font-bold text-[var(--esl-text-secondary)] mb-2 block">Дэлгэрэнгүй тайлбар</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Барааны нөхцөл, онцлог, тоо ширхэг гэх мэт..."
            maxLength={1000}
            rows={5}
            className="w-full px-4 py-3 rounded-xl bg-[var(--esl-bg-card)] border border-[var(--esl-border)] text-white text-sm outline-none focus:border-[#E8242C] placeholder:text-[#555] transition-all resize-y leading-relaxed"
          />
          <p className="text-right text-[11px] text-[#555] mt-1">{description.length}/1000</p>
        </div>

        {/* Phone */}
        <div className="mb-8">
          <label className="text-sm font-bold text-[var(--esl-text-secondary)] mb-2 block">Холбоо барих утас</label>
          <div className="flex">
            <div className="h-12 px-4 bg-[var(--esl-bg-elevated)] border border-r-0 border-[var(--esl-border)] rounded-l-xl flex items-center">
              <span className="text-sm text-[var(--esl-text-muted)]">+976</span>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, '').slice(0, 8))}
              placeholder="9911 2233"
              className="flex-1 h-12 px-4 rounded-r-xl bg-[var(--esl-bg-card)] border border-l-0 border-[var(--esl-border)] text-white text-sm outline-none focus:border-[#E8242C] placeholder:text-[#555] transition-all"
            />
          </div>
        </div>

        {/* VIP Upgrade */}
        <div
          onClick={() => setIsVip(!isVip)}
          className={`p-5 rounded-2xl border flex items-center gap-4 mb-6 cursor-pointer transition-colors ${
            isVip
              ? 'bg-[rgba(212,175,55,0.08)] border-[rgba(212,175,55,0.5)]'
              : 'bg-[var(--esl-bg-card)] border-[rgba(212,175,55,0.25)] hover:border-[rgba(212,175,55,0.5)]'
          }`}
        >
          <Crown className="w-8 h-8 text-[#FFD700]" />
          <div className="flex-1">
            <p className="text-sm font-extrabold text-[#FFD700]">ВИП зар болгох</p>
            <p className="text-xs text-[#999] mt-1">Зарыг дээд талд байрлуулж, илүү олон хүнд харуулна</p>
          </div>
          <div className="text-right flex items-center gap-3">
            <div>
              <p className="text-lg font-black text-[#FFD700]">5,000₮</p>
              <p className="text-[10px] text-[#999]">7 хоног</p>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${isVip ? 'bg-[#D4AF37]' : 'bg-[#3D3D3D]'}`}>
              <div className={`w-5 h-5 rounded-full bg-[var(--esl-bg-card)] transition-transform ${isVip ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>

        {/* Rules */}
        <div className="p-4 rounded-xl bg-[rgba(59,130,246,0.08)] border border-[rgba(59,130,246,0.2)] flex gap-3 mb-8">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-blue-400 mb-1">Зар оруулах дүрэм</p>
            <p className="text-xs text-[#888] leading-relaxed">
              • Хуурамч зар оруулахыг хориглоно<br />
              • Зураг бодит байх шаардлагатай<br />
              • Видео: MP4, WebM (50MB хүртэл, 3 хүртэл)<br />
              • Админ шалгасны дараа нийтлэгдэнэ
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3">
          <button onClick={() => router.back()} className="h-12 px-8 rounded-xl bg-[var(--esl-bg-elevated)] text-[var(--esl-text-muted)] text-sm font-bold border-none cursor-pointer hover:bg-[#3D3D3D] transition">
            Болих
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className={`flex-1 h-12 rounded-xl text-white text-sm font-bold border-none cursor-pointer flex items-center justify-center gap-2 transition-all ${
              canSubmit ? 'bg-[#E8242C] hover:bg-[#CC0000]' : 'bg-[#3D3D3D] opacity-50 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
            {submitting ? 'Бэлтгэж байна...' : 'Урьдчилж харах'}
          </button>
        </div>
      </div>
    </div>
  );
}
