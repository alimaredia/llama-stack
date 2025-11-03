"use client";

import React from "react";
import type {
  ListVectorStoresResponse,
  VectorStore,
} from "llama-stack-client/resources/vector-stores/vector-stores";
import { useRouter } from "next/navigation";
import { usePagination } from "@/hooks/use-pagination";
import { useBackendStatus } from "@/hooks/use-backend-status";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { BackendStatus } from "@/components/ui/backend-status";

// Mock data for when backend is not running
const mockVectorStores: VectorStore[] = [
  {
    id: "vs_1234567890",
    name: "Document Store",
    created_at: Math.floor(Date.now() / 1000) - 86400,
    file_counts: {
      completed: 15,
      cancelled: 0,
      failed: 1,
      in_progress: 2,
      total: 18
    },
    usage_bytes: 1048576,
    metadata: {
      provider_id: "chroma",
      provider_vector_db_id: "chroma_db_123"
    }
  },
  {
    id: "vs_0987654321", 
    name: "Research Papers",
    created_at: Math.floor(Date.now() / 1000) - 172800,
    file_counts: {
      completed: 8,
      cancelled: 1,
      failed: 0,
      in_progress: 0,
      total: 9
    },
    usage_bytes: 2097152,
    metadata: {
      provider_id: "qdrant",
      provider_vector_db_id: "qdrant_collection_456"
    }
  }
];

export default function VectorStoresPage() {
  const router = useRouter();
  const { isConnected } = useBackendStatus();
  
  const {
    data: stores,
    status,
    hasMore,
    error,
    loadMore,
  } = usePagination<VectorStore>({
    limit: 20,
    order: "desc",
    fetchFunction: async (client, params) => {
      const response = await client.vectorStores.list({
        after: params.after,
        limit: params.limit,
        order: params.order,
      } as Parameters<typeof client.vectorStores.list>[0]);
      return response as ListVectorStoresResponse;
    },
    errorMessagePrefix: "vector stores",
  });

  // Auto-load all pages for infinite scroll behavior (like Responses)
  React.useEffect(() => {
    if (status === "idle" && hasMore) {
      loadMore();
    }
  }, [status, hasMore, loadMore]);

  const renderContent = () => {
    // Use mock data when backend is not connected
    const displayStores = isConnected ? stores : mockVectorStores;
    const displayStatus = isConnected ? status : "success";

    if (displayStatus === "loading") {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      );
    }

    if (displayStatus === "error" && isConnected) {
      return <div className="text-destructive">Error: {error?.message}</div>;
    }

    if (!displayStores || displayStores.length === 0) {
      return <p>No vector stores found.</p>;
    }

    return (
      <div className="overflow-auto flex-1 min-h-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Completed</TableHead>
              <TableHead>Cancelled</TableHead>
              <TableHead>Failed</TableHead>
              <TableHead>In Progress</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Usage Bytes</TableHead>
              <TableHead>Provider ID</TableHead>
              <TableHead>Provider Vector DB ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayStores.map(store => {
              const fileCounts = store.file_counts;
              const metadata = store.metadata || {};
              const providerId = metadata.provider_id ?? "";
              const providerDbId = metadata.provider_vector_db_id ?? "";

              return (
                <TableRow
                  key={store.id}
                  onClick={() => router.push(`/logs/vector-stores/${store.id}`)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto font-mono text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      onClick={() =>
                        router.push(`/logs/vector-stores/${store.id}`)
                      }
                    >
                      {store.id}
                    </Button>
                  </TableCell>
                  <TableCell>{store.name}</TableCell>
                  <TableCell suppressHydrationWarning>
                    {new Date(store.created_at * 1000).toLocaleString()}
                  </TableCell>
                  <TableCell>{fileCounts.completed}</TableCell>
                  <TableCell>{fileCounts.cancelled}</TableCell>
                  <TableCell>{fileCounts.failed}</TableCell>
                  <TableCell>{fileCounts.in_progress}</TableCell>
                  <TableCell>{fileCounts.total}</TableCell>
                  <TableCell>{store.usage_bytes}</TableCell>
                  <TableCell>{providerId}</TableCell>
                  <TableCell>{providerDbId}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Vector Stores</h1>
      <BackendStatus />
      {renderContent()}
    </div>
  );
}
