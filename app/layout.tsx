import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/providers/auth-provider";
import { Toaster } from "@/components/ui/toaster";
import { AuthDebugTimer } from "@/components/debug/auth-timer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Aether | Cloud Notebook Deployment",
    template: "%s | Aether",
  },
  description:
    "Aether is the fastest way to deploy Jupyter Notebooks as scalable production APIs. One-click containerization for data scientists.",
  keywords: [
    "Jupyter",
    "Deployment",
    "Machine Learning",
    "API",
    "Cloud Run",
    "Docker",
    "Python",
    "Data Science",
  ],
  authors: [{ name: "Toniloba Adekola & Ifihanagbara Olusheye" }],
  creator: "Toniloba Adekola & Ifihanagbara Olusheye",
  publisher: "Aether Platform",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://aether-860155021919.us-central1.run.app",
    title: "Aether - Deploy Notebooks instantly",
    description:
      "Turn your .ipynb files into secure, scalable APIs in seconds.",
    siteName: "Aether",
  },
  twitter: {
    card: "summary_large_image",
    title: "Aether - Notebook Deployment",
    description:
      "Turn your .ipynb files into secure, scalable APIs in seconds.",
    creator: "@aether_platform",
  },
  metadataBase: new URL("https://aether-860155021919.us-central1.run.app"),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          {process.env.NODE_ENV === "development" && <AuthDebugTimer />}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
