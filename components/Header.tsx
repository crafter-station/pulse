"use client";

import { CrafterStationLogo } from "./icons/CrafterStationLogo";
import { GitHubLogo } from "./icons/GitHubLogo";
import { MobileMenu, navItems } from "./MobileMenu";
import { useState } from "react";

const MENU_ID = "mobile-menu";

export function Header() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="fixed top-0 left-0 right-0 z-50 border-b border-dark-border-subtle bg-dark/90 backdrop-blur-sm pt-[env(safe-area-inset-top)]">
			<div className="mx-auto max-w-7xl h-14 md:h-16 px-4 sm:px-5 md:px-6 flex items-center justify-between">
				<a
					href="/"
					className="flex items-center gap-2 md:gap-3 shrink-0 touch-manipulation"
					aria-label="Pulse home"
				>
					<div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-dark-elevated border border-dark-border rounded-sm shrink-0">
						<CrafterStationLogo className="w-4 h-4 md:w-5 md:h-5 text-brand" />
					</div>
					<div className="flex items-center gap-1.5 md:gap-2 min-w-0">
						<span className="font-bold text-white tracking-tight text-sm md:text-base whitespace-nowrap">
							PULSE
						</span>
						<span className="px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] font-medium bg-brand/10 text-brand border border-brand/20 rounded shrink-0 whitespace-nowrap">
							BETA
						</span>
					</div>
				</a>

				<nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
					{navItems.map((item) => (
						<a
							key={item.href}
							href={item.href}
							className="text-sm text-[#A3A3A3] hover:text-white transition-colors"
						>
							{item.label}
						</a>
					))}
					<a
						href="https://github.com/crafter-station"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-dark-elevated border border-dark-border text-white hover:border-brand/50 transition-all rounded"
					>
						<GitHubLogo className="w-4 h-4 shrink-0" />
						crafter-station
					</a>
				</nav>

				<button
					type="button"
					onClick={() => setIsOpen((o) => !o)}
					aria-expanded={isOpen}
					aria-controls={MENU_ID}
					aria-label={isOpen ? "Close menu" : "Open menu"}
					className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded touch-manipulation text-white hover:bg-dark-elevated transition-colors"
				>
					<span
						className={`block w-5 h-0.5 bg-current rounded-full transition-all duration-200 ${
							isOpen ? "rotate-45 translate-y-1.5" : ""
						}`}
					/>
					<span
						className={`block w-5 h-0.5 bg-current rounded-full my-1 transition-opacity duration-200 ${
							isOpen ? "opacity-0" : ""
						}`}
					/>
					<span
						className={`block w-5 h-0.5 bg-current rounded-full transition-all duration-200 ${
							isOpen ? "-rotate-45 -translate-y-1.5" : ""
						}`}
					/>
				</button>
			</div>

			<MobileMenu isOpen={isOpen} onClose={() => setIsOpen(false)} menuId={MENU_ID} />
		</header>
	);
}
