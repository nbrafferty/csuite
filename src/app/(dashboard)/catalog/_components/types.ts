export type CatalogProduct = {
  id: string;
  name: string;
  sku: string | null;
  description: string | null;
  contentType: string;
  basePrice: string | number;
  pricingType: string;
  pricingRules: any;
  images: string[];
  options: any;
  vendor: { id: string; name: string } | null;
};

export type QuoteItem = {
  productId: string;
  config: Record<string, any>;
  totalQty: number | null;
  sizeBreakdown: Record<string, number> | null;
};
