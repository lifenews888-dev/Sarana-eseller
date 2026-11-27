import type { HerderShop } from '@prisma/client';
import { provinceName } from '@/lib/herder';

type UserLite = { id: string; name: string; email: string; phone: string | null } | null;

/** Координаторт харагдах хүсэлтийн хэлбэр (мобайлын CoordinatorApplication) */
export function toCoordinatorApplication(h: HerderShop, user: UserLite) {
  const bank = h.bankInfo && typeof h.bankInfo === 'object' ? (h.bankInfo as Record<string, string>) : null;
  return {
    id: h.id,
    user: user ? { _id: user.id, name: user.name, email: user.email, ...(user.phone ? { phone: user.phone } : {}) } : null,
    herderName: h.herderName,
    phone: h.phone || user?.phone || '',
    registerNumber: h.registerNumber || '',
    province: h.province,
    provinceName: provinceName(h.province),
    district: h.district,
    livestock: (h.livestock as Record<string, number> | null) || undefined,
    aDansNumber: h.aDansNumber || undefined,
    vetCertUri: h.vetCertUrl || undefined,
    bankInfo: bank?.bankName ? { bankName: bank.bankName, accountNumber: bank.accountNumber, accountName: bank.accountName } : undefined,
    notes: h.notes || undefined,
    status: h.status || 'approved',
    createdAt: h.createdAt.toISOString(),
    ...(h.rejectionReason ? { rejectionReason: h.rejectionReason } : {}),
  };
}
