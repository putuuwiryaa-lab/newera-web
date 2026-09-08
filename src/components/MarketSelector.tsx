import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Market } from '../engine/types';
import { Search, ChevronDown, Check, Sparkles, X } from 'lucide-react';

interface MarketSelectorProps {
  markets: Market[];
  selectedMarketId: string;
  onSelectMarket: (marketId: string) => void;
}

const POPULAR_IDS = [
  'SGP | Singapore',
  'Hongkong Pools',
  'Sydneypools',
  'Magnum Cambodia',
  'Bullseye',
  'Chinapools',
  'Japan',
  'Pcso',
  'Taiwan',
  'Toto Macau 23'
];

export const MarketSelector: React.FC<MarketSelectorProps> = ({
  markets,
  selectedMarketId,
  onSelectMarket
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'populer' | 'all'>('populer');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedMarket = markets.find((m) => m.id === selectedMarketId) || markets[0];

  // Ekstrak result terakhir (4D dan 2D belakang)
  const lastResultInfo = useMemo(() => {
    if (!selectedMarket || !selectedMarket.history_data) return null;
    const nums = selectedMarket.history_data.trim().split(/\s+/).filter(r => r.length === 4 && /^\d{4}$/.test(r));
    if (nums.length === 0) return null;
    const latest4D = nums[nums.length - 1];
    const latest2D = latest4D.slice(2);
    return { latest4D, latest2D, count: nums.length };
  }, [selectedMarket]);

  const filteredMarkets = useMemo(() => {
    return markets.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [markets, search]);

  // Keyboard shortcut [/] to focus search
  useEffect(() => {
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !isOpen && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen]);

  // Close on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="space-y-3" ref={dropdownRef}>
      {/* Quick Market Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center text-xs font-semibold text-slate-400 mr-1.5 shrink-0">
          <Sparkles className="w-3.5 h-3.5 mr-1 text-emerald-400" />
          <span>Pasaran:</span>
        </div>

        {/* Filter Toggle */}
        <div className="flex bg-slate-900/90 p-0.5 rounded-lg border border-white/[0.08] shrink-0 mr-2">
          <button
            onClick={() => setActiveFilter('populer')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              activeFilter === 'populer'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Populer
          </button>
          <button
            onClick={() => {
              setActiveFilter('all');
              setIsOpen(true);
            }}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
              activeFilter === 'all'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Semua ({markets.length})
          </button>
        </div>

        {/* Populer Quick Pills */}
        {POPULAR_IDS.map((id) => {
          const m = markets.find((item) => item.id === id);
          if (!m) return null;
          const isSelected = m.id === selectedMarketId;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMarket(m.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 shrink-0 ${
                isSelected
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm shadow-emerald-500/20'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-white/[0.06]'
              }`}
            >
              {m.name}
            </button>
          );
        })}
      </div>

      {/* Main Selected Market Bar & Dropdown Trigger */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3.5 bg-slate-900/80 hover:bg-slate-900 border border-white/[0.08] hover:border-white/[0.16] rounded-xl text-left transition-all shadow-sm group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/10 shrink-0" />
            <div>
              <span className="text-[10px] font-medium tracking-wider text-slate-400 uppercase">
                Pasaran Terpilih
              </span>
              <div className="font-semibold text-slate-100 text-base tracking-tight group-hover:text-emerald-300 transition-colors">
                {selectedMarket ? selectedMarket.name : 'Pilih Pasaran'}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {lastResultInfo && (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/[0.06]">
                <span className="text-[11px] text-slate-400">Result Terakhir:</span>
                <span className="font-mono text-xs font-bold text-slate-200">
                  {lastResultInfo.latest4D.slice(0, 2)}
                  <span className="text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded ml-0.5">
                    {lastResultInfo.latest2D}
                  </span>
                </span>
              </div>
            )}

            <span className="text-xs px-2.5 py-1 bg-slate-950/80 border border-white/[0.06] rounded-lg text-slate-300 font-mono">
              {lastResultInfo ? lastResultInfo.count : 0} Result
            </span>

            <div className={`p-1 rounded-md text-slate-400 group-hover:text-slate-200 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Dropdown Menu Modal/Overlay */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-slate-900/95 border border-white/[0.12] rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in duration-150">
            <div className="p-3 border-b border-white/[0.08] bg-slate-950/70 flex items-center justify-between">
              <div className="relative flex-1 mr-2">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder={`Cari dari ${markets.length} pasaran resmi...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-white/[0.1] rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded border border-white/[0.06]">
                Esc untuk tutup
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-white/[0.04] scrollbar-thin">
              {filteredMarkets.length === 0 ? (
                <div className="p-6 text-xs text-slate-400 text-center">
                  Pasaran "{search}" tidak ditemukan
                </div>
              ) : (
                filteredMarkets.map((m) => {
                  const isSelected = m.id === selectedMarketId;
                  const count = m.history_data.trim().split(/\s+/).filter(Boolean).length;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectMarket(m.id);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-slate-800/70 transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                          : 'text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        {isSelected ? (
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <div className="w-4 h-4 shrink-0" />
                        )}
                        <span className="text-xs">{m.name}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {count} data
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
