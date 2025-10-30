"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuthClient } from "@/hooks/use-auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FilePreview } from "@/components/ui/file-preview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Upload, 
  Search, 
  FileText, 
  Image, 
  File, 
  Download,
  Trash2,
  Eye,
  Calendar,
  HardDrive,
  Plus,
  Check,
  MoreHorizontal,
  Database
} from "lucide-react";

// Mock data for when backend is not running
const mockFiles = [
  {
    id: "file_7a8b9c2d1e3f",
    name: "document.pdf",
    type: "pdf",
    size: "2.3 MB",
    uploadedAt: "2024-01-15T10:30:00Z",
    status: "processed",
    vectorStoreId: "vs_7a8b9c2d1e3f4g",
    chunks: 45,
    vectorStoreCount: 5
  },
  {
    id: "file_4x5y6z7a8b9c", 
    name: "presentation.pptx",
    type: "presentation",
    size: "5.7 MB",
    uploadedAt: "2024-01-14T14:20:00Z",
    status: "processing",
    vectorStoreId: "vs_7a8b9c2d1e3f4g",
    chunks: 0,
    vectorStoreCount: 10
  },
  {
    id: "file_1m2n3p4q5r6s",
    name: "data.csv",
    type: "spreadsheet", 
    size: "1.2 MB",
    uploadedAt: "2024-01-13T09:15:00Z",
    status: "processed",
    vectorStoreId: "vs_4x5y6z7a8b9c1d",
    chunks: 23,
    vectorStoreCount: 3
  },
  {
    id: "file_9t8u7v6w5x4y",
    name: "image.jpg",
    type: "image",
    size: "3.1 MB", 
    uploadedAt: "2024-01-12T16:45:00Z",
    status: "processed",
    vectorStoreId: "vs_7a8b9c2d1e3f4g",
    chunks: 12,
    vectorStoreCount: 1
  },
  {
    id: "file_3z2a1b4c5d6e",
    name: "report.docx",
    type: "document",
    size: "4.8 MB",
    uploadedAt: "2024-01-11T11:30:00Z", 
    status: "error",
    vectorStoreId: null,
    chunks: 0,
    vectorStoreCount: 0
  }
];

// Mock vector stores for the modal
const mockVectorStores = [
  { id: "vs_7a8b9c2d1e3f4g", name: "Document Store", fileCount: 15 },
  { id: "vs_4x5y6z7a8b9c1d", name: "Research Papers", fileCount: 8 },
  { id: "vs_1m2n3p4q5r6s7t", name: "Legal Documents", fileCount: 3 },
  { id: "vs_9t8u7v6w5x4y3z", name: "Technical Docs", fileCount: 12 }
];

