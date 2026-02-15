import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { RepositoryDetail } from "@/components/RepositoryDetail";

export default async function RepoPage({
  params,
}: {
  params: Promise<{ name: string }>;
}) {
  const { name } = await params;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <Header />
      <RepositoryDetail name={name} />
      <Footer />
    </div>
  );
}
