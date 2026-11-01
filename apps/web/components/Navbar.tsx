'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  Volume2,
  VolumeX,
  HelpCircle,
  Command,
  BookOpen,
  Layers,
  Terminal,
  Info,
  Play
} from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { ShortcutsHelpModal } from './ShortcutsHelpModal';

interface NavbarProps {
  onOpenShortcuts?: () => void;
  onOpenCommandPalette?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export function Navbar({
  onOpenShortcuts,
  onOpenCommandPalette,
  soundEnabled,
  onToggleSound
}: NavbarProps) {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [internalCommandPaletteOpen, setInternalCommandPaletteOpen] = useState(false);
  const [internalShortcutsOpen, setInternalShortcutsOpen] = useState(false);

  const handleOpenCommandPalette = () => {
    if (onOpenCommandPalette) {
      onOpenCommandPalette();
    } else {
      setInternalCommandPaletteOpen(true);
    }
  };

  const handleOpenShortcuts = () => {
    if (onOpenShortcuts) {
      onOpenShortcuts();
    } else {
      setInternalShortcutsOpen(true);
    }
  };

  // Keyboard shortcut listener for pages where Navbar manages modals
  useEffect(() => {
    if (onOpenCommandPalette) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setInternalCommandPaletteOpen((prev) => !prev);
      } else if (e.key === '?') {
        e.preventDefault();
        setInternalShortcutsOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenCommandPalette]);

  useEffect(() => {
    // Respect system preference or saved theme
    const saved = localStorage.getItem('theme') as 'dark' | 'light' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial = saved || (prefersDark ? 'dark' : 'light');
    setTheme(initial);
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    }
  };

  const navLinks = [
    { href: '/', label: 'Simulation Workbench', icon: Terminal },
    { href: '/compare', label: 'Entanglement Comparison', icon: Layers },
    { href: '/learn', label: 'Learn Protocol', icon: BookOpen },
    { href: '/about', label: 'About', icon: Info }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0B0E14]/90 backdrop-blur-md dark:bg-[#0B0E14]/90 dark:border-white/10 light:bg-white/90 light:border-black/10 transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand & Animated Entangled Glyph */}
        <div className="flex items-center gap-4">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 group-hover:border-cyan-400 transition-colors">
              {/* Entangled dots glyph */}
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none">
                <circle cx="8" cy="12" r="3" className="fill-rose-500 animate-pulse" />
                <circle cx="16" cy="12" r="3" className="fill-sky-400 animate-pulse" style={{ animationDelay: '500ms' }} />
                <path
                  d="M10.5 12C11.5 10.5 12.5 10.5 13.5 12"
                  stroke="#22D3EE"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm tracking-tight text-white dark:text-white light:text-zinc-900">
                  Quantum Superdense Coding
                </span>
                <span className="rounded-full bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono text-cyan-400">
                  Ideal Simulator
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 dark:text-zinc-400 light:text-zinc-500 hidden sm:block">
                Alice sends 1 qubit &rarr; Bob recovers 2 classical bits
              </p>
            </div>
          </Link>
        </div>

        {/* Center: Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/60 dark:bg-zinc-900/60 light:bg-zinc-100 p-1 rounded-xl border border-white/5 dark:border-white/5 light:border-black/5" aria-label="Main Navigation">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : 'text-zinc-400 hover:text-white dark:hover:text-white light:text-zinc-600 light:hover:text-zinc-900 hover:bg-white/5'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Direct Run Simulation Link Button */}
          {pathname !== '/' ? (
            <Link
              href="/?tab=workbench&run=true"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold shadow-md shadow-cyan-500/20 active:scale-[0.98] transition-all"
              aria-label="Run Simulation"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Simulation</span>
            </Link>
          ) : (
            <Link
              href="/?tab=workbench&run=true"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-semibold active:scale-[0.98] transition-all"
              aria-label="Run Simulation"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Simulation</span>
            </Link>
          )}

          {/* Command Palette button */}
          <button
            onClick={handleOpenCommandPalette}
            type="button"
            className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 border border-white/10 text-xs text-zinc-400 hover:text-white hover:border-white/20 transition-all"
            aria-label="Command Palette ⌘K"
            title="Command Palette (Ctrl+K / ⌘K)"
          >
            <Command className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-mono text-[11px]">⌘K</span>
          </button>

          {/* Sound toggle */}
          <button
            onClick={onToggleSound}
            type="button"
            className={`p-2 rounded-lg border transition-all ${
              soundEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-zinc-900/60 border-white/10 text-zinc-400 hover:text-white'
            }`}
            aria-label={soundEnabled ? 'Disable audio feedback' : 'Enable audio feedback'}
            title={soundEnabled ? 'Sound FX Enabled (Click on step)' : 'Sound FX Muted'}
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            type="button"
            className="p-2 rounded-lg bg-zinc-900/60 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
            aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-indigo-400" />}
          </button>

          {/* Keyboard shortcuts (?) button */}
          <button
            onClick={handleOpenShortcuts}
            type="button"
            className="p-2 rounded-lg bg-zinc-900/60 border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
            aria-label="Keyboard shortcuts (?)"
            title="Keyboard shortcuts (?)"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Render Command Palette and Shortcuts Modal when Navbar operates autonomously */}
      {!onOpenCommandPalette && (
        <CommandPalette
          isOpen={internalCommandPaletteOpen}
          onClose={() => setInternalCommandPaletteOpen(false)}
        />
      )}
      {!onOpenShortcuts && (
        <ShortcutsHelpModal
          isOpen={internalShortcutsOpen}
          onClose={() => setInternalShortcutsOpen(false)}
        />
      )}
    </header>
  );
}
