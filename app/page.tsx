import { ActivityFeed } from "@/components/ActivityFeed";
import { Analytics } from "@/components/Analytics";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Leaderboard } from "@/components/Leaderboard";
import { Repositories } from "@/components/Repositories";
import { Stats } from "@/components/Stats";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Header />
      <main>
        <Hero />
        <Stats />
        <ActivityFeed />
        <Leaderboard />
        <Repositories />
        <Analytics />
      </main>
      <Footer />
    </div>
  );
}
