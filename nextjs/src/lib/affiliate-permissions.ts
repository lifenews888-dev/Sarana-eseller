const AFFILIATE_OPERATOR_ROLES = new Set([
  'affiliate',
  'seller',
  'agent',
  'company',
  'auto_dealer',
  'service',
  'admin',
  'superadmin',
  'super_admin',
]);

export function canSeeAffiliateSalesTools(role?: string | null): boolean {
  return AFFILIATE_OPERATOR_ROLES.has((role || '').toLowerCase());
}
