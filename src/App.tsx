import "./index.css";

const MOCK_ACTIVITY = [
	{ repo: "elements", author: "Railly", message: "feat: add DataTable component", time: "2m ago", additions: 342, deletions: 12 },
	{ repo: "hack0", author: "Anthony", message: "fix: resolve auth redirect loop", time: "15m ago", additions: 23, deletions: 45 },
	{ repo: "tinte", author: "Cris", message: "chore: update dependencies", time: "1h ago", additions: 156, deletions: 203 },
	{ repo: "flow", author: "Railly", message: "fix: mobile foreignObject rendering", time: "2h ago", additions: 48, deletions: 8 },
	{ repo: "peru.ai-hackathon.co", author: "Shiara", message: "style: update hero section", time: "3h ago", additions: 89, deletions: 34 },
];

const MOCK_STATS = [
	{ label: "Commits today", value: "47" },
	{ label: "Active repos", value: "12" },
	{ label: "Team streak", value: "23 days" },
];

const MOCK_LEADERBOARD = [
	{ name: "Railly Hugo", commits: 156, avatar: "R" },
	{ name: "Anthony Cueva", commits: 89, avatar: "A" },
	{ name: "Cris Correa", commits: 67, avatar: "C" },
	{ name: "Shiara Arauzo", commits: 45, avatar: "S" },
];

function CrafterStationLogo({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 257 257" className={className} fill="currentColor">
			<path d="M116.419 16.3268C109.59 11.5679 97.9222 5.96914 90.2388 3.72965C72.8798 -1.58913 59.1794 1.40491 50.114 4.56947C32.4704 10.7281 21.3721 18.8462 11.412 33.6828C-4.23949 56.6375 -1.96292 93.869 17.1035 114.864C21.3721 119.903 23.6487 119.063 40.1539 107.026C40.723 106.466 38.4465 102.827 35.0316 98.6278C27.3481 89.11 22.7949 71.754 25.0715 61.9563C32.4704 31.1634 70.3187 14.6472 94.7919 31.4433C100.199 35.0825 117.273 50.199 132.64 65.0356C155.691 86.8706 162.52 91.9094 168.212 91.3496C173.903 90.7897 175.895 88.8301 176.464 82.6715C177.318 75.9531 174.757 72.034 161.667 60.2767C152.845 52.1585 145.731 44.8802 145.731 43.4805C145.731 42.3608 151.707 37.6019 159.105 33.1229C206.914 3.1698 258.421 62.7961 218.581 101.987C213.459 107.026 204.353 112.345 198.377 114.024C191.547 115.704 159.959 117.104 120.688 117.104C47.2683 117.104 43.2842 117.943 23.9332 135.02C-0.824636 157.134 -6.51609 194.926 10.8429 222.359C33.3241 258.191 81.7016 267.149 115.85 241.675L128.372 232.157L142.885 241.675C166.504 257.351 185.571 260.431 208.621 252.872C254.722 237.476 271.796 179.809 241.916 141.178C238.501 136.979 236.794 136.699 232.241 138.939C218.297 146.777 218.581 146.217 226.834 163.013C233.094 175.89 234.233 180.929 232.81 190.727C228.826 215.361 210.044 231.877 186.14 231.877C167.643 231.877 161.667 228.238 127.518 195.486C109.59 178.689 93.0845 164.693 90.8079 164.693C86.5393 164.693 77.433 173.371 77.433 177.57C77.433 178.689 85.1165 187.647 94.7919 197.165L112.151 214.241L101.906 222.08C65.7655 249.233 14.2578 216.761 26.2098 174.211C29.9093 161.333 42.9996 147.057 55.5209 142.578C60.3586 140.618 90.2388 139.498 130.648 139.498C204.922 139.498 213.744 138.099 230.818 123.542C281.757 80.9919 252.161 0.930299 185.571 1.21023C166.22 1.21023 155.691 5.12933 137.762 18.2863L128.656 25.0048L116.419 16.3268Z" />
		</svg>
	);
}

function GitHubLogo({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" className={className} fill="currentColor">
			<path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
		</svg>
	);
}

function PulseIcon({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className={className}>
			<path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
		</svg>
	);
}

