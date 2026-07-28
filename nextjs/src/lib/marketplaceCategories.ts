export type MarketplaceCategorySection = 'product' | 'service' | 'listing';

export type MarketplaceCategoryBranch = string | {
  name: string;
  aliases?: string[];
  children?: MarketplaceCategoryBranch[];
};

export type MarketplaceCategory = {
  key: string;
  label: string;
  shortLabel?: string;
  emoji: string;
  icon: string;
  color: string;
  count?: number;
  section: MarketplaceCategorySection;
  entityTypes: string[];
  aliases?: string[];
  subcategories: MarketplaceCategoryBranch[];
};

export type CategoryTreeNode = {
  id: string;
  slug: string;
  name: string;
  nameEn: string | null;
  icon: string | null;
  level: number;
  parentId: string | null;
  entityTypes: string[];
  sortOrder: number;
  isActive: boolean;
  isApproved: boolean;
  isFeatured: boolean;
  children: CategoryTreeNode[];
};

export type MarketplaceCategoryPath = {
  rootKey: string;
  rootLabel: string;
  value: string;
  labels: string[];
  label: string;
  leafLabel: string;
  segments: MarketplaceCategoryPathSegment[];
};

export type MarketplaceCategoryPathSegment = {
  value: string;
  label: string;
  isRoot: boolean;
};

export type MarketplaceCategoryOption = {
  value: string;
  label: string;
  hasChildren: boolean;
  aliases: string[];
};

import {
  GENERATED_PRODUCT_MARKETPLACE_CATEGORIES,
  GENERATED_SERVICE_MARKETPLACE_CATEGORIES,
} from './generated/categoryMaster';

/** Product + listing categories — generated from data/eseller_angilal_master.xlsx */
export const PRODUCT_MARKETPLACE_CATEGORIES: MarketplaceCategory[] =
  GENERATED_PRODUCT_MARKETPLACE_CATEGORIES;

/** Service categories — generated from data/eseller_angilal_master.xlsx */
export const SERVICE_MARKETPLACE_CATEGORIES: MarketplaceCategory[] =
  GENERATED_SERVICE_MARKETPLACE_CATEGORIES;

export const MARKETPLACE_CATEGORIES = [
  ...PRODUCT_MARKETPLACE_CATEGORIES,
  ...SERVICE_MARKETPLACE_CATEGORIES,
];

const CATEGORY_ALIAS_MAP = new Map<string, string>(
  MARKETPLACE_CATEGORIES.flatMap((category) => [
    [category.key, category.key] as const,
    ...(category.aliases || []).map((alias) => [alias, category.key] as const),
    ...branchAliasPairs(category.key, category.subcategories),
  ]),
);

const CATEGORY_PATH_MAP = new Map<string, MarketplaceCategoryPath>(
  MARKETPLACE_CATEGORIES.flatMap((category) => {
    const rootPath = categoryPathEntry(category, category.key, []);
    return [
      [category.key, rootPath] as const,
      ...(category.aliases || []).map((alias) => [alias, rootPath] as const),
      ...branchPathPairs(category, category.subcategories),
    ];
  }),
);

const CATEGORY_DESCENDANT_VALUE_MAP = new Map<string, string[]>(
  MARKETPLACE_CATEGORIES.flatMap((category) =>
    branchDescendantValuePairs(category, category.subcategories)
  ),
);

const CATEGORY_CHILD_OPTION_MAP = new Map<string, MarketplaceCategoryOption[]>(
  MARKETPLACE_CATEGORIES.flatMap((category) => [
    [category.key, branchOptions(category.subcategories, category.key)] as const,
    ...branchChildOptionPairs(category.subcategories, category.key),
  ]),
);

export function normalizeMarketplaceCategory(value?: string | null): string {
  if (!value) return 'all';
  return CATEGORY_ALIAS_MAP.get(value) || value;
}

export function findMarketplaceCategory(value?: string | null): MarketplaceCategory | undefined {
  const normalized = normalizeMarketplaceCategory(value);
  return MARKETPLACE_CATEGORIES.find((category) => category.key === normalized);
}

export function categoryLabel(value?: string | null): string {
  return findMarketplaceCategory(value)?.label || value || 'Ангилалгүй';
}

