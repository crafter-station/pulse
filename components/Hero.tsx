import { PulseIcon } from "./icons/PulseIcon";

export function Hero() {
	return (
		<section className="pt-32 pb-20 px-6">
			<div className="mx-auto max-w-6xl text-center">
				<div className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-[#171717] border border-[#333] text-sm">
					<PulseIcon className="w-4 h-4 text-[#FFD800]" />
					<span className="text-[#A3A3A3]">Real-time shipping tracker for</span>
					<span className="text-white font-medium">Crafter Station</span>
				</div>
				<h1 className="text-5xl md:text-7xl font-black tracking-tight text-white mb-6">
					Measure what
					<br />
					<span className="text-[#FFD800]">matters</span>
				</h1>
				<p className="text-xl text-[#A3A3A3] max-w-2xl mx-auto mb-12">
					Track every push to main across all repositories.
					Visualize team velocity and celebrate shipping culture.
				</p>
				<div className="flex items-center justify-center gap-4">
					<a
						href="#activity"
						className="px-6 py-3 bg-[#FFD800] text-[#0A0A0A] font-semibold hover:bg-[#FFD800]/90 transition-colors"
					>
						View Activity
					</a>
					<a
						href="https://github.com/crafter-station"
						target="_blank"
						rel="noopener noreferrer"
						className="px-6 py-3 border border-[#333] text-white font-semibold hover:border-[#FFD800]/50 transition-colors"
					>
						GitHub Org
					</a>
				</div>
			</div>
		</section>
	);
}
