import React from 'react';
import { ArrowLeft, Search, Compass } from 'lucide-react';

export default function NotFoundPage({
  onNavigateHome,
  onNavigateCollection,
  onOpenSearch
}) {
  return (
    <div className="w-full min-h-[70vh] bg-white text-[#111827] flex flex-col items-center justify-center px-5 sm:px-8 py-20 text-center">
      <span className="text-[12px] font-bold tracking-[0.25em] text-[#79867D] uppercase mb-3">
        ERROR 404
      </span>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-[#003F25] uppercase tracking-tight mb-4">
        ARCHIVE PIECE NOT FOUND
      </h1>
      <p className="text-[14px] text-[#4B5563] max-w-md mx-auto mb-8 leading-relaxed">
        The streetwear cut or archive route you were looking for has either been claimed from our Coimbatore showroom or does not exist.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
        <button
          onClick={onNavigateHome}
          className="flex-1 py-3.5 bg-[#003F25] hover:bg-[#002e1b] text-white text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Return to Home</span>
        </button>

        <button
          onClick={onNavigateCollection}
          className="flex-1 py-3.5 border border-[#003F25] text-[#003F25] hover:bg-[#F9FAF9] text-[12px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Compass size={14} />
          <span>Explore Archive</span>
        </button>
      </div>

      <button
        onClick={onOpenSearch}
        className="mt-8 text-[12px] text-[#79867D] hover:text-[#003F25] flex items-center gap-1.5 underline cursor-pointer"
      >
        <Search size={13} />
        <span>Search the full catalog</span>
      </button>
    </div>
  );
}
