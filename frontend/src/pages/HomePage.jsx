import { Link } from 'react-router-dom'
import { Wheat, ShieldCheck, Microscope, Database, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="animate-fade-in transition-all">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-background-soft grain-overlay">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest mb-6">
                <ShieldCheck size={14} />
                Certified Quality Protocol
              </div>
              <h1 className="text-5xl lg:text-7xl font-display text-text-header leading-tight mb-8">
                Precision <span className="text-primary italic">Grain Analysis</span> for Modern Labs
              </h1>
              <p className="text-xl text-text-body leading-relaxed mb-10 max-w-2xl lg:mx-0 mx-auto">
                The most advanced AI system for grading rice and wheat. Instant segmentation, 
                defect detection, and quality scoring at lab-grade precision.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link to="/upload" className="btn-primary flex items-center gap-2 px-8 py-4 text-lg w-full sm:w-auto justify-center">
                  Start New Analysis
                  <ArrowRight size={20} />
                </Link>
                <Link to="/scanner" className="btn-secondary flex items-center gap-2 px-8 py-4 text-lg w-full sm:w-auto justify-center">
                  Scanner Mode
                </Link>
              </div>
              
              <div className="mt-12 flex items-center justify-center lg:justify-start gap-8 opacity-40">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/FAO_logo.svg" alt="FAO" className="h-8 grayscale" />
                <span className="h-6 w-px bg-text-body"></span>
                <span className="font-display font-bold text-lg">ISO 9001:2015</span>
              </div>
            </div>
            
            <div className="lg:w-1/2 relative">
              <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl border-8 border-white/50">
                <img 
                  src="https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=1200" 
                  alt="Grain analysis visualization" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-primary/10 mix-blend-overlay"></div>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary/20 rounded-full blur-3xl -z-10"></div>
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-primary/20 rounded-full blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6">
        <header className="text-center mb-20">
          <h2 className="text-4xl font-display mb-4">Optimized for Agricultural Precision</h2>
          <p className="text-text-body max-w-2xl mx-auto text-lg">
            Built from the ground up to meet professional laboratory and export standards.
          </p>
        </header>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              Icon: Microscope,
              title: "Expert Segmentation",
              desc: "Deep learning models trained on millions of kernels to identify even overlapping grains with 99.8% precision."
            },
            {
              Icon: ShieldCheck,
              title: "Defect Identification",
              desc: "Instantly detect broken, chalky, or discolored grains that affect the core quality and export value."
            },
            {
              Icon: Database,
              title: "Secure Reporting",
              desc: "All analysis results are backed up to our secure vault, allowing for historical trends and audit trails."
            }
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="card-premium p-10 flex flex-col items-center text-center group">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 group-hover:bg-primary group-hover:text-white transition-all duration-500">
                <Icon size={32} />
              </div>
              <h3 className="text-2xl font-display mb-4 text-text-header">{title}</h3>
              <p className="text-text-body leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-24 bg-white border-y border-surface-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-20">
          <div className="lg:w-1/2 grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="h-48 rounded-2xl bg-background-soft border border-surface-border p-6 flex flex-col justify-end">
                <p className="text-3xl font-display text-primary font-bold">15,000+</p>
                <p className="text-xs font-bold uppercase tracking-widest text-text-body">Daily Scans</p>
              </div>
              <div className="h-64 rounded-2xl bg-primary flex flex-col justify-end p-6">
                <p className="text-3xl font-display text-white font-bold">500+</p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">Grain Varieties</p>
              </div>
            </div>
            <div className="space-y-4 pt-12">
              <div className="h-64 rounded-2xl bg-secondary flex flex-col justify-end p-6">
                <p className="text-3xl font-display text-white font-bold">2.4s</p>
                <p className="text-xs font-bold uppercase tracking-widest text-white/60">Median Analysis</p>
              </div>
              <div className="h-48 rounded-2xl bg-background-soft border border-surface-border p-6 flex flex-col justify-end">
                <p className="text-3xl font-display text-text-body font-bold">99.8%</p>
                <p className="text-xs font-bold uppercase tracking-widest text-text-body/60">Accuracy</p>
              </div>
            </div>
          </div>
          
          <div className="lg:w-1/2">
            <h2 className="text-4xl font-display mb-8 leading-tight">Scale your quality control with zero compromises</h2>
            <ul className="space-y-6">
              {[
                "Eliminate subjective human grading errors",
                "Reduce inspection costs by up to 85%",
                "Export-ready documentation for every batch",
                "Automated trend monitoring for farm yield"
              ].map(item => (
                <li key={item} className="flex items-start gap-4">
                  <div className="mt-1 p-0.5 rounded-full bg-primary/20 text-primary">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-lg text-text-body">{item}</span>
                </li>
              ))}
            </ul>
            <div className="mt-12">
              <Link to="/register" className="text-primary font-bold text-lg flex items-center gap-2 hover:underline">
                Register your laboratory profile
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
