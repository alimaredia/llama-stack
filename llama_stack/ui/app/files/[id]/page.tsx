"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

interface FileDetails {
  id: string;
  name?: string;
  filename?: string;
  size_bytes?: number;
  created_at?: number;
  metadata?: Record<string, unknown> | null;
  [key: string]: unknown;
}

export default function EditFilePage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const router = useRouter();

  const [file, setFile] = useState<FileDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [metadataText, setMetadataText] = useState<string>("{}");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) return;
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/files/${id}`, { method: "GET" });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const data: FileDetails = await response.json();
        if (!cancelled) {
          setFile(data);
          setName(data.name || data.filename || "");
          const md = data.metadata ?? {};
          setMetadataText(JSON.stringify(md, null, 2));
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const parsedMetadata = useMemo(() => {
    try {
      const obj = JSON.parse(metadataText);
      if (obj && typeof obj === "object" && !Array.isArray(obj)) return obj as Record<string, unknown>;
      return {} as Record<string, unknown>;
    } catch (_) {
      return null;
    }
  }, [metadataText]);

  const canSave = parsedMetadata !== null && !isSaving;

  const handleSave = async () => {
    if (!id || !canSave) return;
    setIsSaving(true);
    setError(null);
    try {
      const body = {
        name: name || undefined,
        metadata: parsedMetadata ?? undefined,
      };
      const response = await fetch(`/api/v1/files/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `${response.status} ${response.statusText}`);
      }
      router.push("/files");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit File</h1>
        <Button variant="outline" asChild>
          <Link href="/files">Back to Files</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : error ? (
            <div className="text-sm text-destructive">{error}</div>
          ) : file ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">ID</label>
                  <div className="text-sm font-mono break-all">{file.id}</div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Size</label>
                  <div className="text-sm">{formatBytes(file.size_bytes)}</div>
                </div>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Name</label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. document.pdf" />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Metadata (JSON)</label>
                <textarea
                  className="w-full min-h-40 rounded-md border bg-background p-2 font-mono text-sm"
                  value={metadataText}
                  onChange={e => setMetadataText(e.target.value)}
                />
                {parsedMetadata === null ? (
                  <p className="mt-1 text-xs text-destructive">Invalid JSON</p>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={handleSave} disabled={!canSave}>{isSaving ? "Saving..." : "Save"}</Button>
                {error ? <span className="text-sm text-destructive">{error}</span> : null}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground">File not found.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatBytes(bytes?: number) {
  if (!bytes || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"]; 
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  return `${n.toFixed(1)} ${units[i]}`;
}



