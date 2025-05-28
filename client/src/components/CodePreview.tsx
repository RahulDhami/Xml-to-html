import { useEffect, useRef } from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CodePreviewProps {
  code: string;
  language: "html" | "xml";
}

export default function CodePreview({ code, language }: CodePreviewProps) {
  const codeRef = useRef<HTMLPreElement>(null);
  const { toast } = useToast();

  // Highlight code when component mounts or code changes
  useEffect(() => {
    if (codeRef.current && code) {
      // @ts-ignore - Prism is globally available through CDN
      Prism.highlightElement(codeRef.current);
    }
  }, [code]);

  if (!code) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied to clipboard",
      description: `${language.toUpperCase()} code has been copied`,
    });
  };

  return (
    <div className="relative group">
      <pre
        ref={codeRef}
        className={cn(
          "line-numbers text-sm font-mono rounded-md p-4 overflow-x-auto max-h-96",
          "bg-neutral-50 dark:bg-neutral-900"
        )}
      >
        <code className={`language-${language}`}>{code}</code>
      </pre>
      
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
        aria-label="Copy code"
      >
        <Copy className="h-4 w-4" />
      </Button>
    </div>
  );
}
