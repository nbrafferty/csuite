"use client";

import { CatalogContent } from "./_components/catalog-content";

export default function CatalogPage() {
  return (
    <div className="-m-6 flex h-[calc(100vh-4rem)]">
      <CatalogContent />
    </div>
  );
}
