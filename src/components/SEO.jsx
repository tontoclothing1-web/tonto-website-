import { useEffect } from 'react';
import { getPageMetadata, applySEO } from '../lib/seo';

/**
 * Headless SEO Component that dynamically manages document title,
 * meta description, canonical, OpenGraph, and Schema.org JSON-LD.
 */
export default function SEO({
  view,
  category,
  product,
  look,
  policyTab
}) {
  useEffect(() => {
    const metadata = getPageMetadata(view, {
      category,
      product,
      look,
      policyTab
    });
    applySEO(metadata);
  }, [view, category, product, look, policyTab]);

  return null;
}
