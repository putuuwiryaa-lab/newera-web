import React, { useState, useEffect, useRef } from 'react';
import type { Market } from '../engine/types';
import { Search, ChevronDown, Check, Globe, X } from 'lucide-react';

interface MarketSelectorProps {
  markets: Market[];
  selectedMarketId: string;
  onSelectMarket: (marketId: string) => void;
}

const PRIORITY_IDS = [
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedMarket = markets.find((m) => m.id === selectedMarketId) || markets[0];

  const filteredMarkets = markets.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase())
  );

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
    <div className="space-y-2.5" ref={dropdownRef}>
      {/* Baris Pasaran Utama (Quick Tabs) */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        <span className="text-[11px] text-gray-500 font-semibold px-1 flex items-center shrink-0">
          <Globe className="w-3.5 h-3.5 mr-1 text-emerald-400" />
          Populer:
        </span>
        {PRIORITY_IDS.map((id) => {
          const m = markets.find((item) => item.id === id);
          if (!m) return null;
          const isSelected = m.id === selectedMarketId;
          return (
            <button
              key={m.id}
              onClick={() => onSelectMarket(m.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-gray-950 font-bold shadow-md shadow-emerald-500/25 scale-[1.02]'
                  : 'bg-gray-900/90 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800/80 hover:border-gray-700'
              }`}
            >
              {m.name}
            </button>
          );
        })}
      </div>

      {/* Dropdown Selector Lengkap (64 Pasaran) */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-900/95 hover:bg-gray-900 border border-gray-800 hover:border-emerald-500/40 rounded-2xl text-left transition-all shadow-lg shadow-black/20 group"
        >
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-gray-500">
                Pasaran Aktif:
              </div>
              <div className="font-extrabold text-white tracking-wide text-base group-hover:text-emerald-300 transition-colors">
                {selectedMarket ? selectedMarket.name : 'Pilih Pasaran'}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2.5">
            <span className="text-[11px] px-2.5 py-1 bg-gray-950/80 border border-gray-800 rounded-lg text-emerald-400 font-mono font-semibold">
              {selectedMarket ? selectedMarket.history_data.split(/\s+/).length : 0} Data Result
            </span>
            <div className={`p-1.5 rounded-lg bg-gray-800/60 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-white' : ''}`}>
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </button>

        {/* Dropdown Menu Modal/Overlay */}
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 z-50 bg-gray-900/95 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl animate-in fade-in duration-150 ring-1 ring-white/10">
            <div className="p-3 border-b border-gray-800 bg-gray-950/60">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder={`Cari dari ${markets.length} pasaran resmi...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 bg-gray-900 border border-gray-800 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  autoFocus
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-800/50 scrollbar-thin">
              {filteredMarkets.length === 0 ? (
                <div className="p-6 text-xs text-gray-500 text-center">
                  Pasaran "{search}" tidak ditemukan
                </div>
              ) : (
                filteredMarkets.map((m) => {
                  const isSelected = m.id === selectedMarketId;
                  const count = m.history_data.split(/\s+/).length;
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        onSelectMarket(m.id);
                        setIsOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-gray-800/80 transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                          : 'text-gray-300'
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
                      <span className="text-[11px] font-mono text-gray-500">
                        {count} items
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
