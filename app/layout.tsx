import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DemoBar from "@/components/DemoBar";
import AccountBar from "@/components/AccountBar";
import { school } from "@/lib/school";

export const metadata: Metadata = {
  title: { default: `${school.deptName} ${school.nameTh}`, template: `%s | งานวิชาการ ${school.nameTh}` },
  description: `เว็บไซต์งานวิชาการ ${school.nameTh} — ข่าวประชาสัมพันธ์ หลักสูตร งานทะเบียนวัดผล คลังเอกสาร และบริการออนไลน์`,
  icons: { icon: school.images.logo },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <DemoBar />
        <Header />
        <main>{children}</main>
        <Footer />
        <AccountBar />
      </body>
    </html>
  );
}
