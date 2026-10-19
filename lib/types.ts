export const PER_PAGE = 20;
export const API_BASE = 'https://afribasket-backend-1.onrender.com/api/v1';

export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'BLOG_AUTHOR';

export type Admin = {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  admin: Admin;
};

export type Page<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
};

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details: unknown;
  };
};

export type DashboardSummary = {
  products: number;
  ordersToday: number;
  ordersTotal: number;
  customers: number;
  revenueTodayCents: number;
  revenueTotalCents: number;
  paidOrders: number;
  unpaidOrders: number;
  revenueTrend: { day: string; revenueCents: number }[];
  orderStatus: { status: string; count: number }[];
  lowStock: { products: number; variants: number; items: LowStockItem[] };
  expiringLots: FoodLot[];
  paymentMix: { stripe: number; paypal: number };
  inventory: { inStock: number; low: number; out: number };
  blog: { status: string; count: number }[];
};

export type LowStockItem = {
  id: string;
  productId: string;
  name: string;
  sku: string;
  title?: string;
  quantityAvailable: number;
  quantityReserved: number;
  quantityIncoming?: number;
  lowStockThreshold: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  warehouseLocation?: string | null;
  onHand: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  needsReorder: boolean;
};

export type FoodLot = {
  id: string;
  productId: string | null;
  variantId: string | null;
  lotCode: string;
  quantity: number;
  bestByDate: string;
  receivedAt: string;
  expiredAt: string | null;
  createdAt?: string;
  product?: { name: string; sku: string } | null;
  variant?: { title: string; sku: string } | null;
};

export type StockMovement = {
  id: string;
  productId: string | null;
  variantId: string | null;
  type: string;
  delta: number;
  reason: string | null;
  note: string | null;
  adminId: string | null;
  orderId: string | null;
  createdAt: string;
};

export type Address = {
  id: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string | null;
  label: string | null;
};

export type Customer = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  marketingOptIn: boolean;
  isActive: boolean;
  defaultAddressId: string | null;
  createdAt: string;
};

export type CustomerDetail = Customer & {
  addresses: Address[];
  recentOrders: {
    orderNumber: string;
    status: string;
    paymentStatus: string;
    totalCents: number;
    createdAt: string;
  }[];
};

export type OrderItem = {
  id: string;
  orderId: string;
  productId: string | null;
  variantId: string | null;
  name: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl: string | null;
  storageType: string;
  lineTotalCents: number;
  returnedQuantity: number;
};

export type OrderNote = {
  id: string;
  orderId: string;
  body: string;
  isInternal: boolean;
  adminId: string | null;
  createdAt: string;
};

