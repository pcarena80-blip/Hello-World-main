import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Upload, X, File, Image, FileText, Video, Archive, Music } from 'lucide-react';

interface FileUploadProps {
  projectId?: string;
  taskId?: string;
  onUploadComplete?: (file: any) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in MB
  allowedTypes?: string[];
  className?: string;
}

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function FileUpload({
  projectId,
  taskId,
  onUploadComplete,
  onUploadError,
  maxFileSize = 50,
  allowedTypes = [],
  className = ''
}: FileUploadProps) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'archive':
        return <Archive className="h-4 w-4" />;
      case 'music':
        return <Music className="h-4 w-4" />;
      default:
        return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`;
    }

    // Check file type if specified
    if (allowedTypes.length > 0) {
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!allowedTypes.includes(fileExtension)) {
        return `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`;
      }
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      onUploadError?.(validationError);
      toast({
        title: 'Upload Error',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    const uploadingFile: UploadingFile = {
      id: Date.now().toString(),
      file,
      progress: 0,
      status: 'uploading'
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('organizationId', currentOrganization?.id || '');
      if (projectId) formData.append('projectId', projectId);
      if (taskId) formData.append('taskId', taskId);
      formData.append('uploadedBy', user?.id?.toString() || '');

      console.log('Starting file upload:', {
        fileName: file.name,
        fileSize: file.size,
        organizationId: currentOrganization?.id,
        projectId,
        taskId,
        uploadedBy: user?.id
      });

      // Try fetch first, fallback to XMLHttpRequest
      try {
        const response = await fetch('/api/files/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'user-id': user?.id?.toString() || '',
            'user-name': user?.name || user?.email || 'Unknown'
          }
        });

        console.log('Upload response status:', response.status);
        
        if (response.ok) {
          const result = await response.json();
          console.log('Upload successful:', result);
          
          setUploadingFiles(prev => 
            prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'success', progress: 100 } : f)
          );
          
          onUploadComplete?.(result.file);
          toast({
            title: 'Upload Successful',
            description: `${file.name} uploaded successfully`,
          });

          // Remove from uploading files after 2 seconds
          setTimeout(() => {
            setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id));
          }, 2000);
        } else {
          const error = await response.json();
          console.error('Upload failed:', error);
          
          setUploadingFiles(prev => 
            prev.map(f => f.id === uploadingFile.id ? { 
              ...f, 
              status: 'error', 
              error: error.error || `Upload failed (${response.status})` 
            } : f)
          );
          
          onUploadError?.(error.error || `Upload failed (${response.status})`);
          toast({
            title: 'Upload Failed',
            description: error.error || `Upload failed (${response.status})`,
            variant: 'destructive',
          });
        }
      } catch (fetchError) {
        console.error('Fetch upload failed, trying XMLHttpRequest:', fetchError);
        
        // Fallback to XMLHttpRequest
        const xhr = new XMLHttpRequest();

        // Track upload progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setUploadingFiles(prev => 
              prev.map(f => f.id === uploadingFile.id ? { ...f, progress } : f)
            );
          }
        });

      xhr.addEventListener('load', () => {
        console.log('Upload response status:', xhr.status);
        console.log('Upload response:', xhr.responseText);
        
        if (xhr.status === 201) {
          try {
            const response = JSON.parse(xhr.responseText);
            setUploadingFiles(prev => 
              prev.map(f => f.id === uploadingFile.id ? { ...f, status: 'success', progress: 100 } : f)
            );
            
            onUploadComplete?.(response.file);
            toast({
              title: 'Upload Successful',
              description: `${file.name} uploaded successfully`,
            });

            // Remove from uploading files after 2 seconds
            setTimeout(() => {
              setUploadingFiles(prev => prev.filter(f => f.id !== uploadingFile.id));
            }, 2000);
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            setUploadingFiles(prev => 
              prev.map(f => f.id === uploadingFile.id ? { 
                ...f, 
                status: 'error', 
                error: 'Invalid server response' 
              } : f)
            );
            onUploadError?.('Invalid server response');
            toast({
              title: 'Upload Failed',
              description: 'Invalid server response',
              variant: 'destructive',
            });
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            setUploadingFiles(prev => 
              prev.map(f => f.id === uploadingFile.id ? { 
                ...f, 
                status: 'error', 
                error: error.error || `Upload failed (${xhr.status})` 
              } : f)
            );
            
            onUploadError?.(error.error || `Upload failed (${xhr.status})`);
            toast({
              title: 'Upload Failed',
              description: error.error || `Upload failed (${xhr.status})`,
              variant: 'destructive',
            });
          } catch (parseError) {
            console.error('Error parsing error response:', parseError);
            setUploadingFiles(prev => 
              prev.map(f => f.id === uploadingFile.id ? { 
                ...f, 
                status: 'error', 
                error: `Upload failed (${xhr.status})` 
              } : f)
            );
            onUploadError?.(`Upload failed (${xhr.status})`);
            toast({
              title: 'Upload Failed',
              description: `Upload failed (${xhr.status})`,
              variant: 'destructive',
            });
          }
        }
      });

      xhr.addEventListener('error', () => {
        console.error('Upload network error');
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { 
            ...f, 
            status: 'error', 
            error: 'Network error' 
          } : f)
        );
        
        onUploadError?.('Network error');
        toast({
          title: 'Upload Failed',
          description: 'Network error occurred',
          variant: 'destructive',
        });
      });

      xhr.addEventListener('timeout', () => {
        console.error('Upload timeout');
        setUploadingFiles(prev => 
          prev.map(f => f.id === uploadingFile.id ? { 
            ...f, 
            status: 'error', 
            error: 'Upload timeout' 
          } : f)
        );
        
        onUploadError?.('Upload timeout');
        toast({
          title: 'Upload Failed',
          description: 'Upload timed out',
          variant: 'destructive',
        });
      });

        xhr.open('POST', '/api/files/upload');
        xhr.timeout = 60000; // 60 second timeout
        xhr.send(formData);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadingFiles(prev => 
        prev.map(f => f.id === uploadingFile.id ? { 
          ...f, 
          status: 'error', 
          error: 'Upload failed' 
        } : f)
      );
      
      onUploadError?.('Upload failed');
      toast({
        title: 'Upload Failed',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      uploadFile(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeUploadingFile = (id: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop files here, or click to select
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Max file size: {maxFileSize}MB
          {allowedTypes.length > 0 && (
            <span> • Allowed types: {allowedTypes.join(', ')}</span>
          )}
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          Select Files
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Uploading Files */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploading Files</h4>
          {uploadingFiles.map((uploadingFile) => (
            <div
              key={uploadingFile.id}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
            >
              {getFileIcon(uploadingFile.file.type.split('/')[0])}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadingFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadingFile.file.size)}
                </p>
                {uploadingFile.status === 'uploading' && (
                  <Progress value={uploadingFile.progress} className="mt-1" />
                )}
                {uploadingFile.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    {uploadingFile.error}
                  </p>
                )}
                {uploadingFile.status === 'success' && (
                  <p className="text-xs text-green-600 mt-1">
                    Upload complete
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeUploadingFile(uploadingFile.id)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
