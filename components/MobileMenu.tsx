"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { GitHubLogo } from "./icons/GitHubLogo";

const navItems = [
  { href: "/#activity", label: "Activity" },
  { href: "/#leaderboard", label: "Leaderboard" },
  { href: "/#repositories", label: "Repositories" },
  { href: "/#analytics", label: "Analytics" },
] as const;

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  menuId: string;
}

export function MobileMenu({ isOpen, onClose, menuId }: MobileMenuProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  const menuContent = (
    <div
      id={menuId}
      className={`md:hidden fixed inset-0 top-[calc(3.5rem+env(safe-area-inset-top))] z-[100] transition-opacity duration-200 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close menu"
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />
      <div
        className={`absolute top-0 right-0 w-full max-w-xs h-full bg-[#141414] border-l border-[#333] shadow-2xl transition-transform duration-200 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <nav
          className="flex flex-col p-4 gap-0.5"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="block py-3.5 px-4 text-base text-[#E5E5E5] hover:text-white hover:bg-white/5 rounded-lg transition-colors touch-manipulation active:bg-white/10"
            >
              {item.label}
            </a>
          ))}
          <div className="my-2 h-px bg-[#262626]" aria-hidden />
          <a
            href="https://github.com/crafter-station"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center gap-2.5 py-3.5 px-4 text-base font-medium bg-brand/10 border border-brand/30 text-brand hover:bg-brand/20 hover:border-brand/50 rounded-lg transition-colors touch-manipulation"
          >
            <GitHubLogo className="w-5 h-5 shrink-0" />
            crafter-station
          </a>
        </nav>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(menuContent, document.body);
}

export { navItems };
