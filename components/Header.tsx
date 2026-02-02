import { CrafterStationLogo } from "./icons/CrafterStationLogo";
import { GitHubLogo } from "./icons/GitHubLogo";

export function Header() {
	return (
		<header className="fixed top-0 left-0 right-0 z-50 border-b border-[#262626] bg-[#0A0A0A]/80 backdrop-blur-sm">
			<div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 flex items-center justify-center bg-[#171717] border border-[#333]">
						<CrafterStationLogo className="w-5 h-5 text-[#FFD800]" />
					</div>
					<div className="flex items-center gap-2">
						<span className="font-bold text-white tracking-tight">PULSE</span>
						<span className="px-2 py-0.5 text-[10px] font-medium bg-[#FFD800]/10 text-[#FFD800] border border-[#FFD800]/20">
							BETA
						</span>
					</div>
				</div>
				<nav className="flex items-center gap-6">
					<a href="#activity" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
						Activity
					</a>
					<a href="#leaderboard" className="text-sm text-[#A3A3A3] hover:text-white transition-colors">
						Leaderboard
					</a>
					<a
						href="https://github.com/crafter-station"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[#171717] border border-[#333] text-white hover:border-[#FFD800]/50 transition-all"
					>
						<GitHubLogo className="w-4 h-4" />
						crafter-station
					</a>
				</nav>
			</div>
		</header>
	);
}
