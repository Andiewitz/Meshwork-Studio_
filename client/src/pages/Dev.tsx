import { useToast } from "@/hooks/use-toast";
import { GitBranch, Bug, Lightbulb, Terminal } from "lucide-react";

export default function DevPage() {
  const { toast } = useToast();

  return (
    <div className="flex flex-col gap-8 pt-2">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl md:text-5xl font-display font-bold tracking-tight text-foreground leading-[1.1]">
          Dev Documentation
        </h1>
        <p className="text-base font-sans text-muted-foreground max-w-md leading-relaxed">
          System logs, changelog, and technical notes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Changelog Section */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <GitBranch className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-display font-semibold tracking-tight">Changelog</h2>
          </div>
          <div className="space-y-4">
            <div className="border-l-2 border-primary pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-label font-semibold text-primary uppercase tracking-wide">v1.0.0</span>
                <span className="text-xs font-sans text-muted-foreground">2026-03-05</span>
              </div>
              <ul className="text-sm font-sans space-y-1 text-foreground">
                <li>Initial release with workspace management</li>
                <li>Canvas node editor with real-time sync</li>
                <li>User authentication and sessions</li>
                <li>Multi-delete functionality</li>
              </ul>
            </div>
            <div className="border-l-2 border-muted pl-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-label font-semibold text-muted-foreground uppercase tracking-wide">v0.9.0</span>
                <span className="text-xs font-sans text-muted-foreground">2026-03-01</span>
              </div>
              <ul className="text-sm font-sans space-y-1 text-muted-foreground">
                <li>Beta testing release</li>
                <li>Bug fixes and performance improvements</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Known Issues */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-destructive/10 text-destructive flex items-center justify-center">
              <Bug className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-display font-semibold tracking-tight">Known Issues</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-destructive mt-2 shrink-0" />
              <span className="text-sm font-sans">Canvas zoom can be jumpy on trackpads</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-yellow-500 mt-2 shrink-0" />
              <span className="text-sm font-sans">Edge connections sometimes don't snap properly</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-muted-foreground mt-2 shrink-0" />
              <span className="text-sm font-sans">Large workspaces may load slowly</span>
            </li>
          </ul>
        </div>

        {/* Tech Stack */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-foreground/10 flex items-center justify-center">
              <Terminal className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-display font-semibold tracking-tight">Tech Stack</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="font-label text-xs font-semibold uppercase tracking-wide text-muted-foreground">Frontend</h3>
              <ul className="text-sm font-sans space-y-1 text-foreground">
                <li>React + TypeScript</li>
                <li>Tailwind CSS</li>
                <li>Vite</li>
                <li>React Flow</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-label text-xs font-semibold uppercase tracking-wide text-muted-foreground">Backend</h3>
              <ul className="text-sm font-sans space-y-1 text-foreground">
                <li>Node.js + Express</li>
                <li>PostgreSQL</li>
                <li>Drizzle ORM</li>
                <li>Passport.js</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Roadmap */}
        <div className="bg-card p-6 rounded-lg border">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-md bg-primary/10 text-primary flex items-center justify-center">
              <Lightbulb className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-display font-semibold tracking-tight">Roadmap</h2>
          </div>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <span className="text-sm font-sans">Collaborative editing with WebSockets</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
              <span className="text-sm font-sans">Export to PNG/PDF</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-muted-foreground mt-2 shrink-0" />
              <span className="text-sm font-sans">AI-powered layout suggestions</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-2 h-2 rounded-full bg-muted-foreground mt-2 shrink-0" />
              <span className="text-sm font-sans">Mobile app version</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
