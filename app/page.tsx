import MarkdownEditor from "@/components/markdown-editor"

export default function Home() {
  return (
    <main className="container mx-auto p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-6 text-center">Real-Time Markdown Editor</h1>
      <MarkdownEditor />
    </main>
  )
}
