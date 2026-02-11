import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturedCardProps {
  title: string;
  type: string;
  onContinue?: () => void;
}

export function FeaturedCard({ title, type, onContinue }: FeaturedCardProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-primary text-primary-foreground p-8 md:p-10 shadow-xl shadow-primary/30 group transition-transform duration-300 hover:scale-[1.01] hover:shadow-2xl hover:shadow-primary/40">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-900/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl pointer-events-none" />
      
      {/* Decorative arrow (SVG) */}
      <div className="absolute top-8 right-8 text-white/20 rotate-[-15deg] hidden md:block">
        <svg width="80" height="80" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 90C40 80 80 60 90 10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M60 10H90V40" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-start gap-4">
        <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-3 py-1 text-sm font-medium backdrop-blur-sm">
          <span className="flex h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse" />
          Most Recent
        </div>
        
        <div className="mt-2 space-y-2">
          <p className="text-primary-foreground/80 font-medium uppercase tracking-wider text-sm">{type}</p>
          <h2 className="text-3xl md:text-4xl font-serif font-bold leading-tight max-w-lg">
            {title}
          </h2>
        </div>

        <Button 
          onClick={onContinue}
          size="lg" 
          className="mt-6 bg-white text-primary hover:bg-white/90 font-semibold h-12 px-8 rounded-full group shadow-lg shadow-black/10"
        >
          Continue Editing
          <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