// Mock vector store details for individual files
const mockFileVectorStores = {
  "file_7a8b9c2d1e3f": [
    { id: "vs_7a8b9c2d1e3f4g", name: "Document Store", addedAt: "2024-01-15T10:35:00Z", chunks: 45 },
    { id: "vs_4x5y6z7a8b9c1d", name: "Research Papers", addedAt: "2024-01-15T11:20:00Z", chunks: 12 },
    { id: "vs_1m2n3p4q5r6s7t", name: "Legal Documents", addedAt: "2024-01-15T14:10:00Z", chunks: 8 },
    { id: "vs_9t8u7v6w5x4y3z", name: "Technical Docs", addedAt: "2024-01-15T16:45:00Z", chunks: 15 },
    { id: "vs_2a3b4c5d6e7f8g", name: "Archive Store", addedAt: "2024-01-16T09:30:00Z", chunks: 10 }
  ],
  "file_4x5y6z7a8b9c": [
    { id: "vs_7a8b9c2d1e3f4g", name: "Document Store", addedAt: "2024-01-14T14:25:00Z", chunks: 0 },
    { id: "vs_4x5y6z7a8b9c1d", name: "Research Papers", addedAt: "2024-01-14T15:10:00Z", chunks: 0 },
    { id: "vs_1m2n3p4q5r6s7t", name: "Legal Documents", addedAt: "2024-01-14T16:20:00Z", chunks: 0 },
    { id: "vs_9t8u7v6w5x4y3z", name: "Technical Docs", addedAt: "2024-01-14T17:15:00Z", chunks: 0 },
    { id: "vs_2a3b4c5d6e7f8g", name: "Archive Store", addedAt: "2024-01-14T18:00:00Z", chunks: 0 },
    { id: "vs_5h6i7j8k9l0m1n", name: "Presentation Store", addedAt: "2024-01-14T19:30:00Z", chunks: 0 },
    { id: "vs_3o4p5q6r7s8t9u", name: "Media Store", addedAt: "2024-01-15T08:45:00Z", chunks: 0 },
    { id: "vs_7v8w9x0y1z2a3b", name: "Training Data", addedAt: "2024-01-15T10:20:00Z", chunks: 0 },
    { id: "vs_4c5d6e7f8g9h0i", name: "Analytics Store", addedAt: "2024-01-15T12:15:00Z", chunks: 0 },
    { id: "vs_1j2k3l4m5n6o7p", name: "Backup Store", addedAt: "2024-01-15T14:30:00Z", chunks: 0 }
  ],
  "file_1m2n3p4q5r6s": [
    { id: "vs_4x5y6z7a8b9c1d", name: "Research Papers", addedAt: "2024-01-13T09:20:00Z", chunks: 23 },
    { id: "vs_9t8u7v6w5x4y3z", name: "Technical Docs", addedAt: "2024-01-13T10:15:00Z", chunks: 15 },
    { id: "vs_2a3b4c5d6e7f8g", name: "Archive Store", addedAt: "2024-01-13T11:30:00Z", chunks: 8 }
  ],
  "file_9t8u7v6w5x4y": [
    { id: "vs_7a8b9c2d1e3f4g", name: "Document Store", addedAt: "2024-01-12T16:50:00Z", chunks: 12 }
  ],
  "file_3z2a1b4c5d6e": []
};

const getFileIcon = (type: string) => {
  switch (type) {
    case "pdf":
    case "document":
      return <FileText className="h-5 w-5 text-red-500" />;
    case "image":
      return <Image className="h-5 w-5 text-green-500" />;
    case "presentation":
      return <File className="h-5 w-5 text-orange-500" />;
    case "spreadsheet":
      return <File className="h-5 w-5 text-green-600" />;
    default:
      return <File className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "processed":
      return <Badge variant="default" className="bg-green-100 text-green-800">Processed</Badge>;
    case "processing":
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processing</Badge>;
    case "error":
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="outline">Unknown</Badge>;
  }
};

