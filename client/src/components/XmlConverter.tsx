import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import FileUploader from "./FileUploader";
import CodePreview from "./CodePreview";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Copy, Download, FileDown, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { convertXmlToHtml, formatXml, formatHtml } from "@/lib/xml-converter";
import useLocalStorage from "@/hooks/useLocalStorage";
import JSZip from "jszip";
import FileSaver from "file-saver";

export default function XmlConverter() {
  const [activeTab, setActiveTab] = useState("upload");
  const [xmlInput, setXmlInput] = useLocalStorage("xmlInput", "");
  const [htmlOutput, setHtmlOutput] = useState("");
  const [renderedHtml, setRenderedHtml] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [formattedXml, setFormattedXml] = useState("");
  const { toast } = useToast();

  // Process XML input on change
  useEffect(() => {
    if (xmlInput.trim()) {
      try {
        // Format the XML for display
        const formatted = formatXml(xmlInput);
        setFormattedXml(formatted);
        setError(null);
      } catch (err) {
        // Just format the display but don't show error yet
        setFormattedXml(xmlInput);
      }
    } else {
      setFormattedXml("");
      setHtmlOutput("");
    }
  }, [xmlInput]);

  const handleXmlInput = (value: string) => {
    setXmlInput(value);
    // Clear any previous errors when user starts typing again
    if (error) setError(null);
  };

  const handleFileUpload = (content: string) => {
    setXmlInput(content);
    setActiveTab("input");
    // Clear any previous errors when a new file is uploaded
    if (error) setError(null);
  };

  const handleConvert = async () => {
    if (!xmlInput.trim()) {
      setError("Please provide XML input first");
      return;
    }

    setIsConverting(true);
    try {
      // Convert XML to clean HTML for rendering
      const result = await convertXmlToHtml(xmlInput);
      setRenderedHtml(result);
      
      // Format HTML for code display
      const formattedHtml = formatHtml(result);
      setHtmlOutput(formattedHtml);
      
      setActiveTab("preview");
      setError(null);
      
      toast({
        title: "Conversion successful",
        description: "XML has been converted to HTML",
      });
    } catch (err) {
      setError(
        err instanceof Error 
          ? `Error: ${err.message}` 
          : "Invalid XML format. Please check your input."
      );
    } finally {
      setIsConverting(false);
    }
  };

  const handleCopyHtml = () => {
    if (htmlOutput) {
      navigator.clipboard.writeText(htmlOutput);
      toast({
        title: "Copied to clipboard",
        description: "HTML code has been copied to your clipboard",
      });
    }
  };

  const handleDownloadHtml = () => {
    if (htmlOutput) {
      const blob = new Blob([htmlOutput], { type: "text/html;charset=utf-8" });
      FileSaver.saveAs(blob, "converted.html");
    }
  };

  const handleDownloadZip = async () => {
    if (xmlInput && htmlOutput) {
      const zip = new JSZip();
      zip.file("original.xml", xmlInput);
      zip.file("converted.html", htmlOutput);
      
      const content = await zip.generateAsync({ type: "blob" });
      FileSaver.saveAs(content, "xml-html-conversion.zip");
    }
  };

  const handleReset = () => {
    setXmlInput("");
    setHtmlOutput("");
    setError(null);
    setActiveTab("upload");
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="input">Input</TabsTrigger>
          <TabsTrigger value="preview" disabled={!htmlOutput}>Preview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <FileUploader onFileLoaded={handleFileUpload} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="input" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <label htmlFor="xml-input" className="text-sm font-medium">
                  XML Input
                </label>
                <Textarea
                  id="xml-input"
                  placeholder="Paste your XML here..."
                  className="font-mono h-80 resize-none"
                  value={xmlInput}
                  onChange={(e) => handleXmlInput(e.target.value)}
                />
              </div>
              
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <Button 
                  onClick={handleConvert} 
                  disabled={isConverting || !xmlInput.trim()}
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    "Convert to HTML"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardContent className="pt-6 space-y-6">
              {htmlOutput && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">HTML Preview</h3>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={handleCopyHtml}>
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadHtml}>
                          <FileDown className="h-4 w-4 mr-2" />
                          HTML
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleDownloadZip}>
                          <Download className="h-4 w-4 mr-2" />
                          ZIP
                        </Button>
                      </div>
                    </div>
                    
                    <div className="border rounded-md p-4 bg-white dark:bg-neutral-800">
                      <div dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">HTML Code</h3>
                    <CodePreview code={htmlOutput} language="html" />
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium">Original XML</h3>
                    <CodePreview code={formattedXml} language="xml" />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
