import { NextResponse } from 'next/server';

export const SELLER_RESPONSE_VERSION = 'seller-dashboard.v1';
export const SELLER_BFF_NAME = 'sarana-eseller';
export const SELLER_LOCAL_UPSTREAM = 'bff_local';

export interface SellerErrorDetail {
  code: string;
  message: string;
  retryable?: boolean;
}

export interface SellerEnvelopeSuccess<T> {
  ok: true;
  data: T;
  correlationId: string;
  responseVersion: typeof SELLER_RESPONSE_VERSION;
  bff: typeof SELLER_BFF_NAME;
  upstream: string;
}

export interface SellerEnvelopeFailure {
  ok: false;
  error: SellerErrorDetail;
  correlationId: string;
  responseVersion: typeof SELLER_RESPONSE_VERSION;
  bff: typeof SELLER_BFF_NAME;
  upstream: string;
}

export function sellerHeaders(correlationId: string): HeadersInit {
  return { 'X-Correlation-ID': correlationId };
}

export function sellerOk<T>(
  data: T,
  correlationId: string,
  upstream = SELLER_LOCAL_UPSTREAM,
  status = 200
): NextResponse<SellerEnvelopeSuccess<T>> {
  return NextResponse.json(
    {
      ok: true,
      data,
      correlationId,
      responseVersion: SELLER_RESPONSE_VERSION,
      bff: SELLER_BFF_NAME,
      upstream,
    },
    { status, headers: sellerHeaders(correlationId) }
  );
}

export function sellerFail(
  code: string,
  message: string,
  correlationId: string,
  status: number,
  retryable?: boolean
): NextResponse<SellerEnvelopeFailure> {
  const error: SellerErrorDetail =
    retryable === undefined ? { code, message } : { code, message, retryable };

  return NextResponse.json(
    {
      ok: false,
      error,
      correlationId,
      responseVersion: SELLER_RESPONSE_VERSION,
      bff: SELLER_BFF_NAME,
      upstream: SELLER_LOCAL_UPSTREAM,
    },
    { status, headers: sellerHeaders(correlationId) }
  );
}
