import { PulseIcon } from "./icons/PulseIcon";

export function Hero() {
	return (
		<section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
			<div className="watermark top-16 -left-4 -rotate-3">PULSE</div>
			<div className="watermark bottom-0 right-0 rotate-2">SHIP</div>

			<div className="relative mx-auto max-w-6xl">
				<div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 mb-6 md:mb-8 bg-[#171717] border-2 border-[#333] text-xs md:text-sm">
					<PulseIcon className="w-3 md:w-4 h-3 md:h-4 text-[#FFD800] flex-shrink-0" />
					<span className="text-[#A3A3A3] uppercase tracking-wider font-bold">Real-time shipping tracker for</span>
					<span className="text-white font-black uppercase">Crafter Station</span>
				</div>
				<h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-9xl font-black tracking-tighter text-white mb-4 md:mb-6 leading-[0.85] uppercase">
					Measure what
					<br />
					<span className="relative inline-block">
						<span className="text-[#FFD800]">matters</span>
						<span className="absolute -bottom-1 md:-bottom-2 left-0 right-0 h-1 md:h-1.5 bg-[#FFD800]" />
					</span>
				</h1>
				<p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#A3A3A3] max-w-3xl mb-8 md:mb-12 leading-relaxed px-0 uppercase tracking-wide font-medium">
					Track every push to main across all repositories.
					<br className="hidden sm:block" />
					Visualize team velocity and celebrate shipping culture.
				</p>
				<div className="flex flex-col sm:flex-row items-start gap-3 md:gap-4">
					<a
						href="#activity"
						className="group w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-[#FFD800] text-[#0A0A0A] font-black hover:bg-[#FFD800]/90 transition-all flex items-center justify-center gap-2 text-sm md:text-base uppercase tracking-wider border-2 border-[#FFD800]"
					>
						View Activity
						<span className="group-hover:translate-x-1 transition-transform font-mono">&raquo;</span>
					</a>
					<a
						href="https://github.com/crafter-station"
						target="_blank"
						rel="noopener noreferrer"
						className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 border-2 border-[#FFD800]/30 text-white font-black hover:border-[#FFD800] hover:bg-[#FFD800]/5 transition-all text-sm md:text-base text-center uppercase tracking-wider"
					>
						GitHub Org
					</a>
				</div>

				<div className="mt-12 md:mt-16 flex items-center gap-4 text-[10px] md:text-xs text-[#737373] font-mono uppercase tracking-widest">
					<span className="h-px flex-1 bg-white/5" />
					<span>SYS::PULSE // STATUS::OPERATIONAL</span>
					<span className="h-px flex-1 bg-white/5" />
				</div>
			</div>
		</section>
	);
}
