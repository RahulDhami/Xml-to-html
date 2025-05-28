import { useState, useRef } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface FileUploaderProps {
  onFileLoaded: (content: string) => void;
}

export default function FileUploader({ onFileLoaded }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    // Check if file is XML
    if (!file.name.toLowerCase().endsWith('.xml') && file.type !== 'text/xml') {
      toast({
        title: "Invalid file format",
        description: "Please upload an XML file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 10MB",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
      if (event.target && typeof event.target.result === 'string') {
        onFileLoaded(event.target.result);
      }
    };

    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "There was a problem reading your file. Please try again.",
        variant: "destructive",
      });
    };

    reader.readAsText(file);
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div
      className={cn(
        "border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-colors duration-200",
        isDragging 
          ? "border-primary bg-primary/5" 
          : "border-border hover:border-primary/50",
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
      
      <h3 className="text-lg font-medium mb-2">Upload XML File</h3>
      <p className="text-muted-foreground mb-4 max-w-xs">
        Drag and drop your XML file here, or click to browse
      </p>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,text/xml"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <button
        onClick={handleBrowseClick}
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        Browse files
      </button>
      
      <p className="text-xs text-muted-foreground mt-2">
        XML files up to 10MB
      </p>
    </div>
  );
}
