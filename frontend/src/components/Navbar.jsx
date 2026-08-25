import React, { useEffect, useState } from 'react';
import { Menu, Moon, RefreshCw, ShieldAlert, Sun, X } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

const NAV_LINKS = [
  { href: '#overview', id: 'overview', label: 'Overview' },
  { href: '#map', id: 'map', label: 'Map' },
  { href: '#feed', id: 'feed', label: 'Feed' },
  { href: '#about', id: 'about', label: 'About' },
];

const GitHubIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.6-4-1.6-.5-1.4-1.3-1.8-1.3-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3z" />
  </svg>
);

const GITHUB_URL = 'https://github.com/muskanv26/national-weather-intelligence';

const linkClass = (active) =>
  `font-mono text-[13px] transition-colors ${
    active
      ? 'text-ink underline decoration-ink decoration-1 underline-offset-[6px]'
      : 'text-mute hover:text-ink hover:underline hover:decoration-hair hover:underline-offset-[6px]'
  }`;

export const Navbar = ({ onRefresh }) => {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState('overview');

  useEffect(() => {
    const ids = NAV_LINKS.map((link) => link.id);
    const nodes = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean);

    if (nodes.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      { rootMargin: '-20% 0px -65% 0px', threshold: [0, 0.15, 0.35, 0.6] }
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const closeMenu = () => setOpen(false);

  const actions = (
    <>
      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 font-mono text-[13px] text-mute hover:text-ink"
      >
        <GitHubIcon size={14} />
        GitHub
      </a>
      <button
        type="button"
        onClick={onRefresh}
        className="btn-secondary h-8 w-8 px-0"
        title="Refresh weather data"
      >
        <RefreshCw size={14} />
      </button>
      <button
        type="button"
        onClick={toggleTheme}
        className="btn-secondary h-8 w-8 px-0"
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
      </button>
    </>
  );

  return (
    <nav className="sticky top-0 z-[2000] bg-page/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-6">
        <a href="#overview" className="flex min-w-0 items-center gap-2.5 text-ink" onClick={closeMenu}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-ink">
            <ShieldAlert size={14} />
          </span>
          <span className="truncate font-mono text-[13px] tracking-tight">
            National Weather Intelligence
          </span>
        </a>

        <div className="hidden items-center gap-6 md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.id} href={link.href} className={linkClass(activeId === link.id)}>
              {link.label}
            </a>
          ))}
          <div className="flex items-center gap-3 pl-2">{actions}</div>
        </div>

        <button
          type="button"
          className="btn-secondary h-8 w-8 px-0 md:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X size={14} /> : <Menu size={14} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-hair px-6 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map((link) => (
              <a
                key={link.id}
                href={link.href}
                className={linkClass(activeId === link.id)}
                onClick={closeMenu}
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex flex-wrap items-center gap-3">{actions}</div>
          </div>
        </div>
      )}

      <div
        className="flex h-[3px] w-full"
        aria-hidden="true"
        title="India tricolor"
      >
        <span className="h-full flex-1 bg-[#FF9933]" />
        <span className="h-full flex-1 bg-white" />
        <span className="h-full flex-1 bg-[#138808]" />
      </div>
    </nav>
  );
};

export default Navbar;
