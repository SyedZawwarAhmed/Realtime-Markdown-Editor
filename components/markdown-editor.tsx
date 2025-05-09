"use client";

import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Clipboard, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Script from "next/script";

const defaultMarkdown = `# Hello, Markdown!

This is a **real-time** markdown editor.

## Features
- Write markdown on the left
- See the preview on the right
- Export to PDF
- Copy to clipboard

### Code Example
\`\`\`javascript
function hello() {
  console.log("Hello, world!");
}
\`\`\`

> This is a blockquote

Enjoy writing markdown!
`;

export default function MarkdownEditor() {
  const [markdown, setMarkdown] = useState<string>(defaultMarkdown);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check if html2pdf is available globally
  useEffect(() => {
    const checkLibraryLoaded = () => {
      if (typeof window !== "undefined" && window.html2pdf) {
        setIsLibraryLoaded(true);
      } else {
        // Check again after a short delay
        setTimeout(checkLibraryLoaded, 500);
      }
    };

    checkLibraryLoaded();

    return () => {
      // Clean up any pending timeouts
      clearTimeout(checkLibraryLoaded as unknown as number);
    };
  }, []);

  const handleCopy = async () => {
    if (!previewRef.current) return;

    try {
      // Get the HTML content from the preview div
      const htmlContent = previewRef.current.innerHTML;

      // Create a blob with HTML content
      const htmlBlob = new Blob([htmlContent], { type: "text/html" });

      // Create a plain text version as fallback
      const textContent = previewRef.current.innerText;
      const textBlob = new Blob([textContent], { type: "text/plain" });

      // Use the clipboard write API to copy HTML content
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": htmlBlob,
          "text/plain": textBlob,
        }),
      ]);

      toast({
        title: "Copied to clipboard",
        description: "The rich text content has been copied to your clipboard",
      });
    } catch (err) {
      console.error("Copy error:", err);

      // Fallback to copying plain text if the rich copy fails
      try {
        await navigator.clipboard.writeText(previewRef.current.innerText);
        toast({
          title: "Copied to clipboard",
          description:
            "The content has been copied as plain text (rich text copy failed)",
        });
      } catch (fallbackErr) {
        toast({
          title: "Failed to copy",
          description: "Could not copy content to clipboard",
          variant: "destructive",
        });
      }
    }
  };

  const handleExport = async () => {
    if (!previewRef.current || !isLibraryLoaded || !window.html2pdf) {
      toast({
        title: "Export failed",
        description: "PDF library not loaded yet. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExporting(true);

      toast({
        title: "Generating PDF",
        description: "Your PDF is being generated",
      });

      const element = previewRef.current;
      const opt = {
        margin: 10,
        filename: "markdown-export.pdf",
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      };

      // Use the global html2pdf function
      await window.html2pdf(element, opt);

      toast({
        title: "PDF exported",
        description: "Your PDF has been downloaded",
      });
    } catch (error) {
      console.error("PDF generation error:", error);
      toast({
        title: "Export failed",
        description: "There was an error generating your PDF",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      {/* Load html2pdf.js from CDN */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        onLoad={() => setIsLibraryLoaded(true)}
        strategy="afterInteractive"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[calc(100vh-120px)]">
        {/* Editor Pane */}
        <div className="border rounded-lg p-4 flex flex-col">
          <div className="text-sm font-medium mb-2 text-muted-foreground">
            Markdown
          </div>
          <Textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            className="flex-1 resize-none font-mono text-sm p-3 focus-visible:ring-0 focus-visible:ring-offset-0"
            placeholder="Type your markdown here..."
          />
        </div>

        {/* Preview Pane */}
        <div className="border rounded-lg p-4 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="text-sm font-medium text-muted-foreground">
              Preview
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy}>
                <Clipboard className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!isLibraryLoaded || isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? "Exporting..." : "Export PDF"}
              </Button>
            </div>
          </div>
          <Separator className="my-2" />
          <div
            ref={previewRef}
            className="flex-1 overflow-auto prose prose-sm max-w-none dark:prose-invert p-3"
          >
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </>
  );
}
