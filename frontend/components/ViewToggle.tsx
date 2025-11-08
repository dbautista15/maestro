'use client';

import { Zap, Shield } from 'lucide-react';

interface ViewToggleProps {
  currentView: 'performance' | 'reliability';
  onToggle: (view: 'performance' | 'reliability') => void;
}

export default function ViewToggle({ currentView, onToggle }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
      <button
        onClick={() => onToggle('performance')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
          currentView === 'performance'
            ? 'bg-white text-blue-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Zap size={18} />
        Performance View
      </button>
      <button
        onClick={() => onToggle('reliability')}
        className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
          currentView === 'reliability'
            ? 'bg-white text-green-600 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <Shield size={18} />
        Reliability View
      </button>
    </div>
  );
}