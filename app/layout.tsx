import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";
import "./pulse.css";

const barlow = Barlow({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800", "900"],
	variable: "--font-display",
	display: "swap",
});

const barlowCondensed = Barlow_Condensed({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-sans",
	display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
	variable: "--font-mono",
	display: "swap",
});

export const metadata: Metadata = {
	title: "Pulse · Crafter Station",
	description: "What Crafter Station shipped: projects, repos, commits and traction across our four GitHub orgs.",
	icons: {
		icon: "/favicon.svg",
		apple: "/apple-touch-icon.png",
	},
	openGraph: {
		title: "Pulse · Crafter Station",
		description: "What Crafter Station shipped: projects, repos, commits and traction across our four GitHub orgs.",
		images: [{ url: "/og.png", width: 1200, height: 630 }],
	},
	twitter: {
		card: "summary_large_image",
		title: "Pulse · Crafter Station",
		description: "What Crafter Station shipped: projects, repos, commits and traction across our four GitHub orgs.",
		images: ["/og.png"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning className={`${barlow.variable} ${barlowCondensed.variable} ${ibmPlexMono.variable}`}>
			<head>
				<script
					// biome-ignore lint/security/noDangerouslySetInnerHtml: sets the saved theme before paint
					dangerouslySetInnerHTML={{
						__html: `try{var t=localStorage.getItem("pulse-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`,
					}}
				/>
			</head>
			<body>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
