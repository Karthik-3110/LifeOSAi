import { useEffect } from 'react'
import PublicNavbar from '../components/layout/PublicNavbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import Hero from '../components/home/Hero.jsx'
import Features from '../components/home/Features.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'
import Testimonials from '../components/home/Testimonials.jsx'
import FinalCta from '../components/home/FinalCta.jsx'
import { warmBackend } from '../lib/api.js'

export default function Home() {
  useEffect(() => {
    // Best-effort only: visitors should never see health-check state or errors.
    void warmBackend()
  }, [])

  return (
    <div className="bg-bg-base text-text-primary">
      <PublicNavbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FinalCta />
      <Footer />
    </div>
  )
}
