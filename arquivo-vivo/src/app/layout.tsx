import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono" });

export const metadata: Metadata = {
	title: "Arquivo Vivo",
	description: "Gestão acadêmica do Instituto Arquivo Vivo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="pt-BR" className={`${inter.variable} ${playfair.variable} ${mono.variable}`}>
			<body className="font-sans antialiased">{children}</body>
		</html>
	);
}