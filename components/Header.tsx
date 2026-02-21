import { CrafterStationLogo } from "./icons/CrafterStationLogo";
import { GitHubLogo } from "./icons/GitHubLogo";

export function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 border-b-2 border-[#333] bg-[#0A0A0A]/95 backdrop-blur-sm">
			<div className="mx-auto max-w-7xl h-16 px-4 md:px-6 flex items-center justify-between">
				<div className="flex items-center gap-2 md:gap-3">
					<div className="w-8 h-8 md:w-9 md:h-9 flex items-center justify-center bg-[#171717] border-2 border-[#333]">
						<CrafterStationLogo className="w-4 h-4 md:w-5 md:h-5 text-[#FFD800]" />
					</div>
					<div className="flex items-center gap-1.5 md:gap-2">
						<span className="font-display font-black text-white tracking-tight text-sm md:text-base uppercase">PULSE</span>
						<span className="px-1.5 md:px-2 py-0.5 text-[9px] md:text-[10px] font-bold bg-[#FFD800] text-[#0A0A0A] border-2 border-[#FFD800] uppercase tracking-widest">
							BETA
						</span>
					</div>
				</div>
				<nav className="flex items-center gap-3 md:gap-6">
					<a
						href="#activity"
						className="text-xs md:text-sm text-[#737373] hover:text-white transition-colors font-bold uppercase tracking-wider"
					>
						[Activity]
					</a>
					<a
						href="#analytics"
						className="text-xs md:text-sm text-[#737373] hover:text-white transition-colors font-bold uppercase tracking-wider"
					>
						[Analytics]
					</a>
					<a
						href="#leaderboard"
						className="text-xs md:text-sm text-[#737373] hover:text-white transition-colors font-bold uppercase tracking-wider"
					>
						[Leaderboard]
					</a>
					<a
						href="https://github.com/crafter-station"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 text-xs md:text-sm font-bold bg-[#171717] border-2 border-[#333] text-white hover:border-[#FFD800]/50 transition-all uppercase tracking-wider"
					>
						<GitHubLogo className="w-3.5 h-3.5 md:w-4 md:h-4" />
						<span className="hidden sm:inline">crafter-station</span>
					</a>
				</nav>
			</div>
		</header>
	);
}
