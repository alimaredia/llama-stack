"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const STORAGE_KEY = "llama-stack-processed-files";

interface ProcessedFile {
  id: string;
  filename: string;
  content: string;
  processedAt: string;
}

export default function FileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const fileId = params.id as string;
  const [file, setFile] = useState<ProcessedFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      console.log("Loading file from localStorage, fileId:", fileId);
      if (stored) {
        const files: ProcessedFile[] = JSON.parse(stored);
        console.log("All files in localStorage:", files);
        const foundFile = files.find(f => f.id === fileId);
        console.log("Found file:", foundFile);
        if (foundFile) {
          console.log("File content length:", foundFile.content?.length || 0);
          setFile(foundFile);
        }
      }
    } catch (error) {
      console.error("Error loading file from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, [fileId]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!file) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push("/logs/files")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Files
        </Button>
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">File Not Found</h2>
          <p className="text-gray-500">
            The requested file could not be found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/logs/files")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            {file.filename}
          </h1>
          <p className="text-sm text-muted-foreground">
            Processed on {new Date(file.processedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-semibold mb-4">Converted Markdown</h2>
        {file.content ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {file.content}
            </ReactMarkdown>
          </div>
        ) : (
          <p className="text-muted-foreground">No content available</p>
        )}
      </div>

      <div className="border rounded-lg p-6 bg-card">
        <h2 className="text-lg font-semibold mb-4">Raw Markdown</h2>
        {file.content ? (
          <pre className="bg-muted p-4 rounded-md overflow-auto text-sm">
            <code>{file.content}</code>
          </pre>
        ) : (
          <p className="text-muted-foreground">No content available</p>
        )}
      </div>
    </div>
  );
}
