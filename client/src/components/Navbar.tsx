import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  Github,
  Code,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  return (
    <header className="border-b border-border bg-background">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and nav links */}
          <div className="flex items-center">
            <Link href="/">
              <a className="flex items-center space-x-2">
                <Code className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">XMLtoHTML</span>
              </a>
            </Link>
            <nav className="hidden md:flex ml-10">
              <ul className="flex space-x-8">
                <li>
                  <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#docs" className="text-muted-foreground hover:text-foreground transition-colors">
                    Documentation
                  </a>
                </li>
              </ul>
            </nav>
          </div>
          
          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button variant="outline" size="icon" asChild>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub repository">
                <Github className="h-5 w-5" />
              </a>
            </Button>
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className={cn(
        "md:hidden absolute w-full bg-background border-b border-border z-50 transform transition-transform duration-200",
        isMenuOpen ? "translate-y-0" : "-translate-y-full"
      )}>
        <nav className="container mx-auto px-4 py-4">
          <ul className="space-y-4">
            <li>
              <a 
                href="#features" 
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Features
              </a>
            </li>
            <li>
              <a 
                href="#docs" 
                className="block py-2 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Documentation
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
