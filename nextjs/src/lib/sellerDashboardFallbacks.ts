import type { AuthUser } from './api-auth';

const LOCAL_FALLBACK_WARNING = 'BFF_LOCAL_FALLBACK';

export interface SellerMeFallback {
  user: {
    id: string;
    role: string;
    displayName: string | null;
  };
  resellerProfile: {
    id: string;
    displayName: string | null;
    status: string;
    kycStatus: string;
  };
  financeEligibility: string;
  identityLink: {
    provider: string;
    status: string;
    verifiedAt: string | null;
  } | null;
  warnings: string[];
}

export interface SellerWalletSummaryFallback {
  estimatedMnt: number;
  inReviewMnt: number;
  approvedNotPayableMnt: number;
  payableMnt: number;
  paidOutMnt: number;
  excludedMnt: number;
  sourceCounts: {
    dryRun: number;
    needsReview: number;
    approvedForFuturePosting: number;
    excluded: number;
    cancelled: number;
    effective: number;
  };
  invariants: {
    effectiveZeroExpected: boolean;
    payableSourcedOnlyFromEffectiveTrue: true;
  };
  warnings: string[];
  lastComputedAt: string;
}

export interface SellerReferralSummaryFallback {
  activeReferralCode: {
    id: string;
    code: string;
    activeFrom: string;
    rotationCount: number;
    abuseFlag: boolean;
  } | null;
  referralCodeCounts: {
    active: number;
    rotated: number;
    revoked: number;
    disabledForAbuse: number;
  };
  inviteLinkCounts: {
    active: number;
    expired: number;
    revoked: number;
    disabledForAbuse: number;
    totalUseCount: number;
  };
  warnings: string[];
}

export interface SellerLeadSummaryFallback {
  totals: {
    new: number;
    qualified: number;
    contacted: number;
    convertedToRequest: number;
    rejected: number;
    expired: number;
    duplicate: number;
    spam: number;
  };
  recentLeads: Array<{
    id: string;
    status: string;
    intent: string;
    source: string;
    createdAt: string;
    hasRegisteredCustomer: boolean;
    hasConvertedRequest: boolean;
  }>;
  warnings: string[];
}

export interface SellerCommissionSummaryFallback {
  effectiveZeroInvariant: boolean;
  totals: {
    dryRun: number;
    needsReview: number;
    approvedForFuturePosting: number;
    excluded: number;
    cancelled: number;
    effective: number;
  };
  proposedAmountsMnt: {
    dryRun: number;
    inReview: number;
    approvedNotPayable: number;
  };
  payableAmountMnt: number;
  recentTransactions: Array<{
    id: string;
    status: string;
    type: string;
    eligibilityReason: string | null;
    exclusionReason: string | null;
    amountMnt: number;
    effective: boolean;
    createdAt: string;
  }>;
  warnings: string[];
}

export interface SellerDashboardFallback {
  me: SellerMeFallback;
  referralSummary: SellerReferralSummaryFallback;
  leadSummary: SellerLeadSummaryFallback;
  commissionSummary: SellerCommissionSummaryFallback;
  walletSummary: SellerWalletSummaryFallback;
  notificationsSummary: {
    deferred: boolean;
    reason?: string;
  };
  warnings: string[];
  nextActions: Array<{
    code: string;
    message: string;
  }>;
}

export function buildSellerMeFallback(auth: AuthUser): SellerMeFallback {
  const displayName = auth.name || null;

  return {
    user: {
      id: auth.id,
      role: auth.role,
      displayName,
    },
    resellerProfile: {
      id: auth.id,
      displayName,
      status: 'PENDING',
      kycStatus: 'NOT_AVAILABLE',
    },
    financeEligibility: 'NOT_AVAILABLE',
    identityLink: null,
    warnings: [LOCAL_FALLBACK_WARNING],
  };
}

export function buildSellerWalletSummaryFallback(now = new Date()): SellerWalletSummaryFallback {
  return {
    estimatedMnt: 0,
    inReviewMnt: 0,
    approvedNotPayableMnt: 0,
    payableMnt: 0,
    paidOutMnt: 0,
    excludedMnt: 0,
    sourceCounts: {
      dryRun: 0,
      needsReview: 0,
      approvedForFuturePosting: 0,
      excluded: 0,
      cancelled: 0,
      effective: 0,
    },
    invariants: {
      effectiveZeroExpected: true,
      payableSourcedOnlyFromEffectiveTrue: true,
    },
    warnings: [LOCAL_FALLBACK_WARNING],
    lastComputedAt: now.toISOString(),
  };
}

export function buildSellerReferralSummaryFallback(): SellerReferralSummaryFallback {
  return {
    activeReferralCode: null,
    referralCodeCounts: {
      active: 0,
      rotated: 0,
      revoked: 0,
      disabledForAbuse: 0,
    },
    inviteLinkCounts: {
      active: 0,
      expired: 0,
      revoked: 0,
      disabledForAbuse: 0,
      totalUseCount: 0,
    },
    warnings: [LOCAL_FALLBACK_WARNING],
  };
}

export function buildSellerLeadSummaryFallback(): SellerLeadSummaryFallback {
  return {
    totals: {
      new: 0,
      qualified: 0,
      contacted: 0,
      convertedToRequest: 0,
      rejected: 0,
      expired: 0,
      duplicate: 0,
      spam: 0,
    },
    recentLeads: [],
    warnings: [LOCAL_FALLBACK_WARNING],
  };
}

export function buildSellerCommissionSummaryFallback(): SellerCommissionSummaryFallback {
  return {
    effectiveZeroInvariant: true,
    totals: {
      dryRun: 0,
      needsReview: 0,
      approvedForFuturePosting: 0,
      excluded: 0,
      cancelled: 0,
      effective: 0,
    },
    proposedAmountsMnt: {
      dryRun: 0,
      inReview: 0,
      approvedNotPayable: 0,
    },
    payableAmountMnt: 0,
    recentTransactions: [],
    warnings: [LOCAL_FALLBACK_WARNING],
  };
}

export function buildSellerDashboardFallback(auth: AuthUser, now = new Date()): SellerDashboardFallback {
  return {
    me: buildSellerMeFallback(auth),
    referralSummary: buildSellerReferralSummaryFallback(),
    leadSummary: buildSellerLeadSummaryFallback(),
    commissionSummary: buildSellerCommissionSummaryFallback(),
    walletSummary: buildSellerWalletSummaryFallback(now),
    notificationsSummary: {
      deferred: true,
      reason: LOCAL_FALLBACK_WARNING,
    },
    warnings: [LOCAL_FALLBACK_WARNING],
    nextActions: [
      {
        code: 'DASHBOARD_NOT_READY',
        message: 'Seller dashboard data is temporarily unavailable.',
      },
    ],
  };
}
