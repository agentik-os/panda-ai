import { Hero } from '@/components/hero'
import { FeatureGrid } from '@/components/feature-grid'
import { Comparison } from '@/components/comparison'
import { CTASection } from '@/components/cta-section'
import { TrustBar } from '@/components/trust-bar'
import { KillerFeatures } from '@/components/killer-features'

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustBar />
      <KillerFeatures />
      <FeatureGrid />
      <Comparison />
      <CTASection />
    </>
  )
}
