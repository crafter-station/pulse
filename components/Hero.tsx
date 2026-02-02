import { PulseIcon } from "./icons/PulseIcon";

export function Hero() {
	return (
		<section className="relative pt-32 pb-24 px-6 overflow-hidden">
			<div className="absolute inset-0 bg-gradient-to-b from-[#FFD800]/5 via-transparent to-transparent" />
			<div className="absolute top-20 left-1/4 w-96 h-96 bg-[#FFD800]/5 rounded-full blur-3xl" />
			<div className="absolute top-40 right-1/4 w-96 h-96 bg-[#FFD800]/5 rounded-full blur-3xl" />

			<div className="relative mx-auto max-w-6xl text-center">
				<div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-[#171717] border border-[#FFD800]/20">
					<PulseIcon className="w-4 h-4 text-[#FFD800]" />
					<span className="text-[#A3A3A3]">Real-time shipping tracker for</span>
					<span className="text-white font-medium">Crafter Station</span>
				</div>
				<h1 className="text-6xl md:text-8xl font-black tracking-tight text-white mb-6 leading-none">
					Measure what
					<br />
					<span className="relative inline-block">
						<span className="text-[#FFD800]">matters</span>
						<span className="absolute -bottom-2 left-0 right-0 h-1 bg-[#FFD800]" />
					</span>
				</h1>
				<p className="text-xl md:text-2xl text-[#A3A3A3] max-w-3xl mx-auto mb-12 leading-relaxed">
					Track every push to main across all repositories.
					<br />
					Visualize team velocity and celebrate shipping culture.
				</p>
				<div className="flex items-center justify-center gap-4 flex-wrap">
					<a
						href="#activity"
						className="group px-8 py-4 bg-[#FFD800] text-[#0A0A0A] font-bold hover:bg-[#FFD800]/90 transition-all flex items-center gap-2"
					>
						View Activity
						<span className="group-hover:translate-x-1 transition-transform">→</span>
					</a>
					<a
						href="https://github.com/crafter-station"
						target="_blank"
						rel="noopener noreferrer"
						className="px-8 py-4 border-2 border-[#FFD800]/30 text-white font-bold hover:border-[#FFD800] hover:bg-[#FFD800]/5 transition-all"
					>
						GitHub Org
					</a>
				</div>
			</div>
		</section>
	);
}
