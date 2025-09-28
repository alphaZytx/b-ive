import { promises as fs } from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";

async function loadArchitectureMarkdown() {
  const filePath = path.join(process.cwd(), "docs", "architecture.md");

  try {
    const file = await fs.readFile(filePath, "utf-8");
    return file;
  } catch (error) {
    console.error("Unable to load architecture.md", error);
    return null;
  }
}

export default async function ArchitecturePage() {
  const markdown = await loadArchitectureMarkdown();

  if (!markdown) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-6 py-16">
      <h1 className="text-4xl font-bold text-white">Architecture Overview</h1>
      <div className="prose prose-invert prose-headings:text-brand-accent prose-a:text-brand-accent">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
