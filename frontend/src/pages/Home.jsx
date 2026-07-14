import PublicNavbar from '../components/layout/PublicNavbar.jsx'
import Footer from '../components/layout/Footer.jsx'
import Hero from '../components/home/Hero.jsx'
import Features from '../components/home/Features.jsx'
import HowItWorks from '../components/home/HowItWorks.jsx'
import Testimonials from '../components/home/Testimonials.jsx'
import FinalCta from '../components/home/FinalCta.jsx'

export default function Home() {
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
