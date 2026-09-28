// Marketing / landing page
import Header from "@/components/Header";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/Footer";
import HomeSections from "@/components/landing/HomeSections";

export default function LandingPage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HomeSections />
      </main>
      <Footer />
    </>
  );
}