function Header() {
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

function Hero() {
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

function Stats() {
	return (
		<section className="py-12 px-6 border-y border-[#262626] bg-[#171717]/50">
			<div className="mx-auto max-w-6xl">
				<div className="grid grid-cols-3 gap-8">
					{MOCK_STATS.map((stat) => (
						<div key={stat.label} className="text-center">
							<div className="text-4xl font-black text-white mb-2">{stat.value}</div>
							<div className="text-sm text-[#737373] uppercase tracking-wide">{stat.label}</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function ActivityFeed() {
	return (
		<section id="activity" className="py-20 px-6">
			<div className="mx-auto max-w-6xl">
				<div className="flex items-center justify-between mb-8">
					<h2 className="text-2xl font-bold text-white">Recent Activity</h2>
					<div className="flex items-center gap-2 text-sm text-[#737373]">
						<span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
						Live
					</div>
				</div>
				<div className="space-y-3">
					{MOCK_ACTIVITY.map((item, i) => (
						<div
							key={i}
							className="flex items-center gap-4 p-4 bg-[#171717] border border-[#262626] hover:border-[#333] transition-colors"
						>
							<div className="w-10 h-10 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold text-sm">
								{item.author[0]}
							</div>
							<div className="flex-1 min-w-0">
								<div className="flex items-center gap-2 mb-1">
									<span className="font-semibold text-white">{item.author}</span>
									<span className="text-[#737373]">pushed to</span>
									<span className="px-2 py-0.5 text-xs font-medium bg-[#FFD800]/10 text-[#FFD800] border border-[#FFD800]/20">
										{item.repo}
									</span>
								</div>
								<p className="text-sm text-[#A3A3A3] font-mono truncate">{item.message}</p>
							</div>
							<div className="flex items-center gap-4 text-xs">
								<span className="text-green-500">+{item.additions}</span>
								<span className="text-red-500">-{item.deletions}</span>
								<span className="text-[#737373]">{item.time}</span>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function Leaderboard() {
	return (
		<section id="leaderboard" className="py-20 px-6 bg-[#171717]/30">
			<div className="mx-auto max-w-6xl">
				<h2 className="text-2xl font-bold text-white mb-8">Weekly Leaderboard</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{MOCK_LEADERBOARD.map((member, i) => (
						<div
							key={member.name}
							className={`flex items-center gap-4 p-5 border ${
								i === 0
									? "bg-[#FFD800]/5 border-[#FFD800]/30"
									: "bg-[#171717] border-[#262626]"
							}`}
						>
							<div
								className={`w-8 h-8 flex items-center justify-center font-bold text-sm ${
									i === 0
										? "bg-[#FFD800] text-[#0A0A0A]"
										: "bg-[#262626] text-[#737373]"
								}`}
							>
								{i + 1}
							</div>
							<div className="w-12 h-12 flex items-center justify-center bg-[#262626] text-[#FFD800] font-bold">
								{member.avatar}
							</div>
							<div className="flex-1">
								<div className="font-semibold text-white">{member.name}</div>
								<div className="text-sm text-[#737373]">{member.commits} commits this week</div>
							</div>
							{i === 0 && (
								<span className="px-3 py-1 text-xs font-semibold bg-[#FFD800] text-[#0A0A0A]">
									TOP SHIPPER
								</span>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

function Footer() {
	return (
		<footer className="py-12 px-6 border-t border-[#262626]">
			<div className="mx-auto max-w-6xl flex items-center justify-between">
				<div className="flex items-center gap-3">
					<CrafterStationLogo className="w-5 h-5 text-[#FFD800]" />
					<span className="text-sm text-[#737373]">
						Built by <span className="text-white">Crafter Station</span>
					</span>
				</div>
				<div className="flex items-center gap-6">
					<a href="https://org.crafter.run" className="text-sm text-[#737373] hover:text-white transition-colors">
						Team
					</a>
					<a href="https://github.com/crafter-station" className="text-sm text-[#737373] hover:text-white transition-colors">
						GitHub
					</a>
				</div>
			</div>
		</footer>
	);
}

function App() {
	return (
		<div className="min-h-screen bg-[#0A0A0A] text-white">
			<Header />
			<main>
				<Hero />
				<Stats />
				<ActivityFeed />
				<Leaderboard />
			</main>
			<Footer />
		</div>
	);
}

export default App;
