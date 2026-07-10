import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { WhyCodeDropz } from "@/components/site/WhyCodeDropz";
import { ProductApp } from "@/components/site/ProductApp";
import { Features } from "@/components/site/Features";
import { WhoFor } from "@/components/site/WhoFor";
import { HowItWorks } from "@/components/site/HowItWorks";
import { FAQ } from "@/components/site/FAQ";
import { Footer } from "@/components/site/Footer";

export const Route = createFileRoute("/")({
  component: Index,
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
