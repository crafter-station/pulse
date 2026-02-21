import type { Metadata } from "next";
import { Barlow, Barlow_Condensed, IBM_Plex_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

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
	title: "Pulse - Crafter Station Shipping Tracker",
	description: "Real-time shipping tracker for Crafter Station. Track every push to main across all repositories.",
	icons: {
		icon: "/favicon.svg",
		apple: "/apple-touch-icon.png",
	},
	openGraph: {
		title: "Pulse - Crafter Station Shipping Tracker",
		description: "Real-time shipping tracker for Crafter Station. Track every push to main across all repositories.",
		images: [{ url: "/og.png", width: 1200, height: 630 }],
	},
	twitter: {
		card: "summary_large_image",
		title: "Pulse - Crafter Station Shipping Tracker",
		description: "Real-time shipping tracker for Crafter Station. Track every push to main across all repositories.",
		images: ["/og.png"],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={`${barlow.variable} ${barlowCondensed.variable} ${ibmPlexMono.variable}`}>
			<body>
				{children}
				<Analytics />
			</body>
		</html>
	);
}