export default function FilesPage() {
  const router = useRouter();
  const [files, setFiles] = useState(mockFiles);
  const [searchTerm, setSearchTerm] = useState("");
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isVectorStoreModalOpen, setIsVectorStoreModalOpen] = useState(false);
  const [selectedVectorStore, setSelectedVectorStore] = useState<string>("");
  const [isVectorStoresListModalOpen, setIsVectorStoresListModalOpen] = useState(false);
  const [selectedFileForVectorStores, setSelectedFileForVectorStores] = useState<string>("");
  const [vectorStores, setVectorStores] = useState<Array<{ id: string; name?: string }>>([]);
  const [isLoadingVectorStores, setIsLoadingVectorStores] = useState(false);
  const [vectorStoresError, setVectorStoresError] = useState<string | null>(null);
  const [isAddingToVectorStore, setIsAddingToVectorStore] = useState(false);
  const [fileStores, setFileStores] = useState<Array<{ id: string; name?: string }>>([]);
  const [isLoadingFileStores, setIsLoadingFileStores] = useState(false);
  const [fileStoresError, setFileStoresError] = useState<string | null>(null);
  const client = useAuthClient();
  const [isLoadingVSCounts, setIsLoadingVSCounts] = useState(false);
  const [fileVSCounts, setFileVSCounts] = useState<Record<string, number>>({});

  // Upload modal state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [purpose, setPurpose] = useState<string>("assistants");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Check if backend is connected
  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch('/api/v1/health');
        setIsBackendConnected(response.ok);
      } catch (error) {
        setIsBackendConnected(false);
      }
    };
    checkBackend();
  }, []);

  // Load real vector stores when backend is connected and modal opens (via authed client)
  useEffect(() => {
    if (!isBackendConnected || !isVectorStoreModalOpen) return;
    let cancelled = false;
    const loadVectorStores = async () => {
      setIsLoadingVectorStores(true);
      setVectorStoresError(null);
      try {
        const resp = await client.vectorStores.list({ limit: 100, order: 'desc' } as any);
        const list = (resp as any)?.data ?? [];
        if (!cancelled) setVectorStores(list as Array<{ id: string; name?: string }>);
      } catch (_) {
        if (!cancelled) setVectorStoresError('Failed to load vector stores');
      } finally {
        if (!cancelled) setIsLoadingVectorStores(false);
      }
    };
    loadVectorStores();
    return () => {
      cancelled = true;
    };
  }, [isBackendConnected, isVectorStoreModalOpen]);

  // Load real files when backend is connected
  useEffect(() => {
    if (!isBackendConnected) return;
    let cancelled = false;
    const inferTypeFromFilename = (filename: string): string => {
      const name = (filename || "").toLowerCase();
      if (/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)$/.test(name)) return "image";
      if (/\.pdf$/.test(name)) return "pdf";
      if (/(\.ppt|\.pptx|\.key)$/.test(name)) return "presentation";
      if (/(\.xls|\.xlsx|\.csv)$/.test(name)) return "spreadsheet";
      if (/(\.doc|\.docx|\.md|\.txt)$/.test(name)) return "document";
      return "document";
    };
    const formatBytes = (bytes?: number) => {
      if (!bytes || bytes <= 0) return "—";
      const units = ["B", "KB", "MB", "GB", "TB"]; 
      let i = 0;
      let n = bytes;
      while (n >= 1024 && i < units.length - 1) {
        n /= 1024;
        i += 1;
      }
      return `${n.toFixed(1)} ${units[i]}`;
    };
    const loadFiles = async () => {
      try {
        const resp = await fetch('/api/v1/files');
        if (!resp.ok) return;
        const data = await resp.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
        const mapped = list.map((f: any) => ({
          id: f.id,
          name: f.name || f.filename || '',
          type: inferTypeFromFilename(f.name || f.filename || ''),
          size: formatBytes((f.size_bytes ?? f.bytes) as number),
          uploadedAt: f.created_at ? new Date(f.created_at * 1000).toISOString() : new Date().toISOString(),
          status: 'processed',
          vectorStoreId: null,
          chunks: 0,
          vectorStoreCount: 0,
        }));
        if (!cancelled) setFiles(mapped);
      } catch (_) {
        // noop
      }
    };
    loadFiles();
    return () => {
      cancelled = true;
    };
  }, [isBackendConnected]);

  // Load vector store counts for the listed files
  const fileIdsKey = useMemo(() => files.map(f => f.id).sort().join(','), [files]);
  useEffect(() => {
    if (!isBackendConnected) return;
    if (!files || files.length === 0) return;
    let cancelled = false;
    const loadCounts = async () => {
      try {
        setIsLoadingVSCounts(true);
        const fileIdSet = new Set(files.map(f => f.id));
        const vsResp: any = await client.vectorStores.list({ limit: 100, order: 'desc' } as any);
        const stores: any[] = vsResp?.data ?? [];
        const counts: Record<string, number> = {};
        const storesToCheck = stores.filter((s: any) => (s?.file_counts?.total ?? 0) > 0);
        await Promise.all(
          storesToCheck.map(async (store: any) => {
            try {
              const page: any = await client.vectorStores.files.list(store.id, { limit: 1000, order: 'desc' } as any);
              const items: any[] = page?.data ?? [];
              for (const it of items) {
                const fid = it?.id;
                if (fid && fileIdSet.has(fid)) {
                  counts[fid] = (counts[fid] || 0) + 1;
                }
              }
            } catch {
              // ignore store-level errors
            }
          })
        );
        if (!cancelled) setFileVSCounts(counts);
      } catch {
        // ignore
      } finally {
        if (!cancelled) setIsLoadingVSCounts(false);
      }
    };
    loadCounts();
    return () => {
      cancelled = true;
    };
  }, [isBackendConnected, fileIdsKey, client.vectorStores]);

  const reloadFiles = async () => {
    if (!isBackendConnected) return;
    try {
      const resp = await fetch('/api/v1/files');
      if (!resp.ok) return;
      const data = await resp.json();
      const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
      const inferTypeFromFilename = (filename: string): string => {
        const name = (filename || "").toLowerCase();
        if (/(\.png|\.jpg|\.jpeg|\.gif|\.webp|\.bmp|\.svg)$/.test(name)) return "image";
        if (/\.pdf$/.test(name)) return "pdf";
        if (/(\.ppt|\.pptx|\.key)$/.test(name)) return "presentation";
        if (/(\.xls|\.xlsx|\.csv)$/.test(name)) return "spreadsheet";
        if (/(\.doc|\.docx|\.md|\.txt)$/.test(name)) return "document";
        return "document";
      };
      const formatBytes = (bytes?: number) => {
        if (!bytes || bytes <= 0) return "—";
        const units = ["B", "KB", "MB", "GB", "TB"]; 
        let i = 0;
        let n = bytes as number;
        while (n >= 1024 && i < units.length - 1) {
          n /= 1024;
          i += 1;
        }
        return `${n.toFixed(1)} ${units[i]}`;
      };
      const mapped = list.map((f: any) => ({
        id: f.id,
        name: f.name || f.filename || '',
        type: inferTypeFromFilename(f.name || f.filename || ''),
        size: typeof (f.size_bytes ?? f.bytes) === 'number' ? formatBytes((f.size_bytes ?? f.bytes) as number) : '—',
        uploadedAt: f.created_at ? new Date(f.created_at * 1000).toISOString() : new Date().toISOString(),
        status: 'processed',
        vectorStoreId: null,
        vectorStoreCount: 0,
      }));
      setFiles(mapped);
    } catch (_) {
      // ignore
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = () => {
    setIsUploadModalOpen(true);
  };

  const handleViewFile = (fileId: string) => {
    router.push(`/files/${fileId}`);
  };

  const handleDeleteFile = async (fileId: string) => {
    const proceed = confirm("Delete this file? This cannot be undone.");
    if (!proceed) return;
    try {
      if (isBackendConnected) {
        await client.files.delete(fileId as any);
      }
      setFiles(prev => prev.filter(file => file.id !== fileId));
      setSelectedFiles(prev => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      setFileVSCounts(prev => {
        const { [fileId]: _omit, ...rest } = prev;
        return rest;
      });
    } catch (e) {
      alert(`Failed to delete file: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  const handleAddSingleFileToVectorStore = (fileId: string) => {
    setSelectedFiles(new Set([fileId]));
    setIsVectorStoreModalOpen(true);
  };

  const handleViewVectorStores = (fileId: string) => {
    setSelectedFileForVectorStores(fileId);
    setIsVectorStoresListModalOpen(true);
  };

  // Load real vector stores for selected file when the modal opens
  useEffect(() => {
    if (!isBackendConnected || !isVectorStoresListModalOpen || !selectedFileForVectorStores) return;
    let cancelled = false;
    const loadFileStores = async () => {
      setIsLoadingFileStores(true);
      setFileStoresError(null);
      setFileStores([]);
      try {
        const vsResp: any = await client.vectorStores.list({ limit: 100, order: 'desc' } as any);
        const stores: any[] = vsResp?.data ?? [];
        const result: Array<{ id: string; name?: string }> = [];
        for (const store of stores) {
          try {
            const filesPage: any = await client.vectorStores.files.list(store.id, { limit: 1000, order: 'desc' } as any);
            const items: any[] = filesPage?.data ?? [];
            if (items.some((it: any) => it?.id === selectedFileForVectorStores)) {
              result.push({ id: store.id, name: store.name });
            }
          } catch {
            // ignore store-level errors
          }
        }
        if (!cancelled) setFileStores(result);
      } catch (e) {
        if (!cancelled) setFileStoresError(e instanceof Error ? e.message : 'Failed to load vector stores');
      } finally {
        if (!cancelled) setIsLoadingFileStores(false);
      }
    };
    loadFileStores();
    return () => {
      cancelled = true;
    };
  }, [isBackendConnected, isVectorStoresListModalOpen, selectedFileForVectorStores, client.vectorStores]);

  const handleSelectFile = (fileId: string, checked: boolean) => {
    const newSelected = new Set(selectedFiles);
    if (checked) {
      newSelected.add(fileId);
    } else {
      newSelected.delete(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = (checked: boolean | string) => {
    const isChecked = checked === true;
    if (isChecked) {
      setSelectedFiles(new Set(filteredFiles.map(file => file.id)));
    } else {
      setSelectedFiles(new Set());
    }
  };

  const handleAddToVectorStore = () => {
    if (selectedFiles.size === 0) {
      alert("Please select at least one file");
      return;
    }
    setIsVectorStoreModalOpen(true);
  };

  const handleConfirmAddToVectorStore = async () => {
    if (!selectedVectorStore) {
      alert("Please select a vector store");
      return;
    }
    try {
      setIsAddingToVectorStore(true);
      const fileIds = Array.from(selectedFiles);
      await Promise.all(
        fileIds.map(fileId => client.vectorStores.files.create(selectedVectorStore, { file_id: fileId } as any))
      );
      // Optimistically update local UI
      setFiles(files.map(file => 
        selectedFiles.has(file.id) 
          ? { ...file, vectorStoreId: selectedVectorStore, status: "processing" as const }
          : file
      ));
      // Optimistically increment counts
      setFileVSCounts(prev => {
        const next = { ...prev };
        for (const fid of fileIds) {
          next[fid] = (next[fid] || 0) + 1;
        }
        return next;
      });
      setSelectedFiles(new Set());
      setSelectedVectorStore("");
      setIsVectorStoreModalOpen(false);
      alert(`Added ${fileIds.length} file(s) to vector store`);
    } catch (e) {
      alert(`Failed to add to vector store: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsAddingToVectorStore(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedFiles.size === 0) {
      alert("Please select at least one file");
      return;
    }
    const proceed = confirm(`Are you sure you want to delete ${selectedFiles.size} file(s)?`);
    if (!proceed) return;
    try {
      if (isBackendConnected) {
        await Promise.all(Array.from(selectedFiles).map(fid => client.files.delete(fid as any)));
      }
      const ids = new Set(selectedFiles);
      setFiles(prev => prev.filter(file => !ids.has(file.id)));
      setSelectedFiles(new Set());
      setFileVSCounts(prev => {
        const next: Record<string, number> = {};
        for (const [k, v] of Object.entries(prev)) {
          if (!ids.has(k)) next[k] = v;
        }
        return next;
      });
    } catch (e) {
      alert(`Failed to delete some files: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Files</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your uploaded files and documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedFiles.size > 0 && (
            <>
              <Button 
                variant="outline" 
                onClick={handleAddToVectorStore}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add to Vector Store ({selectedFiles.size})
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteSelected}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Delete ({selectedFiles.size})
              </Button>
            </>
          )}
          <Button onClick={handleUpload} className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload Files
          </Button>
        </div>
      </div>

      {/* Backend Status */}
      {!isBackendConnected && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
              <HardDrive className="h-5 w-5" />
              <span className="font-medium">Demo Mode</span>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Backend server is not running. Showing placeholder data. 
              Connect to a Llama Stack server to manage real files.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search files..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {filteredFiles.length} files
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead className="w-[120px]">File Size</TableHead>
                    <TableHead className="w-[150px]">Created</TableHead>
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px]">Vector Stores</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFiles.map((file) => (
                  <TableRow key={file.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedFiles.has(file.id)}
                        onCheckedChange={(checked: boolean | string) => handleSelectFile(file.id, checked === true)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {file.id}
                    </TableCell>
                    <TableCell className="max-w-[420px]">
                      <div className="flex items-center gap-2 min-w-0">
                        {getFileIcon(file.type)}
                        <span className="font-medium truncate w-full" title={file.name}>{file.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {file.size}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const count = fileVSCounts[file.id] || 0;
                        if (count === 0 && file.status !== "processing" && file.status !== "error") {
                          return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Uploaded</Badge>;
                        }
                        return getStatusBadge(file.status);
                      })()}
                    </TableCell>
                    <TableCell>
                      {(fileVSCounts[file.id] || 0) > 0 ? (
                        <button
                          onClick={() => handleViewVectorStores(file.id)}
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium transition-colors"
                        >
                          {fileVSCounts[file.id] || 0}
                        </button>
                      ) : (
                        <span className="text-gray-400">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewFile(file.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAddSingleFileToVectorStore(file.id)}>
                              <Plus className="h-4 w-4 mr-2" />
                              Add to Vector Store
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteFile(file.id)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete File
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredFiles.length === 0 && (
        <Card>
          <CardContent className="pt-12 pb-12 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No files found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {searchTerm ? "Try adjusting your search terms" : "Upload your first file to get started"}
            </p>
            <Button onClick={handleUpload}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Files
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Vector Store Selection Modal */}
      <Dialog open={isVectorStoreModalOpen} onOpenChange={setIsVectorStoreModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Files to Vector Store</DialogTitle>
            <DialogDescription>
              Select a vector store to add {selectedFiles.size} selected file(s) to.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vector Store</label>
              <Select value={selectedVectorStore} onValueChange={setSelectedVectorStore}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a vector store" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingVectorStores ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
                  ) : vectorStoresError ? (
                    <div className="px-3 py-2 text-sm text-destructive">{vectorStoresError}</div>
                  ) : vectorStores.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No vector stores found</div>
                  ) : (
                    vectorStores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{store.name || store.id}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>Selected files:</p>
              <ul className="list-disc list-inside mt-1">
                {Array.from(selectedFiles).map(fileId => {
                  const file = files.find(f => f.id === fileId);
                  return file ? (
                    <li key={fileId} className="text-xs">{file.name}</li>
                  ) : null;
                })}
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsVectorStoreModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmAddToVectorStore}
              disabled={!selectedVectorStore || isAddingToVectorStore}
            >
              <Check className="h-4 w-4 mr-2" />
              {isAddingToVectorStore ? 'Adding...' : 'Add to Vector Store'}
            </Button>
          </DialogFooter>
        </DialogContent>
        </Dialog>

        {/* Vector Stores List Modal */}
        <Dialog open={isVectorStoresListModalOpen} onOpenChange={setIsVectorStoresListModalOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Vector Stores for File</DialogTitle>
              <DialogDescription>
                Vector stores containing this file and their details.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {isLoadingFileStores ? (
                <div className="text-center py-8 text-gray-500">Loading...</div>
              ) : fileStoresError ? (
                <div className="text-center py-8 text-destructive">{fileStoresError}</div>
              ) : fileStores.length > 0 ? (
                <div className="space-y-3">
                  {fileStores.map((store) => (
                    <div key={store.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{store.name || store.id}</h4>
                        <p className="text-xs text-gray-500">ID: {store.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No vector stores found for this file.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsVectorStoresListModalOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Upload Files Modal */}
        <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Upload Files</DialogTitle>
              <DialogDescription>Drag and drop files or choose from your computer.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Purpose</label>
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
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer?.files?.length) {
                    setSelectedUploadFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                }}
              >
                <div className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  <span>Drop files here or click to select</span>
                </div>
                <input
                  type="file"
                  multiple
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files?.length) {
                      setSelectedUploadFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                    }
                  }}
                />
              </div>

              {selectedUploadFiles.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedUploadFiles.map((f, i) => (
                    <FilePreview
                      key={`${f.name}-${i}`}
                      file={f}
                      onRemove={() => setSelectedUploadFiles(prev => prev.filter((_, idx) => idx !== i))}
                    />
                  ))}
                </div>
              ) : null}

              {uploadError ? (
                <div className="text-sm text-destructive">{uploadError}</div>
              ) : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsUploadModalOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={selectedUploadFiles.length === 0 || isUploading}
                onClick={async () => {
                  if (selectedUploadFiles.length === 0) return;
                  setIsUploading(true);
                  setUploadError(null);
                  try {
                    for (const file of selectedUploadFiles) {
                      const form = new FormData();
                      form.append('file', file);
                      form.append('purpose', purpose);
                      const resp = await fetch('/api/v1/files', { method: 'POST', body: form });
                      if (!resp.ok) {
                        const text = await resp.text();
                        throw new Error(text || `${resp.status} ${resp.statusText}`);
                      }
                    }
                    setSelectedUploadFiles([]);
                    setIsUploadModalOpen(false);
                    await reloadFiles();
                  } catch (e) {
                    setUploadError(e instanceof Error ? e.message : 'Upload failed');
                  } finally {
                    setIsUploading(false);
                  }
                }}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }
