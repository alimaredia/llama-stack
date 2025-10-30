"use client";

import React, { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePreview } from "@/components/ui/file-preview";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function UploadFilesPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string>("assistants");

  const onFilesSelected = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setSelectedFiles(prev => [...prev, ...Array.from(fileList)]);
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (event.dataTransfer?.files?.length) {
      onFilesSelected(event.dataTransfer.files);
    }
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const removeAt = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setError(null);
    try {
      for (const file of selectedFiles) {
        const form = new FormData();
        form.append("file", file);
        form.append("purpose", purpose);
        const response = await fetch("/api/v1/files", {
          method: "POST",
          body: form,
        });
        if (!response.ok) {
          const text = await response.text();
          throw new Error(text || `${response.status} ${response.statusText}`);
        }
      }
      setSelectedFiles([]);
      router.push("/files");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Upload Files</h1>
        <Button variant="outline" asChild>
          <Link href="/files">Back to Files</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drag and drop files here</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <label className="block text-sm font-medium">Purpose</label>
            <Select value={purpose} onValueChange={setPurpose}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select purpose" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assistants">assistants</SelectItem>
                <SelectItem value="responses">responses</SelectItem>
                <SelectItem value="fine-tune">fine-tune</SelectItem>
                <SelectItem value="batch">batch</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div
            className="relative flex h-40 w-full items-center justify-center rounded-md border border-dashed border-border bg-background text-sm text-muted-foreground"
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            role="button"
            onClick={() => inputRef.current?.click()}
          >
            <AnimatePresence>
              {isDragging ? (
                <motion.div
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center space-x-2 rounded-md border border-dashed border-border bg-background"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Paperclip className="h-4 w-4" />
                  <span>Drop your files to upload</span>
                </motion.div>
              ) : null}
            </AnimatePresence>
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Click or drag files here</span>
            </div>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={e => onFilesSelected(e.target.files)}
            />
          </div>

          {selectedFiles.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {selectedFiles.map((f, i) => (
                <FilePreview key={`${f.name}-${i}`} file={f} onRemove={() => removeAt(i)} />
              ))}
            </div>
          ) : null}

          <div className="mt-4 flex items-center gap-2">
            <Button onClick={handleUpload} disabled={isUploading || selectedFiles.length === 0}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
            {error ? <span className="text-sm text-destructive">{error}</span> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


