"use client";

import { useParams, usePathname } from "next/navigation";
import {
  PageBreadcrumb,
  BreadcrumbSegment,
} from "@/components/layout/page-breadcrumb";

export default function FilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const fileId = params.id as string;

  const breadcrumbSegments: BreadcrumbSegment[] = [
    { label: "Files", href: "/logs/files" },
    ...(fileId ? [{ label: `Details (${fileId})` }] : []),
  ];

  const isBaseDetailPage = fileId && pathname === `/logs/files/${fileId}`;

  return (
    <div className="space-y-4">
      {isBaseDetailPage && <PageBreadcrumb segments={breadcrumbSegments} />}
      {children}
    </div>
  );
}
