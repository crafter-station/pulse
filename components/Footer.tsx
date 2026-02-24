import { CrafterStationLogo } from "./icons/CrafterStationLogo";

export function Footer() {
	return (
		<footer className="py-12 px-6 border-t-2 border-[#333] bg-[#0A0A0A]">
			<div className="mx-auto max-w-6xl flex items-center justify-between">
				<div className="flex items-center gap-3">
					<CrafterStationLogo className="w-5 h-5 text-[#FFD800]" />
					<span className="text-sm text-[#737373] font-bold uppercase tracking-wider">
						Built by <span className="text-white">Crafter Station</span>
					</span>
				</div>
				<div className="flex items-center gap-6">
					<a href="https://org.crafter.run" className="text-sm text-[#737373] hover:text-white transition-colors font-bold uppercase tracking-wider">
						[Team]
					</a>
					<a href="https://github.com/crafter-station" className="text-sm text-[#737373] hover:text-white transition-colors font-bold uppercase tracking-wider">
						[GitHub]
					</a>
				</div>
			</div>
			<div className="mx-auto max-w-6xl mt-6 pt-6 border-t border-[#262626]">
				<div className="text-[10px] text-[#737373]/60 font-mono uppercase tracking-widest text-center">
					SYS::PULSE v1.0 // CRAFTER-STATION // ALL SYSTEMS NOMINAL
				</div>
			</div>
		</footer>
	);
}
