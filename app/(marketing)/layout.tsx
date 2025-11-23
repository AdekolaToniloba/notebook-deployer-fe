import { Navbar } from "@/components/navigation/navbar";
import { Footer } from "@/components/marketing/footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-white font-mono">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
