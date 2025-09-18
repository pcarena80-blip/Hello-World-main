import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrganization } from '@/contexts/OrganizationContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Download, 
  Eye, 
  Trash2, 
  Upload,
  File,
  Image,
  FileText,
  Video,
  Archive,
  Music,
  Calendar,
  User,
  Folder,
  MoreHorizontal
} from 'lucide-react';
import { FileUpload } from './FileUpload';
import { useToast } from '@/hooks/use-toast';

interface FileItem {
  id: string;
  organizationId: string;
  projectId?: string;
  taskId?: string;
  uploadedBy: string;
  originalName: string;
  fileName: string;
  filePath: string;
  fileType: string;
  mimeType: string;
  size: number;
  canPreview: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FileStats {
  totalFiles: number;
  totalSize: number;
  byType: Record<string, number>;
  byProject: Record<string, number>;
  recentUploads: FileItem[];
}

export function AsanaFiles() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  
  const [files, setFiles] = useState<FileItem[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<FileItem[]>([]);
  const [stats, setStats] = useState<FileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const fileTypes = [
    { value: 'all', label: 'All Files', icon: File },
    { value: 'image', label: 'Images', icon: Image },
    { value: 'document', label: 'Documents', icon: FileText },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'pdf', label: 'PDFs', icon: FileText },
    { value: 'spreadsheet', label: 'Spreadsheets', icon: FileText },
    { value: 'archive', label: 'Archives', icon: Archive },
    { value: 'music', label: 'Audio', icon: Music }
  ];

  useEffect(() => {
    if (currentOrganization) {
      loadFiles();
      loadStats();
    }
  }, [currentOrganization]);

  useEffect(() => {
    filterFiles();
  }, [files, searchTerm, selectedType]);

  const loadFiles = async () => {
    if (!currentOrganization) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/files/organization/${currentOrganization.id}`, {
        headers: {
          'user-id': user?.id?.toString() || '',
          'user-name': user?.name || user?.email || 'Unknown'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else {
        console.error('Failed to load files');
        setFiles([]);
      }
    } catch (error) {
      console.error('Error loading files:', error);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!currentOrganization) return;

    try {
      const response = await fetch(`/api/files/organization/${currentOrganization.id}/stats`, {
        headers: {
          'user-id': user?.id?.toString() || '',
          'user-name': user?.name || user?.email || 'Unknown'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const filterFiles = () => {
    let filtered = [...files];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(file =>
        file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by file type
    if (selectedType !== 'all') {
      filtered = filtered.filter(file => file.fileType === selectedType);
    }

    setFilteredFiles(filtered);
  };

  const handleFileUpload = (file: FileItem) => {
    setFiles(prev => [file, ...prev]);
    loadStats();
    setShowUpload(false);
  };

  const handleFileUploadError = (error: string) => {
    console.error('File upload error:', error);
  };

  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/files/${file.id}/download`, {
        headers: {
          'user-id': user?.id?.toString() || '',
          'user-name': user?.name || user?.email || 'Unknown'
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.originalName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast({
          title: 'Download Failed',
          description: 'Failed to download file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to download file',
        variant: 'destructive',
      });
    }
  };

  const handlePreview = (file: FileItem) => {
    setSelectedFile(file);
    setShowPreview(true);
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/files/${file.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id?.toString() || '',
          'user-name': user?.name || user?.email || 'Unknown'
        },
        body: JSON.stringify({ userId: user?.id })
      });

      if (response.ok) {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        loadStats();
        toast({
          title: 'File Deleted',
          description: `${file.originalName} has been deleted`,
        });
      } else {
        toast({
          title: 'Delete Failed',
          description: 'Failed to delete file',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <Image className="h-8 w-8 text-green-500" />;
      case 'document':
        return <FileText className="h-8 w-8 text-blue-500" />;
      case 'video':
        return <Video className="h-8 w-8 text-purple-500" />;
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-500" />;
      case 'spreadsheet':
        return <FileText className="h-8 w-8 text-green-600" />;
      case 'archive':
        return <Archive className="h-8 w-8 text-orange-500" />;
      case 'music':
        return <Music className="h-8 w-8 text-pink-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} day${Math.floor(diffInHours / 24) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="responsive-content space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Files</h1>
          <p className="text-gray-600">
            {stats ? `${stats.totalFiles} files • ${formatFileSize(stats.totalSize)}` : 'Manage your files'}
          </p>
        </div>
        <Button onClick={() => setShowUpload(true)}>
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="responsive-grid responsive-grid-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <File className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Total Files</p>
                  <p className="text-2xl font-bold">{stats.totalFiles}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Folder className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Total Size</p>
                  <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Image className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm font-medium">Images</p>
                  <p className="text-2xl font-bold">{stats.byType.image || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <FileText className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-sm font-medium">Documents</p>
                  <p className="text-2xl font-bold">{stats.byType.document || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {fileTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          >
            {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Files Grid/List */}
      {filteredFiles.length === 0 ? (
        <div className="text-center py-12">
          <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Upload your first file to get started'
            }
          </p>
          <Button onClick={() => setShowUpload(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Files
          </Button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'responsive-file-grid'
          : 'space-y-2'
        }>
          {filteredFiles.map((file) => (
            <Card key={file.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  {getFileIcon(file.fileType)}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm truncate" title={file.originalName}>
                      {file.originalName}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {formatDate(file.createdAt)}
                    </p>
                    <div className="flex items-center space-x-1 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {file.fileType}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {file.canPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(file)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {file.uploadedBy === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(file)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={showUpload} onOpenChange={setShowUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
          </DialogHeader>
          <FileUpload
            onUploadComplete={handleFileUpload}
            onUploadError={handleFileUploadError}
            maxFileSize={50}
          />
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedFile?.originalName}</DialogTitle>
          </DialogHeader>
          {selectedFile && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                {getFileIcon(selectedFile.fileType)}
                <div>
                  <p className="font-medium">{selectedFile.originalName}</p>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)} • {formatDate(selectedFile.createdAt)}
                  </p>
                </div>
              </div>
              
              <div className="border rounded-lg p-4 bg-gray-50">
                {selectedFile.canPreview ? (
                  <iframe
                    src={`/api/files/${selectedFile.id}/view`}
                    className="w-full h-96 border-0"
                    title={selectedFile.originalName}
                  />
                ) : (
                  <div className="text-center py-8">
                    <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Preview not available for this file type</p>
                    <Button onClick={() => handleDownload(selectedFile)}>
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Close
                </Button>
                <Button onClick={() => handleDownload(selectedFile)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}