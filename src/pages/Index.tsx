
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeencryptHub } from "@/components/DeencryptHub";
import content from "@/config/content.json";
import { Github, ShieldCheck } from "lucide-react";
import { HeroSection } from "@/components/HeroSection";
import { InfoAccordion } from "@/components/InfoAccordion";

const Index = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 bg-background transition-colors duration-300 font-sans">
      <header className="w-full max-w-4xl mx-auto flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary"/>
            <h1 className="text-3xl font-bold text-foreground">{content.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://encryptioner.github.io/" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
              <Github className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
          </a>
          <ThemeToggle />
        </div>
      </header>
      <main className="w-full flex-grow flex flex-col items-center">
        <HeroSection />
        <InfoAccordion />
        <DeencryptHub />
      </main>
      <footer className="w-full max-w-2xl mx-auto text-center py-8">
        <p className="text-sm text-muted-foreground">{content.subtitle}</p>
        <p className="text-xs text-muted-foreground mt-2">
          Built with ❤️ by <a href="https://lovable.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Lovable</a>.
        </p>
      </footer>
    </div>
  );
};

export default Index;
