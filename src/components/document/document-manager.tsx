"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { UploadButton, UploadDropzone } from "~/utils/uploadthing";
import { api } from "~/utils/api";
import { File, Download, Trash2, Eye, Upload } from "lucide-react";
import { formatBytes } from "~/lib/utils";
import { type Document } from "@prisma/client";

interface DocumentManagerProps {
  caseId?: string;
  allowUpload?: boolean;
  documents?: Document[];
}

export function DocumentManager({ 
  caseId, 
  allowUpload = true,
  documents: initialDocuments = [] 
}: DocumentManagerProps) {
  const [documents, setDocuments] = useState(initialDocuments);
  const [isUploading, setIsUploading] = useState(false);

  const { data: fetchedDocuments, refetch } = api.document.getByCaseId.useQuery(
    { caseId: caseId ?? "" },
    { enabled: !!caseId }
  );

  const deleteDocumentMutation = api.document.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const updateDocumentMutation = api.document.update.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const displayDocuments = fetchedDocuments ?? documents;

  const handleUploadComplete = (files: { url: string; name: string; size: number }[]) => {
    setIsUploading(false);
    
    // If we have a caseId, associate the uploaded documents with the case
    if (caseId && files.length > 0) {
      files.forEach((file) => {
        updateDocumentMutation.mutate({
          fileUrl: file.url,
          caseId: caseId,
          fileName: file.name,
        });
      });
    }
    
    refetch();
  };

  const handleDelete = (documentId: string) => {
    if (confirm("Are you sure you want to delete this document?")) {
      deleteDocumentMutation.mutate({ id: documentId });
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("image")) return "🖼️";
    if (fileType.includes("pdf")) return "📄";
    if (fileType.includes("word") || fileType.includes("document")) return "📝";
    if (fileType.includes("text")) return "📄";
    return "📁";
  };

  const getFileTypeColor = (fileType: string) => {
    if (fileType.includes("image")) return "bg-green-100 text-green-800";
    if (fileType.includes("pdf")) return "bg-red-100 text-red-800";
    if (fileType.includes("word") || fileType.includes("document")) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {allowUpload && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UploadDropzone
              endpoint="caseDocumentUploader"
              onClientUploadComplete={handleUploadComplete}
              onUploadError={(error: Error) => {
                alert(`Upload failed: ${error.message}`);
                setIsUploading(false);
              }}
              onUploadBegin={() => setIsUploading(true)}
              appearance={{
                container: "border-2 border-dashed border-gray-300 rounded-lg p-8",
                uploadIcon: "text-gray-400",
                label: "text-gray-600",
                allowedContent: "text-gray-500 text-sm",
              }}
            />
            <div className="mt-4 text-sm text-gray-500">
              <p>Supported formats: PDF, DOC, DOCX, TXT, Images</p>
              <p>Maximum file size: 16MB for documents, 8MB for images</p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Documents ({displayDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No documents uploaded yet</p>
              {allowUpload && (
                <p className="text-sm">Upload your first document above</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="text-2xl">
                      {getFileIcon(document.mimeType || "")}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{document.filename}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge 
                          variant="secondary"
                          className={getFileTypeColor(document.mimeType || "")}
                        >
                          {document.mimeType?.split('/')[1]?.toUpperCase() || 'UNKNOWN'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatBytes(document.size || 0)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {document.createdAt.toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(document.url, '_blank')}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const link = window.document.createElement('a');
                        link.href = document.url;
                        link.download = document.filename;
                        link.click();
                      }}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {allowUpload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
