import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Stats } from "@/components/Stats";
import { Repos } from "@/components/Repos";
import { ActivityFeed } from "@/components/ActivityFeed";
import { Leaderboard } from "@/components/Leaderboard";
import { Footer } from "@/components/Footer";

export default function Home() {
	return (
		<div className="min-h-screen bg-[#0A0A0A] text-white">
			<Header />
			<main>
				<Hero />
				<Stats />
				<Repos />
				<ActivityFeed />
				<Leaderboard />
			</main>
			<Footer />
		</div>
	);
}