export type Order = {
  id?: string;
  orderNumber: string;
  customerId?: string | null;
  status: string;
  paymentStatus: string;
  paymentProvider: string;
  paymentReference?: string | null;
  email: string;
  customerName: string;
  phone: string | null;
  currency: string;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  taxCents: number;
  totalCents: number;
  refundedCents: number;
  couponCode: string | null;
  shippingMethod: string;
  shippingAddress: unknown;
  billingAddress: unknown;
  shippingExplanation: string;
  taxExplanation: string;
  taxState: string | null;
  taxRateBps: number | null;
  deliveryNote: string | null;
  substitutionPreference: string | null;
  trackingNumber: string | null;
  trackingCarrier: string | null;
  reviewRequired?: boolean;
  stockReturned?: boolean;
  reservationExpiresAt?: string | null;
  paidAt: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  items: OrderItem[];
  notes: OrderNote[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  level: number;
  sortOrder: number;
  imageUrl: string | null;
  imagePublicId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  children: Category[];
};

export type Tag = {
  id: string;
  name: string;
  slug: string;
  createdAt?: string;
};

export type ProductImage = {
  id: string;
  productId: string;
  url: string;
  publicId: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
  createdAt: string;
};

export type Variant = {
  id: string;
  productId: string;
  sku: string;
  barcode: string | null;
  options: Record<string, string>;
  title: string;
  priceCents: number | null;
  shippingWeightOz: number | string | null;
  netWeightOz: number | string | null;
  quantityAvailable: number;
  quantityReserved: number;
  quantityIncoming: number;
  lowStockThreshold: number;
  reorderPoint: number;
  reorderQuantity: number;
  warehouseLocation: string | null;
  isActive: boolean;
  imageUrl: string | null;
  onHand?: number;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  needsReorder?: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string | null;
  shortDescription: string | null;
  description: string | null;
  brand: string | null;
  countryOfOrigin: string;
  region: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  costCents?: number | null;
  status: string;
  isActive: boolean;
  isFeatured: boolean;
  storageType: string;
  perishable: boolean;
  shelfLifeDays: number | null;
  netWeightOz: number | null;
  shippingWeightOz: number;
  unitLabel: string;
  ingredients: string | null;
  allergenFlags: string[];
  dietaryTags: string[];
  attributes: Record<string, string | number | boolean> | null;
  metaTitle: string | null;
  metaDescription: string | null;
  category: { id: string; name: string; slug: string };
  tags: Tag[];
  images: ProductImage[];
  variants: Variant[];
  inventory: (LowStockItem & { id: string; notes?: string | null }) | null;
  ratingAverage: number | null;
  ratingCount: number;
  createdAt: string;
  updatedAt: string;
};

export type Coupon = {
  id: string;
  code: string;
  type: 'percent' | 'fixed_cents';
  value: number;
  minSubtotalCents: number;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Banner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  imagePublicId: string | null;
  linkUrl: string | null;
  sortOrder: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RateMethod = { baseCents: number; perPoundCents: number };
export type RateZone = { standard: RateMethod; expedited: RateMethod; overnight: RateMethod | null };

export type Settings = {
  id: string;
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  freeShippingThresholdCents: number;
  coldPackSurchargeCents: number;
  announcementBar: string | null;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
  };
  defaultMetaTitle: string | null;
  defaultMetaDescription: string | null;
  shippingRates: {
    contiguous: RateZone;
    ak_hi: RateZone;
    territories: RateZone;
  };
  taxFlatRateBps: number;
  updatedAt: string;
};

export type Review = {
  id: string;
  productId: string;
  customerId: string;
  orderId: string;
  rating: number;
  title: string;
  body: string;
  isHidden: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  bodyHtml: string;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
  status: 'draft' | 'published' | 'archived';
  metaTitle: string | null;
  metaDescription: string | null;
  authorId: string;
  categoryId: string | null;
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  author?: { id: string; name: string };
  category?: { id: string; name: string; slug: string; description?: string | null } | null;
  tags?: { tagId: string; tag: { id: string; name: string; slug: string } }[];
};

export type BlogCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogTag = { id: string; name: string; slug: string };

export type BlogComment = {
  id: string;
  postId: string;
  name: string;
  email: string;
  body: string;
  isHidden: boolean;
  createdAt: string;
};

export type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata: unknown;
  createdAt: string;
  admin: { email: string; name: string };
};

export type StoredImage = { url: string; publicId: string };

export const ORDER_STATUSES = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
export const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded', 'partially_refunded'] as const;
export const PRODUCT_STATUSES = ['available', 'out_of_stock', 'discontinued', 'coming_soon'] as const;
export const REGIONS = ['west_africa', 'east_africa', 'southern_africa', 'north_africa', 'pan_african'] as const;
export const STORAGE = ['ambient', 'refrigerated', 'frozen'] as const;
export const UNITS = ['each', 'pack', 'bag', 'jar', 'can', 'bottle', 'lb'] as const;
export const ALLERGENS = ['milk', 'eggs', 'fish', 'shellfish', 'tree_nuts', 'peanuts', 'wheat', 'soybeans', 'sesame'] as const;
export const DIETARY = ['halal', 'vegetarian', 'vegan', 'gluten_free', 'spicy'] as const;
export const ADJUSTMENT_REASONS = [
  'damaged',
  'lost',
  'expired',
  'quality_issue',
  'inventory_count',
  'returned_to_supplier',
  'sample',
  'write_off',
  'other',
] as const;
export const CARRIERS = ['usps', 'ups', 'fedex', 'other'] as const;
export const BLOG_STATUSES = ['draft', 'published', 'archived'] as const;

export const STATUS_MOVES: Record<string, Array<'cancelled' | 'shipped' | 'delivered'>> = {
  pending: ['cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
};
