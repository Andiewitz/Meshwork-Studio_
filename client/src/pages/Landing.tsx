import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Box, Network, Layers, ArrowRight, Zap, GitBranch, Database } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-background border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-foreground bg-primary flex items-center justify-center">
              <Box className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black uppercase tracking-tighter">
              Meshwork Studio
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="font-bold uppercase text-xs tracking-widest hover:text-primary transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="font-bold uppercase text-xs tracking-widest hover:text-primary transition-colors">
              How It Works
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-bold uppercase text-xs tracking-widest rounded-none hover:bg-muted" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button className="accent-btn rounded-none font-bold uppercase text-xs tracking-widest" asChild>
              <Link href="/auth/login">
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-24 pb-16 px-4 md:px-8 border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Copy */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col gap-6"
            >
              <div className="inline-flex">
                <span className="px-4 py-2 border-2 border-foreground bg-muted font-bold uppercase text-xs tracking-widest">
                  System Design Tool v1.0
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
                Architect
                <br />
                <span className="text-primary">Systems.</span>
              </h1>

              <p className="text-lg md:text-xl max-w-lg leading-relaxed">
                Visual canvas for system architecture, distributed systems, and infrastructure design. 
                Plan your microservices, APIs, and data flows with a node-based editor built for engineers.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button size="lg" className="accent-btn rounded-none h-14 px-8 font-black uppercase tracking-widest text-lg" asChild>
                  <Link href="/auth/login">
                    Start Designing
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-none h-14 px-8 font-bold uppercase tracking-widest border-2 border-foreground hover:bg-muted text-lg">
                  View Example
                </Button>
              </div>

              <div className="flex items-center gap-6 pt-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-primary" />
                  Node-based Canvas
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Collections
                </div>
              </div>
            </motion.div>

            {/* Right - Visual */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative"
            >
              <div className="border-2 border-foreground bg-card p-6">
                {/* System Diagram Mockup */}
                <div className="relative aspect-square bg-background border-2 border-foreground overflow-hidden">
                  {/* Grid Background */}
                  <div className="absolute inset-0 opacity-10">
                    <svg width="100%" height="100%">
                      <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>

                  {/* Nodes */}
                  <div className="absolute top-[20%] left-[50%] -translate-x-1/2">
                    <div className="border-2 border-foreground bg-primary p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Database className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="mt-2 px-2 py-1 bg-background border border-foreground text-xs font-bold uppercase text-center">
                      Database
                    </div>
                  </div>

                  <div className="absolute top-[50%] left-[20%]">
                    <div className="border-2 border-foreground bg-card p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Network className="w-6 h-6" />
                    </div>
                    <div className="mt-2 px-2 py-1 bg-background border border-foreground text-xs font-bold uppercase text-center">
                      API Gateway
                    </div>
                  </div>

                  <div className="absolute top-[50%] right-[20%]">
                    <div className="border-2 border-foreground bg-card p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Box className="w-6 h-6" />
                    </div>
                    <div className="mt-2 px-2 py-1 bg-background border border-foreground text-xs font-bold uppercase text-center">
                      Service
                    </div>
                  </div>

                  <div className="absolute bottom-[20%] left-[50%] -translate-x-1/2">
                    <div className="border-2 border-foreground bg-card p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <GitBranch className="w-6 h-6" />
                    </div>
                    <div className="mt-2 px-2 py-1 bg-background border border-foreground text-xs font-bold uppercase text-center">
                      Queue
                    </div>
                  </div>

                  {/* Connection Lines */}
                  <svg className="absolute inset-0 pointer-events-none">
                    <line x1="50%" y1="35%" x2="30%" y2="50%" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
                    <line x1="50%" y1="35%" x2="70%" y2="50%" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
                    <line x1="35%" y1="62%" x2="50%" y2="75%" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
                    <line x1="65%" y1="62%" x2="50%" y2="75%" stroke="currentColor" strokeWidth="2" strokeDasharray="4,4" />
                  </svg>
                </div>
              </div>

              {/* Decorative elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 border-2 border-foreground bg-primary/20 -z-10" />
              <div className="absolute -bottom-4 -left-4 w-24 h-24 border-2 border-foreground bg-muted -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 md:px-8 border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              Built For Engineers
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Design systems, not slides. A canvas that understands nodes, edges, and distributed architecture.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Network,
                title: "Node-Based Canvas",
                description: "Drag-and-drop interface for designing microservices, APIs, databases, and their connections. Visualize your architecture."
              },
              {
                icon: Layers,
                title: "Collections",
                description: "Organize workspaces into collections. Group by project, team, or architecture layer. Nested folders supported."
              },
              {
                icon: Box,
                title: "System Types",
                description: "Purpose-built workspace types: System Design, Architecture, Application Flow, and Presentation diagrams."
              }
            ].map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
                className="brutal-card bg-card p-6 border-2 border-foreground hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-shadow"
              >
                <div className="w-12 h-12 border-2 border-foreground bg-primary flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 md:px-8 bg-muted border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From whiteboard to documentation in three steps.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create Workspace",
                description: "Start with a blank canvas or duplicate an existing design. Choose from system, architecture, or app templates."
              },
              {
                step: "02",
                title: "Design Architecture",
                description: "Add nodes for services, databases, caches, and queues. Connect them with edges to show data flow and dependencies."
              },
              {
                step: "03",
                title: "Share & Iterate",
                description: "Export your diagrams. Workspaces auto-save. Duplicate and iterate on alternative architectures."
              }
            ].map((item, i) => (
              <div key={item.step} className="flex flex-col">
                <span className="text-6xl font-black text-primary/20 mb-4">{item.step}</span>
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="brutal-card bg-primary text-primary-foreground p-12 border-2 border-foreground">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-4">
              Start Building Systems
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Free to use. No credit card required. Your first architecture diagram is waiting.
            </p>
            <Button size="lg" className="bg-background text-foreground hover:bg-muted rounded-none h-14 px-8 font-black uppercase tracking-widest text-lg border-2 border-foreground" asChild>
              <Link href="/auth/login">
                Create Free Account
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 md:px-8 border-t-2 border-foreground bg-muted">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border-2 border-foreground bg-primary flex items-center justify-center">
              <Box className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-black uppercase tracking-tighter">
              Meshwork Studio
            </span>
          </div>
          <p className="text-sm text-muted-foreground font-bold uppercase tracking-widest">
            System Design Tool © 2026
          </p>
        </div>
      </footer>
    </div>
  );
}
