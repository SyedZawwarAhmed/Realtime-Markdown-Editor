"use client";

import { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
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
      // Create a modified version of the HTML with better styling for copying
      const content = previewRef.current.cloneNode(true) as HTMLElement;

      // Fix code blocks for copying
      const codeBlocks = content.querySelectorAll("pre");
      codeBlocks.forEach((pre) => {
        // Ensure code blocks have proper styling when copied
        pre.style.backgroundColor = "#1E1E1E";
        pre.style.color = "#D4D4D4";
        pre.style.padding = "16px";
        pre.style.borderRadius = "6px";
        pre.style.fontFamily = "monospace";
        pre.style.overflow = "auto";
        pre.style.margin = "16px 0";

        // Make sure all code lines are properly contained
        const code = pre.querySelector("code");
        if (code) {
          code.style.display = "block";
          code.style.whiteSpace = "pre";
          code.style.fontFamily = "monospace";
        }
      });

      // Fix blockquotes for copying
      const blockquotes = content.querySelectorAll("blockquote");
      blockquotes.forEach((blockquote) => {
        blockquote.style.borderLeft = "4px solid #cbd5e0";
        blockquote.style.paddingLeft = "16px";
        blockquote.style.fontStyle = "italic";
        blockquote.style.margin = "16px 0";
        blockquote.style.color = "#718096";
      });

      // Get the modified HTML content
      const htmlContent = content.innerHTML;

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

      <style jsx global>{`
        /* Fix for syntax highlighter styling */
        pre {
          position: relative;
          margin: 1em 0 !important;
          padding: 0 !important;
        }

        pre > div {
          margin: 0 !important;
          padding: 1em !important;
          background-color: #1e1e1e !important;
          border-radius: 0.375rem !important;
          overflow: hidden !important;
        }

        pre code {
          font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace !important;
          font-size: 0.875rem !important;
          line-height: 1.7 !important;
          display: block !important;
        }

        /* Fix for blockquote styling */
        blockquote {
          border-left: 4px solid #cbd5e0 !important;
          padding-left: 1rem !important;
          font-style: italic !important;
          margin: 1rem 0 !important;
          color: #718096 !important;
        }
      `}</style>

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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="pre"
                      wrapLines={true}
                      wrapLongLines={true}
                      customStyle={{
                        margin: "1em 0",
                        padding: "1em",
                        borderRadius: "0.375rem",
                        backgroundColor: "#1E1E1E",
                      }}
                      codeTagProps={{
                        style: {
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                          fontSize: "0.875rem",
                          lineHeight: 1.7,
                          display: "block",
                        },
                      }}
                      {...props}
                    >
                      {String(children).replace(/\n$/, "")}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                blockquote({ node, children, ...props }) {
                  return (
                    <blockquote
                      style={{
                        borderLeft: "4px solid #cbd5e0",
                        paddingLeft: "16px",
                        fontStyle: "italic",
                        margin: "16px 0",
                        color: "#718096",
                      }}
                      {...props}
                    >
                      {children}
                    </blockquote>
                  );
                },
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      </div>
    </>
  );
}