export function categoryPathInfo(value?: string | null): MarketplaceCategoryPath | undefined {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!key) return undefined;
  return CATEGORY_PATH_MAP.get(key) || CATEGORY_PATH_MAP.get(normalizeMarketplaceCategory(key));
}

export function isMarketplaceCategoryValue(value?: string | null): boolean {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!key) return false;
  return CATEGORY_PATH_MAP.has(key) || CATEGORY_PATH_MAP.has(normalizeMarketplaceCategory(key));
}

export function categoryPathLabel(value?: string | null): string | undefined {
  return categoryPathInfo(value)?.label;
}

export function categoryDescendantValues(value?: string | null): string[] {
  const key = typeof value === 'string' ? value.trim() : '';
  if (!key) return [];
  return Array.from(new Set(CATEGORY_DESCENDANT_VALUE_MAP.get(key) || [key]));
}

export function categoryChildOptions(value?: string | null): MarketplaceCategoryOption[] {
  const path = categoryPathInfo(value);
  const key = path?.value || normalizeMarketplaceCategory(value);
  return CATEGORY_CHILD_OPTION_MAP.get(key) || [];
}

export function categoryBranchLabel(branch: MarketplaceCategoryBranch): string {
  return typeof branch === 'string' ? branch : branch.name;
}

export function subcategoryNames(category: MarketplaceCategory, limit?: number): string[] {
  const names = category.subcategories.map(categoryBranchLabel);
  return typeof limit === 'number' ? names.slice(0, limit) : names;
}

export function subcategoryPreview(category: MarketplaceCategory, limit = 3): string {
  return subcategoryNames(category, limit).join(' · ');
}

export function descendantCategoryNames(category: MarketplaceCategory, limit?: number): string[] {
  const names = category.subcategories.flatMap(branchDescendantNames);
  return typeof limit === 'number' ? names.slice(0, limit) : names;
}

export function descendantCategoryPreview(category: MarketplaceCategory, limit = 12): string {
  return descendantCategoryNames(category, limit).join(' · ');
}

export function categoryTreeFallback(): CategoryTreeNode[] {
  return MARKETPLACE_CATEGORIES
    .map((category, index) => ({
      id: category.key,
      slug: category.key,
      name: category.label,
      nameEn: null,
      icon: category.emoji,
      level: 0,
      parentId: null,
      entityTypes: category.entityTypes,
      sortOrder: index,
      isActive: true,
      isApproved: true,
      isFeatured: index < 12,
      children: category.subcategories.map((branch, subIndex) =>
        branchToTreeNode(branch, category, category.key, category.key, 1, subIndex)
      ),
    }));
}

export function flattenCategoryTree(tree: CategoryTreeNode[]): CategoryTreeNode[] {
  return tree.flatMap((node) => [node, ...flattenCategoryTree(node.children)]);
}

function slugifyCategoryName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-zа-яөөүё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

function branchChildren(branch: MarketplaceCategoryBranch): MarketplaceCategoryBranch[] {
  return typeof branch === 'string' ? [] : branch.children || [];
}

function branchAliases(branch: MarketplaceCategoryBranch): string[] {
  return typeof branch === 'string' ? [] : branch.aliases || [];
}

function branchDescendantNames(branch: MarketplaceCategoryBranch): string[] {
  const children = branchChildren(branch);
  if (children.length === 0) return [categoryBranchLabel(branch)];
  return children.flatMap(branchDescendantNames);
}

function branchValue(parentSlug: string, branch: MarketplaceCategoryBranch, index: number): string {
  const name = categoryBranchLabel(branch);
  return `${parentSlug}-${slugifyCategoryName(name) || `item-${index + 1}`}`;
}

function branchOption(
  branch: MarketplaceCategoryBranch,
  parentSlug: string,
  index: number,
): MarketplaceCategoryOption {
  return {
    value: branchValue(parentSlug, branch, index),
    label: categoryBranchLabel(branch),
    hasChildren: branchChildren(branch).length > 0,
    aliases: branchAliases(branch),
  };
}

function branchOptions(
  branches: MarketplaceCategoryBranch[],
  parentSlug: string,
): MarketplaceCategoryOption[] {
  return branches.map((branch, index) => branchOption(branch, parentSlug, index));
}

