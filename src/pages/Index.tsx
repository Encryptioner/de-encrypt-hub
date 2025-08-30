
import { ThemeToggle } from "@/components/ThemeToggle";
import { DeencryptHub } from "@/components/DeencryptHub";
import content from "@/config/content.json";
import { Github, Linkedin, Twitter, Globe, Mail } from "lucide-react";
import { HeroSection } from "@/components/HeroSection";
import { InfoAccordion } from "@/components/InfoAccordion";
import { ColorfulLockIcon } from "@/components/ColorfulLockIcon";

const Index = () => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 bg-background transition-colors duration-300 font-sans">
      <header className="w-full max-w-4xl mx-auto flex justify-between items-center mb-8 flex-wrap gap-y-4">
        <div className="flex items-center gap-3">
            <ColorfulLockIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold text-foreground">{content.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href="https://github.com/Encryptioner" target="_blank" rel="noopener noreferrer" aria-label="GitHub Repository">
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
        <div className="mt-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Developed by <a href="https://encryptioner.github.io/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ankur Mursalin</a>
          </p>
          <div className="flex justify-center items-center gap-4">
            <a href="https://github.com/encryptioner" target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="text-muted-foreground hover:text-foreground transition-colors">
              <Github className="h-5 w-5" />
            </a>
            <a href="https://www.linkedin.com/in/mir-mursalin-ankur" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-muted-foreground hover:text-foreground transition-colors">
              <Linkedin className="h-5 w-5" />
            </a>
            <a href="https://x.com/AnkurMursalin" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="text-muted-foreground hover:text-foreground transition-colors">
              <Twitter className="h-5 w-5" />
            </a>
            <a href="https://encryptioner.github.io/" target="_blank" rel="noopener noreferrer" aria-label="Website" className="text-muted-foreground hover:text-foreground transition-colors">
              <Globe className="h-5 w-5" />
            </a>
            <a href="mailto:mir.ankur.ruet13@gmail.com" aria-label="Email" className="text-muted-foreground hover:text-foreground transition-colors">
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
