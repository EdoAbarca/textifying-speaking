import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { toast } from 'react-toastify';
import axios from 'axios';
import useAuthStore from '../store/authStore';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { token } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchFiles();
  }, [token, navigate]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/media', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }

      const data = await response.json();
      setFiles(data.files);
    } catch (error) {
      console.error('Error fetching files:', error);
      toast.error('Failed to load files. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (file) => {
    setSelectedFile(file);
    setShowDetailsModal(true);
  };

  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!fileToDelete) return;

    try {
      setDeleting(true);
      const response = await fetch(`http://localhost:3001/media/${fileToDelete.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete file');
      }

      toast.success('File deleted successfully!');
      setShowDeleteModal(false);
      setFileToDelete(null);
      // Refresh the file list
      fetchFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error(error.message || 'Failed to delete file. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileTypeIcon = (mimetype) => {
    if (mimetype.startsWith('audio/')) return 'mdi:music';
    if (mimetype.startsWith('video/')) return 'mdi:video';
    return 'mdi:file';
  };

  const getFileTypeColor = (mimetype) => {
    if (mimetype.startsWith('audio/')) return 'text-blue-500';
    if (mimetype.startsWith('video/')) return 'text-purple-500';
    return 'text-gray-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-800">My Files</h1>
            <button
              onClick={fetchFiles}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              disabled={loading}
            >
              <Icon icon="mdi:refresh" width={20} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Icon icon="mdi:loading" width={48} className="text-blue-500 animate-spin" />
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-12">
              <Icon icon="mdi:file-outline" width={64} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-4">No files uploaded yet</p>
              <button
                onClick={() => navigate('/upload')}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Upload Your First File
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon
                        icon={getFileTypeIcon(file.mimetype)}
                        width={32}
                        className={getFileTypeColor(file.mimetype)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800 truncate" title={file.originalFilename}>
                          {file.originalFilename}
                        </p>
                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Uploaded</p>
                    <p className="text-sm text-gray-700">{formatDate(file.uploadDate)}</p>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      file.status === 'uploaded' ? 'bg-green-100 text-green-700' :
                      file.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                      file.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                    </span>
                    <span className="text-xs text-gray-500">{file.mimetype.split('/')[1].toUpperCase()}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetails(file)}
                      className="flex-1 px-3 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon icon="mdi:information-outline" width={18} />
                      Details
                    </button>
                    <button
                      onClick={() => handleDeleteClick(file)}
                      className="px-3 py-2 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center"
                    >
                      <Icon icon="mdi:delete" width={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* File Details Modal */}
      {showDetailsModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">File Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Icon icon="mdi:close" width={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                <Icon
                  icon={getFileTypeIcon(selectedFile.mimetype)}
                  width={64}
                  className={getFileTypeColor(selectedFile.mimetype)}
                />
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">
                    {selectedFile.originalFilename}
                  </h3>
                  <p className="text-gray-500">{selectedFile.mimetype}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">File ID</p>
                  <p className="text-gray-800 font-mono text-sm">{selectedFile.id}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Storage Filename</p>
                  <p className="text-gray-800 font-mono text-sm">{selectedFile.filename}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">File Size</p>
                  <p className="text-gray-800">{formatFileSize(selectedFile.size)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Upload Date</p>
                  <p className="text-gray-800">{formatDate(selectedFile.uploadDate)}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-1">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                    selectedFile.status === 'uploaded' ? 'bg-green-100 text-green-700' :
                    selectedFile.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    selectedFile.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedFile.status.charAt(0).toUpperCase() + selectedFile.status.slice(1)}
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleDeleteClick(selectedFile);
                  }}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Icon icon="mdi:delete" width={20} />
                  Delete File
                </button>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && fileToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Confirm Deletion</h2>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <Icon icon="mdi:alert" width={24} className="text-red-500" />
                </div>
                <div>
                  <p className="text-gray-800 font-medium">Are you sure you want to delete this file?</p>
                  <p className="text-gray-500 text-sm mt-1">{fileToDelete.originalFilename}</p>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                This action cannot be undone. The file will be permanently removed from the database and storage.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <Icon icon="mdi:loading" width={20} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Icon icon="mdi:delete" width={20} />
                      Delete
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setFileToDelete(null);
                  }}
                  disabled={deleting}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
