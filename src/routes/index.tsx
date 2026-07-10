import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { WhyCodeDropz } from "@/components/site/WhyCodeDrop";
import { ProductApp } from "@/components/site/ProductApp";
import { Features } from "@/components/site/Features";
import { WhoFor } from "@/components/site/WhoFor";
import { HowItWorks } from "@/components/site/HowItWorks";
import { FAQ } from "@/components/site/FAQ";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "CodeDropz — Share Code & Text Securely Between Devices" },
      { name: "description", content: "CodeDropz is the fastest way to share code or text between two devices. Generate a 6-digit code, set expiration and access limits — no login required." },
      { property: "og:title", content: "CodeDropz — Share Code & Text Securely Between Devices" },
      { property: "og:description", content: "Paste. Generate. Share. Send code or text across devices with a 6-digit code — expiring, access-limited, no signup." },
      { property: "og:url", content: "https://codedropz.vercel.app/" },
    ],
    links: [{ rel: "canonical", href: "https://codedropz.vercel.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "CodeDropz",
          applicationCategory: "UtilitiesApplication",
          operatingSystem: "Web",
          url: "https://codedropz.vercel.app/",
          description: "Share code or text securely between two devices with a 6-digit code. No login, expiration and access limits built in.",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        }),
      },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <WhyCodeDropz />
        <ProductApp />
        <Features />
        <WhoFor />
        <HowItWorks />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
