import type { ReactElement } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { PluginsShowcase } from "@/components/PluginsShowcase";
import { ArchitectureComparison } from "@/components/ArchitectureComparison";
import { InteractiveSandbox } from "@/components/InteractiveSandbox";
import { SecurityGovernanceSection } from "@/components/SecurityGovernanceSection";
import { StatusChangelogSection } from "@/components/StatusChangelogSection";
import { ProtocolReferenceSection } from "@/components/ProtocolReferenceSection";
import { InstallAndUsageGuideSection } from "@/components/InstallAndUsageGuideSection";
import { DirectoryAndDocsSection } from "@/components/DirectoryAndDocsSection";
import { Footer } from "@/components/Footer";

/**
 * The portal is a single page: every module is an anchored section so that the
 * navbar links are plain `#hash` jumps. That is what makes the tri-lingual
 * switch and the interactive sandbox work with no router, no server calls and
 * no full page reload — and it keeps the static export to one HTML document.
 */
export default function Page(): ReactElement {
  return (
    <>
      <Navbar />
      <main id="top">
        <HeroSection />
        <PluginsShowcase />
        <ArchitectureComparison />
        <InteractiveSandbox />
        <SecurityGovernanceSection />
        <StatusChangelogSection />
        <ProtocolReferenceSection />
        <InstallAndUsageGuideSection />
        <DirectoryAndDocsSection />
      </main>
      <Footer />
    </>
  );
}
