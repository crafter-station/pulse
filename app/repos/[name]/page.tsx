import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { RepoDetail } from "@/components/RepoDetail";

export default async function RepoPage({
	params,
}: {
	params: Promise<{ name: string }>;
}) {
	const { name } = await params;

	return (
		<div className="min-h-screen bg-[#0A0A0A] text-white">
			<Header />
			<RepoDetail name={name} />
			<Footer />
		</div>
	);
}