function branchChildOptionPairs(
  branches: MarketplaceCategoryBranch[],
  parentSlug: string,
): Array<readonly [string, MarketplaceCategoryOption[]]> {
  return branches.flatMap((branch, index) => {
    const value = branchValue(parentSlug, branch, index);
    const children = branchChildren(branch);
    const childOptions = branchOptions(children, value);
    return [
      [value, childOptions] as const,
      ...branchAliases(branch).map((alias) => [alias, childOptions] as const),
      ...branchChildOptionPairs(children, value),
    ];
  });
}

function branchAliasPairs(
  rootKey: string,
  branches: MarketplaceCategoryBranch[],
  parentSlug = rootKey,
): Array<readonly [string, string]> {
  return branches.flatMap((branch, index) => {
    const slug = branchValue(parentSlug, branch, index);
    return [
      [`${parentSlug}-${index + 1}`, rootKey] as const,
      [slug, rootKey] as const,
      ...branchAliases(branch).map((alias) => [alias, rootKey] as const),
      ...branchAliasPairs(rootKey, branchChildren(branch), slug),
    ];
  });
}

function categoryPathEntry(
  category: MarketplaceCategory,
  value: string,
  branchLabels: string[],
  branchValues: string[] = [],
): MarketplaceCategoryPath {
  const labels = [category.label, ...branchLabels];
  return {
    rootKey: category.key,
    rootLabel: category.label,
    value,
    labels,
    label: labels.join(' / '),
    leafLabel: branchLabels[branchLabels.length - 1] || category.label,
    segments: [
      { value: category.key, label: category.label, isRoot: true },
      ...branchLabels.map((label, index) => ({
        value: branchValues[index] || value,
        label,
        isRoot: false,
      })),
    ],
  };
}

function branchPathPairs(
  category: MarketplaceCategory,
  branches: MarketplaceCategoryBranch[],
  parentSlug = category.key,
  parentLabels: string[] = [],
  parentValues: string[] = [],
): Array<readonly [string, MarketplaceCategoryPath]> {
  return branches.flatMap((branch, index) => {
    const name = categoryBranchLabel(branch);
    const slug = branchValue(parentSlug, branch, index);
    const labels = [...parentLabels, name];
    const values = [...parentValues, slug];
    const entry = categoryPathEntry(category, slug, labels, values);
    return [
      [`${parentSlug}-${index + 1}`, entry] as const,
      [slug, entry] as const,
      ...branchAliases(branch).map((alias) => [alias, entry] as const),
      ...branchPathPairs(category, branchChildren(branch), slug, labels, values),
    ];
  });
}

function branchDescendantValuePairs(
  category: MarketplaceCategory,
  branches: MarketplaceCategoryBranch[],
  parentSlug = category.key,
): Array<readonly [string, string[]]> {
  return branches.flatMap((branch, index) => {
    const slug = branchValue(parentSlug, branch, index);
    const directValues = [
      `${parentSlug}-${index + 1}`,
      slug,
      ...branchAliases(branch),
    ];
    const childPairs = branchDescendantValuePairs(category, branchChildren(branch), slug);
    const descendantValues = Array.from(new Set([
      ...directValues,
      ...childPairs.flatMap(([, values]) => values),
    ]));

    return [
      ...directValues.map((value) => [value, descendantValues] as const),
      ...childPairs,
    ];
  });
}

function branchToTreeNode(
  branch: MarketplaceCategoryBranch,
  category: MarketplaceCategory,
  parentId: string,
  parentSlug: string,
  level: number,
  sortOrder: number,
): CategoryTreeNode {
  const name = categoryBranchLabel(branch);
  const slug = branchValue(parentSlug, branch, sortOrder);

  return {
    id: slug,
    slug,
    name,
    nameEn: null,
    icon: null,
    level,
    parentId,
    entityTypes: category.entityTypes,
    sortOrder,
    isActive: true,
    isApproved: true,
    isFeatured: false,
    children: branchChildren(branch).map((child, childIndex) =>
      branchToTreeNode(child, category, slug, slug, level + 1, childIndex)
    ),
  };
}
