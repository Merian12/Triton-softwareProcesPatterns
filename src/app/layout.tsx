import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from '@/components/LanguageProvider';
import SiteFooter from '@/components/SiteFooter';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Volunteerportal",
  description: "Frivilligt arbejde ved sportsevents i Danmark · Volunteer at sporting events in Denmark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="da"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <LanguageProvider>
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
