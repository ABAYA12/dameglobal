"use client";

export const dynamic = 'force-dynamic';

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DocumentManager } from "~/components/document/document-manager";
import { api } from "~/utils/api";
import { Badge } from "~/components/ui/badge";
import { FileText, Folder, Upload } from "lucide-react";

export default function ClientDocumentsPage() {
  const { data: documents, isLoading } = api.document.getMyDocuments.useQuery();
  const { data: cases } = api.case.getClientCases.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Group documents by case
  const documentsByCase = documents?.reduce((acc: any, doc: any) => {
    const caseId = doc.caseId || 'unassigned';
    if (!acc[caseId]) {
      acc[caseId] = [];
    }
    acc[caseId].push(doc);
    return acc;
  }, {}) || {};

  // Get case details for display
  const getCaseTitle = (caseId: string) => {
    if (caseId === 'unassigned') return 'Unassigned Documents';
    const case_ = cases?.find(c => c.id === caseId);
    return case_ ? `${case_.caseNumber} - ${case_.title}` : 'Unknown Case';
  };

  const totalDocuments = documents?.length || 0;
  const totalSize = documents?.reduce((acc, doc) => acc + (doc.size || 0), 0) || 0;
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Document Center</h1>
        <Badge variant="outline" className="text-sm">
          {totalDocuments} documents • {formatBytes(totalSize)}
        </Badge>
      </div>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload New Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentManager allowUpload={true} />
        </CardContent>
      </Card>

      {/* Documents by Case */}
      <div className="space-y-6">
        {Object.entries(documentsByCase).map(([caseId, caseDocuments]: [string, any]) => (
          <Card key={caseId}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Folder className="h-5 w-5" />
                {getCaseTitle(caseId)}
                <Badge variant="secondary">
                  {(caseDocuments as any[]).length} files
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(caseDocuments as any[]).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No documents in this case yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(caseDocuments as any[]).map((document: any) => (
                    <div
                      key={document.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <div className="text-2xl">
                          {document.mimeType?.includes("image") ? "🖼️" :
                           document.mimeType?.includes("pdf") ? "📄" :
                           document.mimeType?.includes("word") ? "📝" : "📁"}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{document.filename}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {document.folder.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {formatBytes(document.size || 0)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(document.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {document.description && (
                            <p className="text-xs text-gray-600 mt-1">
                              {document.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => window.open(document.url, '_blank')}
                          className="text-blue-600 hover:text-blue-700 text-sm"
                        >
                          View
                        </button>
                        <button
                          onClick={() => {
                            const link = window.document.createElement('a');
                            link.href = document.url;
                            link.download = document.filename;
                            link.click();
                          }}
                          className="text-green-600 hover:text-green-700 text-sm"
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {totalDocuments === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-4">
              Start by uploading your first document using the upload section above.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
