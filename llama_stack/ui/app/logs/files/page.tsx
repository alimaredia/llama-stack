"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthClient } from "@/hooks/use-auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "llama-stack-processed-files";

interface ProcessedFile {
  id: string;
  filename: string;
  content: string;
  processedAt: string;
}

export default function FilesPage() {
  const router = useRouter();
  const client = useAuthClient();
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load files from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedFiles = JSON.parse(stored);
        setFiles(parsedFiles);
      }
    } catch (error) {
      console.error("Error loading files from localStorage:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save files to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
      } catch (error) {
        console.error("Error saving files to localStorage:", error);
      }
    }
  }, [files, isLoading]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to upload");
      return;
    }

    setIsUploading(true);

    try {
      // Create FormData to upload the file
      const formData = new FormData();
      formData.append("file", selectedFile);

      // Call the FileProcessor API to process the uploaded file
      const response = await fetch("/api/v1/file-processors/process-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to process file: ${response.statusText}`);
      }

      const result = await response.json();

      console.log("API Response:", result);
      console.log("Content length:", result.content?.length || 0);

      // Validate that we have content
      if (!result.content) {
        throw new Error("API returned no content");
      }

      // Add the processed file to the list
      const newFile: ProcessedFile = {
        id: crypto.randomUUID(),
        filename: result.filename || selectedFile.name,
        content: result.content,
        processedAt: new Date().toISOString(),
      };

      console.log("Storing file:", newFile);

      setFiles(prev => [newFile, ...prev]);

      toast.success(
        `File processed successfully: ${newFile.filename} has been converted to markdown`
      );

      // Clear the selected file
      setSelectedFile(null);
      // Reset the file input
      const fileInput = document.getElementById(
        "file-upload"
      ) as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(
        `Error processing file: ${error instanceof Error ? error.message : "Unknown error occurred"}`
      );
    } finally {
      setIsUploading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      );
    }

    if (files.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            No files processed yet. Upload a file to get started.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-auto flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Filename</TableHead>
              <TableHead>Processed At</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map(file => (
              <TableRow
                key={file.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/logs/files/${file.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    {file.filename}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(file.processedAt).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    className="p-0 h-auto font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    onClick={e => {
                      e.stopPropagation();
                      router.push(`/logs/files/${file.id}`);
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Files</h1>

        <div className="border rounded-lg p-6 bg-card">
          <h2 className="text-lg font-medium mb-4">Upload File</h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                id="file-upload"
                type="file"
                onChange={handleFileSelect}
                disabled={isUploading}
                accept=".pdf,.docx,.pptx,.html,.png,.jpg,.jpeg"
                className="cursor-pointer"
              />
              {selectedFile && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {selectedFile.name} (
                  {(selectedFile.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="min-w-[120px]"
            >
              {isUploading ? (
                <>
                  <Skeleton className="h-4 w-4 mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Supported formats: PDF, DOCX, PPTX, HTML, PNG, JPG, JPEG
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">{renderContent()}</div>
    </div>
  );
}
