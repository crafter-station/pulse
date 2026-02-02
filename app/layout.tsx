import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
	subsets: ["latin"],
	variable: "--font-sans",
	display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
	subsets: ["latin"],
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
		<html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
			<body>{children}</body>
		</html>
	);
}
