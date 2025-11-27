import { Download, Eye, FileText, Image as ImageIcon, FileArchive, File } from 'lucide-react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { useState } from 'react';
import type { Attachment } from '../types/deal';
import { formatFileSize, isImageFile, isPDFFile } from '@lib/storage';

type Props = {
  attachments: Attachment[];
};

/**
 * Display a list of attachments with preview and download functionality
 */
export default function AttachmentList({ attachments }: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (!attachments || attachments.length === 0) {
    return null;
  }

  const handlePreview = (attachment: Attachment) => {
    if (isImageFile(attachment.name) || isPDFFile(attachment.name)) {
      setPreviewUrl(attachment.url);
    }
  };

  const handleDownload = (attachment: Attachment) => {
    window.open(attachment.url, '_blank');
  };

  const getFileIcon = (filename: string) => {
    if (isImageFile(filename)) {
      return <ImageIcon className="w-5 h-5 text-blue-600" />;
    } else if (isPDFFile(filename)) {
      return <FileText className="w-5 h-5 text-red-600" />;
    } else if (filename.endsWith('.zip') || filename.endsWith('.rar')) {
      return <FileArchive className="w-5 h-5 text-yellow-600" />;
    }
    return <File className="w-5 h-5 text-gray-600" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-gray-600" />
        <h3 className="text-sm font-semibold text-gray-700">
          Attachments ({attachments.length})
        </h3>
      </div>

      <div className="space-y-2">
        {attachments.map((attachment, index) => (
          <Card key={index} className="p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {getFileIcon(attachment.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attachment.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      {formatFileSize(attachment.size)}
                    </Badge>
                    {attachment.type && (
                      <span className="text-xs text-gray-500">{attachment.type}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {(isImageFile(attachment.name) || isPDFFile(attachment.name)) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreview(attachment)}
                    className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDownload(attachment)}
                  className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-6xl max-h-[90vh] w-full h-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPreviewUrl(null)}
              className="absolute top-4 right-4 z-10 bg-white hover:bg-gray-100"
            >
              Close
            </Button>
            {isPDFFile(previewUrl) ? (
              <iframe
                src={previewUrl}
                className="w-full h-full bg-white rounded-lg"
                title="PDF Preview"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full max-h-full object-contain mx-auto"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
