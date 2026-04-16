import type { Metadata } from "next";
import SiteFooter from "@/app/components/SiteFooter";
import SiteHeader from "@/app/components/SiteHeader";
import { getCurrentSession } from "@/lib/authSession";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lead Generator MVP",
  description: "Lead generation workflow with preview, regeneration, CSV export, and MongoDB dashboard.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  return (
    <html lang="en">
      <body>
        <SiteHeader sessionEmail={session?.email} />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
