import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ArrowUpRight, 
  Scissors, 
  Layers, 
  Factory, 
  Sparkles, 
  Check, 
  Eye, 
  Compass,
  Tag,
  ShoppingBag,
  X
} from 'lucide-react';
import { PRODUCTS } from '../data/products';

export default function AboutUsPage({ 
  products = PRODUCTS,
  onOpenProduct,
  onQuickView,
  onNavigateHome, 
  onNavigateCollection, 
  onNavigateVisit, 
  onNavigateLookbook,
  aboutMedia
}) {
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState('All');
  const [activeModalArticle, setActiveModalArticle] = useState(null);

  // Gallery items featuring real TONTO garments, textures, and atelier details
  const galleryArticles = [
    {
      id: 'tonto-studios-waffle-black',
      code: 'ARTICLE 01',
      title: 'TONTO Waffle Longsleeve',
      category: 'Knits',
      badge: 'Signature Knit',
      image: '/assets/products/tonto-studios-waffle-black-front.jpg',
      altImage: '/assets/products/tonto-studios-waffle-black-back.jpg',
      material: '360 GSM Heavy Waffle Knit • Contrast Camo Raglan',
      desc: 'Engineered with custom-spun thermal waffle texture and cursive TONTO back embroidery. Drop-shoulder drape that maintains its boxy presence.',
      price: '₹2,490'
    },
    {
      id: 'distressed-chain-print-denim',
      code: 'ARTICLE 02',
      title: 'Chain-Graffiti Baggy Denim',
      category: 'Denim',
      badge: 'Architectural Denim',
      image: '/assets/products/chain-print-denim-detail.jpg',
      altImage: '/assets/editorial/editorial-brutalist-full.jpg',
      material: '14oz Ring-Spun Twill • Custom Chain Graffiti Artwork',
      desc: 'Architectural baggy cut washed to a vintage weathered grey. Stacked hem opening engineered specifically for chunky streetwear silhouettes.',
      price: '₹3,290'
    },
    {
      id: 'sportswear-archive-sweatshirt-navy',
      code: 'ARTICLE 03',
      title: 'Sportswear Archive 1998 Crewneck',
      category: 'Layers',
      badge: 'French Terry Fleece',
      image: '/assets/products/sportswear-sweatshirt-navy-flat1.jpg',
      altImage: '/assets/products/sportswear-sweatshirt-navy-flat2.jpg',
      material: '450 GSM Heavy Loopback Cotton • Forest & Navy Colorblock',
      desc: 'Substantial French terry crewneck with authentic retro panelling, dense ribbed trims, and an oversized slouch that stays structured.',
      price: '₹2,800'
    },
    {
      id: 'sun-faded-denim-workshirt',
      code: 'ARTICLE 04',
      title: 'Sun-Faded Denim Overshirt',
      category: 'Layers',
      badge: 'Vintage Wash',
      image: '/assets/products/sun-faded-denim-shirt-flat.jpg',
      altImage: '/assets/products/black-denim-shirt-flared-jeans.jpg',
      material: '100% Cotton Bleach Wash • Mother-of-Pearl Fasteners',
      desc: 'Authentic sun-faded patina crafted through gentle ozone softening. Designed with a clean camp collar and relaxed workwear drape.',
      price: '₹2,800'
    },
    {
      id: 'tonto-archive-brand-hangtags',
      code: 'ARTICLE 05',
      title: 'Custom Damask Woven Labeling',
      category: 'Trims',
      badge: 'Proprietary Trim',
      image: '/assets/branding/tonto-tags.jpg',
      altImage: '/assets/products/tonto-tags.jpg',
      material: 'High-Density Damask Woven Jacquard • Industrial Seal Strings',
      desc: 'Every TONTO piece is finished with proprietary woven labels, reinforced neck bindings, and serial batch tags hand-attached in Coimbatore.',
      price: 'Atelier Detail'
    },
    {
      id: 'extra-wide-denim',
      code: 'ARTICLE 06',
      title: 'Extra Wide Denim - Washed Blue',
      category: 'Denim',
      badge: 'Wide Leg Cut',
      image: '/assets/products/extra-wide-denim.jpg',
      altImage: '/assets/products/extra-wide-denim-alt.jpg',
      material: 'Heavyweight Washed Denim • Metallic Chain Hardware',
      desc: 'Generous wide leg flare with natural knee stacking and authentic vintage wash fading. Built for effortless daily wear.',
      price: '₹3,290'
    }
  ];

  const filteredGallery = selectedGalleryCategory === 'All'
    ? galleryArticles
    : galleryArticles.filter(item => item.category === selectedGalleryCategory);

  const handleArticleClick = (item) => {
    const foundProduct = products.find(p => p.id === item.id || p.slug === item.id);
    if (foundProduct && onOpenProduct) {
      onOpenProduct(foundProduct);
    } else {
      setActiveModalArticle(item);
    }
  };

  const handleQuickViewArticle = (e, item) => {
    e.stopPropagation();
    const foundProduct = products.find(p => p.id === item.id || p.slug === item.id);
    if (foundProduct && onQuickView) {
      onQuickView(foundProduct);
    } else {
      setActiveModalArticle(item);
    }
  };

  return (
    <div className="w-full bg-white text-[#111111] pb-24 text-left font-['Futura_PT_Book',sans-serif]">
      
      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="max-w-[1600px] mx-auto px-5 sm:px-8 py-3 text-[12px] text-[#79867D] flex items-center justify-between border-b border-[#EAEAEA]">
        <ol className="flex items-center gap-1.5 list-none p-0 m-0" itemscope itemtype="https://schema.org/BreadcrumbList">
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem" className="flex items-center gap-1">
            <button
              onClick={onNavigateHome}
              className="hover:text-[#003F25] transition-colors cursor-pointer flex items-center gap-1 font-medium lowercase"
              itemprop="item"
            >
              <ArrowLeft size={13} />
              <span itemprop="name">home</span>
            </button>
            <meta itemprop="position" content="1" />
            <span className="text-[#D1D5DB]">/</span>
          </li>
          <li itemprop="itemListElement" itemscope itemtype="https://schema.org/ListItem">
            <span className="text-[#003F25] font-semibold lowercase" itemprop="name">about us</span>
            <meta itemprop="position" content="2" />
          </li>
        </ol>

        <button
          onClick={onNavigateCollection}
          className="hover:text-[#003F25] transition-colors text-[11.5px] font-bold tracking-wider uppercase underline underline-offset-4 cursor-pointer"
        >
          View Collection
        </button>
      </nav>

      {/* 2. Simple Page Title Header */}
      <div className="w-full max-w-[1600px] mx-auto px-5 sm:px-8 pt-10 sm:pt-14 pb-8 text-center">
        <span className="text-[11px] font-bold tracking-[0.2em] text-[#003F25] uppercase block mb-2 font-mono">
          ATELIER MANIFESTO • COIMBATORE, INDIA
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-[0.04em] text-black uppercase mb-3">
          {aboutMedia?.headline || 'ABOUT TONTO'}
        </h1>
        <p className="text-[14px] sm:text-[15px] text-[#666666] max-w-xl mx-auto leading-relaxed">
          {aboutMedia?.description || 'Same Stories, Different People. Crafting substantial, heavyweight streetwear with brutalist drape and generational Indian textile mastery.'}
        </p>
      </div>

      {/* 3. Section: Brand Story (Clear & Direct) */}
      <section className="max-w-[1600px] mx-auto px-5 sm:px-8 py-12 sm:py-16 border-t border-b border-[#EAEAEA]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Visual Editorial Image */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] bg-[#F5F5F5] overflow-hidden border border-[#E0E5E1] shadow-xs">
              <img
                src={aboutMedia?.heroImage || '/assets/editorial/editorial-brutalist-full.jpg'}
                alt="TONTO Clothing Atelier in Coimbatore"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 text-[10.5px] font-bold text-[#003F25] uppercase tracking-wider border border-[#E0E5E1]">
                EST. COIMBATORE // 2024
              </div>
              <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-xs text-white p-3.5 border border-white/10">
                <p className="text-[11px] font-mono text-[#86EFAC] uppercase tracking-widest mb-0.5">
                  THE SOUTH INDIAN TEXTILE CAPITAL
                </p>
                <p className="text-[12.5px] font-medium leading-snug">
                  100% Combed Cotton • Architectural Unisex Cuts • Generational Spinning
                </p>
              </div>
            </div>
          </div>

          {/* Narrative: The Story of TONTO */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#003F25] block mb-2 font-mono">
                ORIGIN & PURPOSE
              </span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-black leading-tight">
                OUR BRAND STORY
              </h2>
            </div>

            <p className="text-[14.5px] sm:text-[15.5px] text-[#444444] leading-relaxed">
              Coimbatore has earned its reputation across the world as the undisputed textile capital of South India. For decades, the region’s generational spinning mills, ring-spun combed cottons, and master weavers have powered luxury brands across the globe.
            </p>

            <p className="text-[14.5px] sm:text-[15.5px] text-[#444444] leading-relaxed">
              Yet, for years, Indian streetwear culture was handed thin 160 GSM polyester blends, mass-produced merchandise drops, and inflated reseller markups. We believed our generation deserved better.
            </p>

            <p className="text-[14.5px] sm:text-[15.5px] text-[#444444] leading-relaxed">
              <strong className="text-black font-bold">TONTO was founded to reclaim that craft.</strong> We bridge the rebellious pulse of global underground streetwear—skateboarding, music, and brutalist tailoring—with the unparalleled textile density and fabric craftsmanship engineered right in our backyard.
            </p>

            {/* Blockquote */}
            <div className="p-5 sm:p-6 bg-[#F9FAF9] border-l-3 border-[#003F25] border border-[#EAEAEA] rounded-xs">
              <p className="text-[14px] sm:text-[15px] font-semibold text-[#003F25] italic leading-relaxed">
                "Same Stories, Different People. We don't make disposable fast-fashion merch. We engineer garments with physical substance, sculpted drop-shoulder drape, and honest Indian manufacturing."
              </p>
              <span className="text-[11px] text-[#79867D] uppercase font-bold tracking-wider block mt-2">
                — TONTO ATELIER LAB, COIMBATORE
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* 4. Section: Our Mission & Our Vision (Side-by-Side Architectural Cards) */}
      <section className="max-w-[1600px] mx-auto px-5 sm:px-8 py-14 sm:py-20 border-b border-[#EAEAEA]">
        <div className="text-center max-w-xl mx-auto mb-10 sm:mb-14">
          <span className="text-[11px] font-bold text-[#003F25] uppercase tracking-[0.2em] block mb-1.5 font-mono">
            GUIDING PRINCIPLES
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-black">
            OUR MISSION & VISION
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
          
          {/* Mission Card */}
          <div className="p-8 sm:p-10 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs space-y-5 text-left relative overflow-hidden group hover:border-[#003F25] transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E5E1]">
              <span className="text-[11px] font-mono font-bold text-[#003F25] tracking-widest uppercase">
                STATEMENT 01 // MISSION
              </span>
              <div className="w-7 h-7 rounded-full bg-[#003F25] text-white flex items-center justify-center text-[12px] font-bold">
                M
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-black uppercase tracking-tight">
              OUR MISSION
            </h3>

            <p className="text-[14px] sm:text-[15px] text-[#444444] leading-relaxed">
              To engineer substantial, long-lasting streetwear directly from Coimbatore’s textile heartland—replacing fast-fashion flimsiness with custom 240–450+ GSM weights, anatomical boxy silhouettes, and transparent direct-to-community pricing.
            </p>

            <ul className="space-y-3 pt-2 text-[13px] text-[#222222]">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-[#003F25] shrink-0 mt-0.5" strokeWidth={2.5} />
                <span><strong>Heavyweight First:</strong> Never compromised by cheap synthetics or polyester fillers.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-[#003F25] shrink-0 mt-0.5" strokeWidth={2.5} />
                <span><strong>Architectural Drape:</strong> Engineered boxy cuts that retain structured presence wear after wear.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-[#003F25] shrink-0 mt-0.5" strokeWidth={2.5} />
                <span><strong>Honest Production:</strong> Ethical, small-batch Coimbatore manufacturing with zero deadstock waste.</span>
              </li>
            </ul>
          </div>

          {/* Vision Card */}
          <div className="p-8 sm:p-10 bg-[#F9FAF9] border border-[#E0E5E1] rounded-xs space-y-5 text-left relative overflow-hidden group hover:border-[#003F25] transition-colors">
            <div className="flex items-center justify-between pb-4 border-b border-[#E0E5E1]">
              <span className="text-[11px] font-mono font-bold text-[#003F25] tracking-widest uppercase">
                STATEMENT 02 // VISION
              </span>
              <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[12px] font-bold">
                V
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-extrabold text-black uppercase tracking-tight">
              OUR VISION
            </h3>

            <p className="text-[14px] sm:text-[15px] text-[#444444] leading-relaxed">
              To establish an independent Indian atelier recognized internationally for sculptural drop-shoulder cuts, authentic vintage wash character, and uncompromising craftsmanship that redefines modern South Asian streetwear.
            </p>

            <ul className="space-y-3 pt-2 text-[13px] text-[#222222]">
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-black shrink-0 mt-0.5" strokeWidth={2.5} />
                <span><strong>Global Recognition:</strong> Proving Indian textile mastery can lead global luxury streetwear.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-black shrink-0 mt-0.5" strokeWidth={2.5} />
                <span><strong>Timeless Grails:</strong> Designing pieces that look and feel better with age, wash, and wear.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check size={16} className="text-black shrink-0 mt-0.5" strokeWidth={2.5} />
                <span><strong>Cultural Hub:</strong> Connecting like-minded creators through art, music, and honest clothing.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* 5. Section: How an Article is Made in TONTO (Step-by-Step Crafting Journey) */}
      <section className="max-w-[1600px] mx-auto px-5 sm:px-8 py-14 sm:py-20 border-b border-[#EAEAEA]">
        <div className="text-center max-w-xl mx-auto mb-12 sm:mb-16">
          <span className="text-[11px] font-bold text-[#003F25] uppercase tracking-[0.2em] block mb-1.5 font-mono">
            FROM YARN TO FINISHED PIECE
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-black">
            HOW AN ARTICLE IS MADE IN TONTO
          </h2>
          <p className="text-[13px] sm:text-[14px] text-[#666666] mt-2 leading-relaxed">
            Every garment passes through 5 rigorous production stages in our Coimbatore ecosystem.
          </p>
        </div>

        {/* 5-Step Crafting Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-5">
          
          {/* Step 1 */}
          <div className="p-6 bg-white border border-[#E0E5E1] rounded-xs space-y-3.5 text-left hover:border-black transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-[#003F25]">01</span>
              <Layers size={18} className="text-[#003F25]" />
            </div>
            <h4 className="text-[15px] font-extrabold uppercase text-black">
              Yarn & Textile Spinning
            </h4>
            <p className="text-[12.5px] text-[#555555] leading-relaxed">
              We engineer fabrics from the fiber level. Sourcing 100% combed ring-spun cotton and knitting custom 240–450+ GSM weights (waffle thermals, dense loopback, and 14oz twill denim).
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 bg-white border border-[#E0E5E1] rounded-xs space-y-3.5 text-left hover:border-black transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-[#003F25]">02</span>
              <Scissors size={18} className="text-[#003F25]" />
            </div>
            <h4 className="text-[15px] font-extrabold uppercase text-black">
              Pattern Drafting & Cut
            </h4>
            <p className="text-[12.5px] text-[#555555] leading-relaxed">
              Drafting boxy, wide-chest proportions and calibrated drop shoulders. Every pattern is mathematically graded for fluid unisex styling and natural vertical drape.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 bg-white border border-[#E0E5E1] rounded-xs space-y-3.5 text-left hover:border-black transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-[#003F25]">03</span>
              <Factory size={18} className="text-[#003F25]" />
            </div>
            <h4 className="text-[15px] font-extrabold uppercase text-black">
              Atelier Construction
            </h4>
            <p className="text-[12.5px] text-[#555555] leading-relaxed">
              Assembled with twin-needle flatlock seams, heavy-duty bar-tacks, and 1x1 dense rib collars engineered to remain flat throughout repeated daily wear without rolling.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-6 bg-white border border-[#E0E5E1] rounded-xs space-y-3.5 text-left hover:border-black transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-[#003F25]">04</span>
              <Sparkles size={18} className="text-[#003F25]" />
            </div>
            <h4 className="text-[15px] font-extrabold uppercase text-black">
              Wash Labs & Patina
            </h4>
            <p className="text-[12.5px] text-[#555555] leading-relaxed">
              Each piece undergoes mineral stone washes, enzyme baths, and ozone softening. Mimicking decades of natural atmospheric aging to deliver an authentic lived-in patina.
            </p>
          </div>

          {/* Step 5 */}
          <div className="p-6 bg-white border border-[#E0E5E1] rounded-xs space-y-3.5 text-left hover:border-black transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-2xl font-extrabold text-[#003F25]">05</span>
              <Tag size={18} className="text-[#003F25]" />
            </div>
            <h4 className="text-[15px] font-extrabold uppercase text-black">
              Archival Finishing
            </h4>
            <p className="text-[12.5px] text-[#555555] leading-relaxed">
              Hand-attaching proprietary damask woven jacquard labels, oxidized antique metal hardware, and thorough multi-point inspection before archival packaging.
            </p>
          </div>

        </div>
      </section>

      {/* 6. Section: Article Gallery (Visual Showcase) */}
      <section className="max-w-[1600px] mx-auto px-5 sm:px-8 py-14 sm:py-20 border-b border-[#EAEAEA]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 text-left">
          <div>
            <span className="text-[11px] font-bold text-[#003F25] uppercase tracking-[0.2em] block mb-1 font-mono">
              CURATED ARCHIVE
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold uppercase tracking-tight text-black">
              ARTICLE GALLERY
            </h2>
            <p className="text-[13px] text-[#666666] mt-1">
              Explore key signatures and craftsmanship details from the TONTO archive.
            </p>
          </div>

          {/* Minimal Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Knits', 'Denim', 'Layers', 'Trims'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedGalleryCategory(cat)}
                className={`px-3 py-1 text-[11.5px] font-medium lowercase border transition-colors cursor-pointer ${
                  selectedGalleryCategory === cat
                    ? 'border-black bg-black text-white'
                    : 'border-[#D1D5DB] text-[#222222] bg-white hover:border-black'
                }`}
              >
                {cat.toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredGallery.map((article) => (
            <div
              key={article.id}
              onClick={() => handleArticleClick(article)}
              className="group flex flex-col bg-white border border-[#E0E5E1] rounded-xs overflow-hidden cursor-pointer hover:border-black hover:shadow-md transition-all text-left"
            >
              {/* Image Area */}
              <div className="relative aspect-[4/4.5] bg-[#F5F5F5] overflow-hidden">
                <img
                  src={article.image}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-103"
                  loading="lazy"
                />

                {/* Article Badge Tag */}
                <span className="absolute top-2.5 left-2.5 bg-white/95 text-black border border-[#E0E5E1] text-[10px] px-2 py-0.5 font-mono uppercase tracking-wider">
                  {article.code} • {article.badge}
                </span>

                {/* Quick View Button on Hover */}
                <button
                  type="button"
                  onClick={(e) => handleQuickViewArticle(e, article)}
                  className="absolute bottom-0 left-0 right-0 py-2.5 px-4 bg-[#003F25] text-white flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-bold uppercase tracking-wider cursor-pointer"
                >
                  <span>Quick View Article</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>

              {/* Text Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-[15px] font-bold uppercase text-black tracking-wide group-hover:text-[#003F25] transition-colors">
                    {article.title}
                  </h3>
                  <p className="text-[11.5px] font-mono text-[#003F25] uppercase tracking-wider mt-1">
                    {article.material}
                  </p>
                  <p className="text-[12.5px] text-[#555555] mt-2 leading-relaxed">
                    {article.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0F0F0] flex items-center justify-between text-[12.5px]">
                  <span className="font-bold text-black">{article.price}</span>
                  <span className="text-[11px] text-[#79867D] uppercase font-medium flex items-center gap-1 group-hover:underline">
                    <span>View Piece</span>
                    <ArrowUpRight size={12} />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6.5. Section: Frequently Asked Questions (SEO & Customer Confidence) */}
      <section className="max-w-[1600px] mx-auto px-5 sm:px-8 py-12 sm:py-16 border-t border-b border-[#EAEAEA]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-[11px] font-bold tracking-[0.2em] text-[#003F25] uppercase block mb-2 font-mono">
              CURATION & TEXTILES
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-black">
              FREQUENTLY ASKED QUESTIONS
            </h2>
            <p className="text-[13px] sm:text-[14px] text-[#666666] mt-2">
              Learn about our textile origins, curation ethos, and South Indian streetwear atelier.
            </p>
          </div>

          <div className="divide-y divide-[#EAEAEA] border border-[#EAEAEA] bg-[#FDFDFD] rounded-xs">
            <div className="p-5 sm:p-6 space-y-2">
              <h3 className="text-[14.5px] font-bold text-[#003F25] uppercase tracking-wide">
                Where is TONTO Clothing based and where are pieces crafted?
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#444444] leading-relaxed">
                TONTO is headquartered in Coimbatore, Tamil Nadu—globally celebrated as the textile engine of South India. Our physical showroom is situated Opposite Prozone Mall on Sathy Road, where every garment is inspected, hand-measured, and finished with custom woven trims.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-2">
              <h3 className="text-[14.5px] font-bold text-[#003F25] uppercase tracking-wide">
                What makes TONTO heavyweight garments different from typical streetwear?
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#444444] leading-relaxed">
                While standard market streetwear relies on thin 160–180 GSM fabrics, TONTO crafts garments using 240 to 450 GSM combed cottons and substantial thermal waffle knits. This ensures an architectural boxy drape that retains its structure wear after wear.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-2">
              <h3 className="text-[14.5px] font-bold text-[#003F25] uppercase tracking-wide">
                Are your pieces thrift, surplus, or original brand drops?
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#444444] leading-relaxed">
                We operate on a hybrid model: our curated archive contains hand-authenticated imported surplus and vintage thrift finds, while our TONTO Made collection features original cut-and-sew garments produced in limited batches.
              </p>
            </div>

            <div className="p-5 sm:p-6 space-y-2">
              <h3 className="text-[14.5px] font-bold text-[#003F25] uppercase tracking-wide">
                How do I choose the right size for the relaxed unisex fit?
              </h3>
              <p className="text-[13px] sm:text-[14px] text-[#444444] leading-relaxed">
                Our silhouettes feature intentional drop shoulders and relaxed room through the chest. We recommend choosing your normal size for the signature relaxed look, or sizing down one step if you prefer a standard tailored fit. Flat measurements are listed on every product page.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Bottom Minimal Call to Action */}
      <section className="max-w-[1600px] mx-auto px-5 sm:px-8 pt-14 sm:pt-20 text-center">
        <div className="max-w-2xl mx-auto space-y-4">
          <h3 className="text-2xl sm:text-3xl font-extrabold uppercase text-black tracking-tight">
            EXPERIENCE TONTO CRAFTSMANSHIP
          </h3>
          <p className="text-[13.5px] text-[#666666] leading-relaxed">
            Discover our curated streetwear capsules or visit our flagship Coimbatore showroom to feel the fabrics in person.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={onNavigateCollection}
              className="px-6 py-2.5 bg-black text-white hover:bg-[#222222] text-[11.5px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              Shop The Collection
            </button>
            <button
              onClick={onNavigateLookbook}
              className="px-6 py-2.5 bg-white border border-black text-black hover:bg-black hover:text-white text-[11.5px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              TONTO Made Lookbook
            </button>
            <button
              onClick={onNavigateVisit}
              className="px-6 py-2.5 bg-[#F5F5F5] text-black hover:bg-[#EAEAEA] text-[11.5px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
            >
              Visit Showroom
            </button>
          </div>
        </div>
      </section>

      {/* Modal Lightbox for Article Details (Fallback) */}
      {activeModalArticle && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setActiveModalArticle(null)}
        >
          <div 
            className="bg-white max-w-lg w-full p-6 relative rounded-xs text-left space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalArticle(null)}
              className="absolute top-4 right-4 text-black hover:opacity-70 p-1 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="aspect-[4/3] bg-gray-100 overflow-hidden">
              <img
                src={activeModalArticle.image}
                alt={activeModalArticle.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <span className="text-[11px] font-mono font-bold text-[#003F25] uppercase tracking-wider block">
                {activeModalArticle.code} • {activeModalArticle.badge}
              </span>
              <h3 className="text-xl font-extrabold uppercase text-black mt-1">
                {activeModalArticle.title}
              </h3>
              <p className="text-[12px] font-mono text-[#79867D] uppercase mt-0.5">
                {activeModalArticle.material}
              </p>
              <p className="text-[13px] text-[#444444] mt-2.5 leading-relaxed">
                {activeModalArticle.desc}
              </p>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-base font-bold text-black">{activeModalArticle.price}</span>
              <button
                onClick={() => {
                  setActiveModalArticle(null);
                  onNavigateCollection();
                }}
                className="px-4 py-2 bg-black text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#222222] cursor-pointer"
              >
                Shop in Collection
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
