export type CatalogProduct = {
  id: string;
  name: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  priceFrom: string | number;
  priceUnit: string;
  tag: string | null;
  tagColor: string | null;
  images: string[];
  popular: boolean;
};

export type QuoteItem = {
  productId: string;
  config: Record<string, any>;
  totalQty: number | null;
  sizeBreakdown: Record<string, number> | null;
};
