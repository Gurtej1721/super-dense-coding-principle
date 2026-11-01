'use client';

import React, { useRef } from 'react';
import { Message } from '@quantum/contracts';
import { KeyRound, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

interface MessageSelectorProps {
  selectedMessage: Message;
  onSelect: (msg: Message) => void;
  disabled?: boolean;
}

interface MessageCardConfig {
  msg: Message;
  gateSymbol: string;
  gateLabel: string;
  effect: string;
}

const MESSAGES: MessageCardConfig[] = [
  {
    msg: '00',
    gateSymbol: 'I',
    gateLabel: 'Identity',
    effect: 'Preserves |Φ+⟩ state'
  },
  {
    msg: '01',
    gateSymbol: 'X',
    gateLabel: 'Pauli-X (Bit Flip)',
    effect: 'Maps |Φ+⟩ to |Ψ+⟩'
  },
  {
    msg: '10',
    gateSymbol: 'Z',
    gateLabel: 'Pauli-Z (Phase Flip)',
    effect: 'Maps |Φ+⟩ to |Φ-⟩'
  },
  {
    msg: '11',
    gateSymbol: 'XZ',
    gateLabel: 'Pauli-X · Pauli-Z',
    effect: 'Maps |Φ+⟩ to -|Ψ-⟩'
  }
];

export function MessageSelector({
  selectedMessage,
  onSelect,
  disabled = false
}: MessageSelectorProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (disabled) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % MESSAGES.length;
      onSelect(MESSAGES[nextIndex].msg);
      buttonRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + MESSAGES.length) % MESSAGES.length;
      onSelect(MESSAGES[prevIndex].msg);
      buttonRefs.current[prevIndex]?.focus();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
          <KeyRound className="h-3.5 w-3.5 text-rose-400" />
          <span>Alice&apos;s Classical Message to Transmit</span>
        </label>
        <Link
          href="/compare"
          className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
        >
          <ArrowRightLeft className="h-3 w-3" />
          <span>Compare All 4</span>
        </Link>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
        role="radiogroup"
        aria-label="Select classical message"
      >
        {MESSAGES.map((item, idx) => {
          const isSelected = selectedMessage === item.msg;
          return (
            <button
              key={item.msg}
              ref={(el) => { buttonRefs.current[idx] = el; }}
              role="radio"
              aria-checked={isSelected}
              tabIndex={isSelected ? 0 : -1}
              disabled={disabled}
              onClick={() => onSelect(item.msg)}
              onKeyDown={(e) => handleKeyDown(e, idx)}
              className={`relative flex flex-col p-3 rounded-xl border text-left transition-all duration-200 select-none ${
                isSelected
                  ? 'bg-rose-500/10 border-rose-500 shadow-md shadow-rose-500/10 ring-1 ring-rose-500 scale-[1.02]'
                  : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-800/50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer active:scale-[0.98]'}`}
            >
              {/* Bit string */}
              <div className="flex items-center justify-between w-full mb-1">
                <span
                  className={`font-mono text-2xl font-bold tracking-tight ${
                    isSelected ? 'text-rose-400' : 'text-zinc-200'
                  }`}
                >
                  {item.msg}
                </span>
                <span
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                    isSelected
                      ? 'bg-zinc-950 text-rose-300 border-rose-500'
                      : 'bg-zinc-900 text-zinc-300 border-white/10'
                  }`}
                >
                  {item.gateSymbol}
                </span>
              </div>

              {/* Gate name */}
              <div className="text-xs font-medium text-zinc-300 truncate">
                {item.gateLabel}
              </div>

              {/* Sub description */}
              <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                {item.effect}
              </div>

              {/* Selection indicator pill */}
              {isSelected && (
                <div className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] text-white">
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
