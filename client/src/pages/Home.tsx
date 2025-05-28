import XmlConverter from "@/components/XmlConverter";

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-6xl mx-auto">
        <section className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary-500 bg-clip-text text-transparent">
            XML to HTML Converter
          </h1>
          <p className="text-muted-foreground">
            Upload or input XML, preview the resulting HTML, and download the output.
          </p>
        </section>
        
        <XmlConverter />
      </div>
    </div>
  );
}
