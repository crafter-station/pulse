import { PulseIcon } from "./icons/PulseIcon";

export function Hero() {
	return (
		<section className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-6 overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-b from-[#FFD800]/5 via-transparent to-transparent" />
			<div className="absolute top-20 left-1/4 w-96 h-96 bg-[#FFD800]/5 rounded-full blur-3xl" />
			<div className="absolute top-40 right-1/4 w-96 h-96 bg-[#FFD800]/5 rounded-full blur-3xl" />

			<div className="relative mx-auto max-w-6xl text-center">
				<div className="inline-flex items-center gap-2 px-3 md:px-4 py-2 mb-6 md:mb-8 bg-[#171717] border border-[#FFD800]/20 text-xs md:text-sm">
					<PulseIcon className="w-3 md:w-4 h-3 md:h-4 text-[#FFD800] flex-shrink-0" />
					<span className="text-[#A3A3A3]">Real-time shipping tracker for</span>
					<span className="text-white font-medium">Crafter Station</span>
				</div>
				<h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-black tracking-tight text-white mb-4 md:mb-6 leading-none">
					Measure what
					<br />
					<span className="relative inline-block">
						<span className="text-[#FFD800]">matters</span>
						<span className="absolute -bottom-1 md:-bottom-2 left-0 right-0 h-0.5 md:h-1 bg-[#FFD800]" />
					</span>
				</h1>
				<p className="text-base sm:text-lg md:text-xl lg:text-2xl text-[#A3A3A3] max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed px-4">
					Track every push to main across all repositories.
					<br className="hidden sm:block" />
					Visualize team velocity and celebrate shipping culture.
				</p>
				<div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4 px-4">
					<a
						href="#activity"
						className="group w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 bg-[#FFD800] text-[#0A0A0A] font-bold hover:bg-[#FFD800]/90 transition-all flex items-center justify-center gap-2 text-sm md:text-base"
					>
						View Activity
						<span className="group-hover:translate-x-1 transition-transform">→</span>
					</a>
					<a
						href="https://github.com/crafter-station"
						target="_blank"
						rel="noopener noreferrer"
						className="w-full sm:w-auto px-6 md:px-8 py-3 md:py-4 border-2 border-[#FFD800]/30 text-white font-bold hover:border-[#FFD800] hover:bg-[#FFD800]/5 transition-all text-sm md:text-base text-center"
					>
						GitHub Org
					</a>
				</div>
			</div>
		</section>
	);
}
