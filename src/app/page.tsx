import type { ReactElement } from "react";
import { Navbar } from "@/components/Navbar";
import { HeroSection } from "@/components/HeroSection";
import { BusinessScenarios } from "@/components/BusinessScenarios";
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
 * navbar links are plain `#hash` jumps. That is what makes the 18-language switch
 * and the interactive sandbox work with no router, no server calls and no full
 * page reload — and it keeps the static export to one HTML document.
 *
 * Section order is the reading order, and it is deliberately two-tier. A visitor
 * who never reads a man page gets the hero and then four business scenarios, and
 * can leave the page understanding what the product is for. Everything that
 * speaks in endpoints, environment switches or byte order — the catalog, the
 * protocol quick reference, the governance block, the install guide — stays in
 * the back half, where a developer can still look every number up. Each scenario
 * card links straight into that half, so the layering is a jump away rather than
 * a compromise.
 */
export default function Page(): ReactElement {
  return (
    <>
      <Navbar />
      <main id="top">
        <HeroSection />
        <BusinessScenarios />
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
