// src/app/page.tsx
import Link from 'next/link';
import { Shield, Search, Sparkles, Star, Zap, ArrowRight, Check } from 'lucide-react';

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI-Powered Smart Search',
    desc: 'Type naturally: "IT support in Indiana under $500k for small business" and we convert it into structured SAM.gov filters automatically.',
  },
  {
    icon: Search,
    title: 'Advanced Filtering',
    desc: 'Filter by NAICS code, set-aside type, notice type, posted date, deadline, place of performance, and solicitation number — all in one place.',
  },
  {
    icon: Star,
    title: 'Save & Track',
    desc: 'Save opportunities, save searches, and get AI-generated fit scores based on your business profile, certifications, and NAICS codes.',
  },
  {
    icon: Zap,
    title: 'AI Fit Analysis',
    desc: '"Is this a good fit for me?" — get an honest AI-generated fit score, key requirements, risks, and recommended next steps.',
  },
];

const CERTIFICATIONS = ['8(a)', 'HUBZone', 'SDVOSB', 'WOSB', 'EDWOSB', 'SDB', 'Veteran-Owned'];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full bg-orange-500/5 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[400px] rounded-full bg-orange-500/3 blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative flex items-center justify-between px-8 py-5 border-b border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg">SAMHunt</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link href="/search" className="btn-primary text-sm">
            Search Contracts
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative px-8 pt-24 pb-20 text-center max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-full text-xs text-orange-300 mb-6">
          <Sparkles className="w-3 h-3" />
          AI-powered SAM.gov search for small businesses
        </div>

        <h1 className="font-display text-5xl font-extrabold leading-tight mb-6">
          Find Government Contracts
          <br />
          <span className="text-gradient">Without the SAM.gov Headache</span>
        </h1>

        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          SAMHunt gives small businesses a smarter interface to the SAM.gov contract opportunities database.
          Search in plain English, filter by set-aside, get AI fit scores, and track opportunities — all in one place.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/search" className="btn-primary text-base px-6 py-3">
            <Search className="w-5 h-5" />
            Search Opportunities
          </Link>
          <Link href="/login" className="btn-secondary text-base px-6 py-3">
            Create Free Account
          </Link>
        </div>

        {/* Smart search demo pill */}
        <div className="mt-12 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 px-5 py-4 bg-zinc-900 border border-zinc-700 rounded-2xl text-left">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-zinc-300 font-medium">
                "IT support services in Indiana under $500k for small business, closing soon"
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                → Keyword: IT support · State: IN · Set-aside: SBA · Deadline: 7 days
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Set-aside badges */}
      <section className="px-8 py-8 border-y border-zinc-800/50">
        <div className="max-w-4xl mx-auto">
          <p className="text-xs text-zinc-600 text-center mb-4 uppercase tracking-wider">Works for all small business certifications</p>
          <div className="flex flex-wrap justify-center gap-2">
            {CERTIFICATIONS.map(cert => (
              <span key={cert} className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 rounded-full text-xs text-zinc-300">
                {cert}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 py-20">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-center mb-3">
            Everything SAM.gov Doesn't Give You
          </h2>
          <p className="text-zinc-500 text-center mb-12">Built by contractors, for contractors.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card-hover p-6">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-orange-400" />
                </div>
                <h3 className="font-display font-bold text-zinc-100 mb-2">{title}</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filters showcase */}
      <section className="px-8 py-16 bg-zinc-900/50 border-y border-zinc-800">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold mb-2">All the filters that matter</h2>
          <p className="text-zinc-500 mb-8 text-sm">No more digging through SAM.gov's clunky interface.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              'Keyword / title search',
              'NAICS code (multi-select)',
              'Set-aside type',
              'Notice type',
              'Posted date range',
              'Response deadline',
              'Place of performance state',
              'ZIP code',
              'Solicitation number',
              'Agency / office',
              '"New this week" quick filter',
              '"Closing soon" quick filter',
            ].map(filter => (
              <div key={filter} className="flex items-center gap-2 text-sm text-zinc-300">
                <Check className="w-4 h-4 text-orange-400 shrink-0" />
                {filter}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="font-display text-3xl font-bold mb-4">
            Start finding contracts today
          </h2>
          <p className="text-zinc-400 mb-8">
            Free to use. No credit card required. Just bring your SAM.gov registration and start winning.
          </p>
          <Link href="/search" className="btn-primary text-base px-8 py-3 inline-flex">
            <Search className="w-5 h-5" />
            Search Now — It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-8 py-6 border-t border-zinc-800 text-center text-xs text-zinc-600">
        <p>
          SAMHunt is an independent tool. Not affiliated with SAM.gov, GSA, or the U.S. Government.
          Data sourced from the{' '}
          <a href="https://open.gsa.gov/api/opportunities-api/" className="hover:text-zinc-400 underline" target="_blank" rel="noopener noreferrer">
            SAM.gov Opportunities API
          </a>.
        </p>
      </footer>
    </div>
  );
}
