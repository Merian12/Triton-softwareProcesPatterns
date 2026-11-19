import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider, LanguageSwitcher } from '@/components/LanguageProvider';
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
  title: "Triton VolunteerPortal",
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
          <div className="border-b border-border-subtle bg-surface-muted"><div className="mx-auto flex max-w-6xl justify-end px-5 py-2 sm:px-9"><LanguageSwitcher /></div></div>
          <div className="flex flex-1 flex-col">{children}</div>
          <SiteFooter />
        </LanguageProvider>
      </body>
    </html>
  );
}
