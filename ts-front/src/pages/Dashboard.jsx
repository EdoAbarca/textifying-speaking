import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import { toast } from 'react-toastify';
import useAuthStore from '../store/authStore';
import { useFileStatus } from '../hooks/useFileStatus';
import FloatingProgressIndicator from '../components/FloatingProgressIndicator';

export default function Dashboard() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showTranscriptionModal, setShowTranscriptionModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [transcribingFiles, setTranscribingFiles] = useState(new Set());
  const [summarizingFiles, setSummarizingFiles] = useState(new Set());
  const [deleting, setDeleting] = useState(false);
  const { token } = useAuthStore();
  const navigate = useNavigate();

  // Handle real-time file status updates
  const handleFileStatusUpdate = useCallback((updatedFile) => {
    setFiles((prevFiles) => {
      const existingFileIndex = prevFiles.findIndex(f => f.id === updatedFile.id);
      
      if (existingFileIndex >= 0) {
        // Update existing file
        const newFiles = [...prevFiles];
        const oldStatus = newFiles[existingFileIndex].status;
        newFiles[existingFileIndex] = { ...newFiles[existingFileIndex], ...updatedFile };
        
        // Show notifications for status changes
        if (oldStatus !== updatedFile.status) {
          if (updatedFile.status === 'processing') {
            toast.info(
              <div className="flex items-center gap-2">
                <Icon icon="mdi:cog" className="animate-spin" width={20} />
                <div>
                  <div className="font-semibold">Transcription started</div>
                  <div className="text-sm opacity-90">{updatedFile.originalFilename}</div>
                </div>
              </div>,
              { autoClose: 3000 }
            );
          } else if (updatedFile.status === 'completed') {
            toast.success(
              <div className="flex items-center gap-2">
                <Icon icon="mdi:check-circle" width={20} />
                <div>
                  <div className="font-semibold">Transcription completed!</div>
                  <div className="text-sm opacity-90">{updatedFile.originalFilename}</div>
                </div>
              </div>,
              { autoClose: 5000 }
            );
            // Remove from transcribing set
            setTranscribingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(updatedFile.id);
              return newSet;
            });
          } else if (updatedFile.status === 'error') {
            toast.error(
              <div className="flex items-center gap-2">
                <Icon icon="mdi:alert-circle" width={20} />
                <div>
                  <div className="font-semibold">Transcription failed</div>
                  <div className="text-sm opacity-90">{updatedFile.originalFilename}</div>
                  {updatedFile.errorMessage && (
                    <div className="text-xs mt-1 opacity-75">{updatedFile.errorMessage}</div>
                  )}
                </div>
              </div>,
              { autoClose: 7000 }
            );
            // Remove from transcribing set
            setTranscribingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(updatedFile.id);
              return newSet;
            });
          }
        }
        
        return newFiles;
      } else {
        // Add new file
        return [updatedFile, ...prevFiles];
      }
    });

    // Update selected file if it's the one being viewed
    setSelectedFile((prevSelectedFile) => {
      if (prevSelectedFile && prevSelectedFile.id === updatedFile.id) {
        return { ...prevSelectedFile, ...updatedFile };
      }
      return prevSelectedFile;
    });
  }, []);

  const handleFileProgress = useCallback((progressData) => {
    setFiles((prevFiles) => {
      const fileIndex = prevFiles.findIndex(f => f.id === progressData.fileId);
      if (fileIndex >= 0) {
        const newFiles = [...prevFiles];
        newFiles[fileIndex] = { ...newFiles[fileIndex], progress: progressData.progress };
        return newFiles;
      }
      return prevFiles;
    });
  }, []);

  const handleSummaryStatusUpdate = useCallback((data) => {
    setFiles((prevFiles) => {
      const fileIndex = prevFiles.findIndex(f => f.id === data.fileId);
      if (fileIndex >= 0) {
        const newFiles = [...prevFiles];
        const oldSummaryStatus = newFiles[fileIndex].summaryStatus;
        
        // Update summary fields
        newFiles[fileIndex] = {
          ...newFiles[fileIndex],
          summaryStatus: data.summaryStatus,
          summaryText: data.summaryText || newFiles[fileIndex].summaryText,
          summaryErrorMessage: data.summaryErrorMessage || newFiles[fileIndex].summaryErrorMessage,
        };
        
        // Show notifications for status changes
        if (oldSummaryStatus !== data.summaryStatus) {
          if (data.summaryStatus === 'processing') {
            toast.info(
              <div className="flex items-center gap-2">
                <Icon icon="mdi:cog" className="animate-spin" width={20} />
                <div>
                  <div className="font-semibold">Summarization started</div>
                  <div className="text-sm opacity-90">{data.originalFilename}</div>
                </div>
              </div>,
              { autoClose: 3000 }
            );
          } else if (data.summaryStatus === 'completed') {
            toast.success(
              <div className="flex items-center gap-2">
                <Icon icon="mdi:check-circle" width={20} />
                <div>
                  <div className="font-semibold">Summarization completed!</div>
                  <div className="text-sm opacity-90">{data.originalFilename}</div>
                </div>
              </div>,
              { autoClose: 5000 }
            );
            // Remove from summarizing set
            setSummarizingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.fileId);
              return newSet;
            });
          } else if (data.summaryStatus === 'error') {
            toast.error(
              <div className="flex items-center gap-2">
                <Icon icon="mdi:alert-circle" width={20} />
                <div>
                  <div className="font-semibold">Summarization failed</div>
                  <div className="text-sm opacity-90">{data.originalFilename}</div>
                  {data.summaryErrorMessage && (
                    <div className="text-xs mt-1 opacity-75">{data.summaryErrorMessage}</div>
                  )}
                </div>
              </div>,
              { autoClose: 7000 }
            );
            // Remove from summarizing set
            setSummarizingFiles(prev => {
              const newSet = new Set(prev);
              newSet.delete(data.fileId);
              return newSet;
            });
          }
        }
        
        return newFiles;
      }
      return prevFiles;
    });

    // Update selected file if it's the one being viewed
    setSelectedFile((prevSelectedFile) => {
      if (prevSelectedFile && prevSelectedFile.id === data.fileId) {
        return {
          ...prevSelectedFile,
          summaryStatus: data.summaryStatus,
          summaryText: data.summaryText || prevSelectedFile.summaryText,
          summaryErrorMessage: data.summaryErrorMessage || prevSelectedFile.summaryErrorMessage,
        };
      }
      return prevSelectedFile;
    });
  }, []);

  // Initialize WebSocket connection
  const { isConnected } = useFileStatus(handleFileStatusUpdate, handleFileProgress, handleSummaryStatusUpdate);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleTranscribeClick = async (file) => {
    try {
      setTranscribingFiles(prev => new Set(prev).add(file.id));
      
      const response = await fetch(`http://localhost:3001/media/${file.id}/transcribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start transcription');
      }

      toast.info(`Transcription started for "${file.originalFilename}"`);
    } catch (error) {
      console.error('Error starting transcription:', error);
      toast.error(error.message || 'Failed to start transcription. Please try again.');
      setTranscribingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleViewTranscription = (file) => {
    setSelectedFile(file);
    setShowTranscriptionModal(true);
  };

  const handleSummarizeClick = async (file) => {
    try {
      setSummarizingFiles(prev => new Set(prev).add(file.id));
      
      const response = await fetch(`http://localhost:3001/media/${file.id}/summarize`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to start summarization');
      }

      toast.info(`Summarization started for "${file.originalFilename}"`);
    } catch (error) {
      console.error('Error starting summarization:', error);
      toast.error(error.message || 'Failed to start summarization. Please try again.');
      setSummarizingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
    }
  };

  const handleViewSummary = (file) => {
    setSelectedFile(file);
    setShowSummaryModal(true);
  };

  const handleCopySummaryToClipboard = async () => {
    if (selectedFile && selectedFile.summaryText) {
      try {
        await navigator.clipboard.writeText(selectedFile.summaryText);
        toast.success('Summary copied to clipboard!');
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        toast.error('Failed to copy to clipboard');
      }
    }
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
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Files</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm text-gray-600">
                  {isConnected ? 'Real-time updates active' : 'Connecting...'}
                </span>
              </div>
            </div>
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
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                        file.status === 'uploading' ? 'bg-purple-100 text-purple-700' :
                        file.status === 'ready' ? 'bg-green-100 text-green-700' :
                        file.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                        file.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {file.status === 'uploading' && <Icon icon="mdi:loading" className="animate-spin" width={12} />}
                        {file.status === 'processing' && <Icon icon="mdi:cog" className="animate-spin" width={12} />}
                        {file.status === 'completed' && <Icon icon="mdi:check-circle" width={12} />}
                        {file.status === 'error' && <Icon icon="mdi:alert-circle" width={12} />}
                        {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                      </span>
                      {file.status === 'processing' && file.progress !== undefined && (
                        <span className="text-xs text-gray-500">{file.progress}%</span>
                      )}
                    </div>
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
                    {file.status === 'ready' && (
                      <button
                        onClick={() => handleTranscribeClick(file)}
                        disabled={transcribingFiles.has(file.id)}
                        className="flex-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Icon icon="mdi:text-to-speech" width={18} />
                        Transcribe
                      </button>
                    )}
                    {file.status === 'completed' && file.transcribedText && (
                      <>
                        <button
                          onClick={() => handleViewTranscription(file)}
                          className="flex-1 px-3 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <Icon icon="mdi:text-box-outline" width={18} />
                          View Text
                        </button>
                        {!file.summaryText && file.summaryStatus !== 'processing' && (
                          <button
                            onClick={() => handleSummarizeClick(file)}
                            disabled={summarizingFiles.has(file.id)}
                            className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Icon icon="mdi:file-document-outline" width={18} />
                            Summarize
                          </button>
                        )}
                        {file.summaryText && (
                          <button
                            onClick={() => handleViewSummary(file)}
                            className="flex-1 px-3 py-2 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Icon icon="mdi:file-document-check-outline" width={18} />
                            View Summary
                          </button>
                        )}
                      </>
                    )}
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
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    selectedFile.status === 'uploading' ? 'bg-purple-100 text-purple-700' :
                    selectedFile.status === 'ready' ? 'bg-green-100 text-green-700' :
                    selectedFile.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                    selectedFile.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedFile.status === 'uploading' && <Icon icon="mdi:loading" className="animate-spin" width={16} />}
                    {selectedFile.status === 'processing' && <Icon icon="mdi:cog" className="animate-spin" width={16} />}
                    {selectedFile.status === 'completed' && <Icon icon="mdi:check-circle" width={16} />}
                    {selectedFile.status === 'error' && <Icon icon="mdi:alert-circle" width={16} />}
                    {selectedFile.status.charAt(0).toUpperCase() + selectedFile.status.slice(1)}
                  </span>
                </div>

                {selectedFile.progress !== undefined && selectedFile.progress > 0 && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Progress</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${selectedFile.progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{selectedFile.progress}%</span>
                    </div>
                  </div>
                )}

                {selectedFile.errorMessage && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Error Message</p>
                    <p className="text-red-600 text-sm">{selectedFile.errorMessage}</p>
                  </div>
                )}

                {selectedFile.transcribedText && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Transcription Available</p>
                    <button
                      onClick={() => {
                        setShowDetailsModal(false);
                        handleViewTranscription(selectedFile);
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                      <Icon icon="mdi:text-box-outline" width={18} />
                      View Transcribed Text
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                {selectedFile.status === 'ready' && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handleTranscribeClick(selectedFile);
                    }}
                    disabled={transcribingFiles.has(selectedFile.id)}
                    className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Icon icon="mdi:text-to-speech" width={20} />
                    Transcribe File
                  </button>
                )}
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

      {/* Transcription and Summary Modal (Side-by-Side View) */}
      {showTranscriptionModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between rounded-t-lg">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Transcription & Summary</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedFile.originalFilename}</p>
              </div>
              <button
                onClick={() => setShowTranscriptionModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Icon icon="mdi:close" width={24} />
              </button>
            </div>

            {/* Content - Side by Side */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Transcription Section */}
                <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:text-box-outline" width={24} className="text-indigo-500" />
                      <span className="text-lg font-semibold text-gray-800">Full Transcription</span>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(selectedFile.transcribedText || '');
                        toast.success('Transcription copied to clipboard!');
                      }}
                      className="flex items-center gap-2 px-3 py-1 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors"
                    >
                      <Icon icon="mdi:content-copy" width={16} />
                      Copy
                    </button>
                  </div>
                  
                  {selectedFile.transcribedText ? (
                    <div className="bg-white rounded-lg p-4 border border-indigo-200 flex-1 overflow-y-auto max-h-[60vh]">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedFile.transcribedText}
                      </p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-4 border border-indigo-200 flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Icon icon="mdi:text-box-remove-outline" width={48} className="text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500">No transcription text available</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Summary Section */}
                <div className="bg-purple-50 rounded-lg p-6 border border-purple-200 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Icon icon="mdi:file-document-outline" width={24} className="text-purple-500" />
                      <span className="text-lg font-semibold text-gray-800">Summary</span>
                    </div>
                    {selectedFile.summaryText && (
                      <button
                        onClick={handleCopySummaryToClipboard}
                        className="flex items-center gap-2 px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                      >
                        <Icon icon="mdi:content-copy" width={16} />
                        Copy
                      </button>
                    )}
                  </div>
                  
                  {/* Summary Content with Status Handling */}
                  {selectedFile.summaryText ? (
                    <div className="bg-white rounded-lg p-4 border border-purple-200 flex-1 overflow-y-auto max-h-[60vh]">
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                        {selectedFile.summaryText}
                      </p>
                    </div>
                  ) : selectedFile.summaryStatus === 'processing' ? (
                    <div className="bg-white rounded-lg p-4 border border-purple-200 flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Icon icon="mdi:cog" width={48} className="text-purple-500 mx-auto mb-3 animate-spin" />
                        <p className="text-gray-700 font-medium mb-1">Summary in progress...</p>
                        <p className="text-gray-500 text-sm">This page will update automatically when ready</p>
                      </div>
                    </div>
                  ) : selectedFile.summaryStatus === 'pending' ? (
                    <div className="bg-white rounded-lg p-4 border border-purple-200 flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Icon icon="mdi:clock-outline" width={48} className="text-purple-400 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-1">Summary pending</p>
                        <p className="text-gray-500 text-sm">Click "Summarize" button to generate a summary</p>
                      </div>
                    </div>
                  ) : selectedFile.summaryStatus === 'error' ? (
                    <div className="bg-white rounded-lg p-4 border border-red-200 flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Icon icon="mdi:alert-circle" width={48} className="text-red-500 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium mb-1">Summarization failed</p>
                        {selectedFile.summaryErrorMessage && (
                          <p className="text-red-600 text-sm mt-2 px-4">
                            {selectedFile.summaryErrorMessage}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-4 border border-purple-200 flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Icon icon="mdi:file-document-remove-outline" width={48} className="text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-500">No summary available yet</p>
                        <p className="text-gray-400 text-sm mt-1">Generate a summary from the dashboard</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 border-t border-gray-200 px-6 py-4 flex justify-end rounded-b-lg bg-white">
              <button
                onClick={() => setShowTranscriptionModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {showSummaryModal && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800">Summary</h2>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Icon icon="mdi:close" width={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-purple-50 rounded-lg p-4 mb-6 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="mdi:file-document-outline" width={20} className="text-purple-600" />
                  <span className="text-sm font-medium text-purple-900">{selectedFile.originalFilename}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:file-document-check-outline" width={24} className="text-purple-500" />
                    <span className="text-sm font-medium text-gray-700">Summary</span>
                  </div>
                  <button
                    onClick={handleCopySummaryToClipboard}
                    className="flex items-center gap-2 px-3 py-1 bg-purple-500 text-white text-sm rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    <Icon icon="mdi:content-copy" width={16} />
                    Copy
                  </button>
                </div>
                
                {selectedFile.summaryText ? (
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                      {selectedFile.summaryText}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon icon="mdi:file-document-remove-outline" width={48} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No summary available</p>
                  </div>
                )}
              </div>

              <div className="bg-indigo-50 rounded-lg p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Icon icon="mdi:text-box-outline" width={24} className="text-indigo-500" />
                    <span className="text-sm font-medium text-gray-700">Original Transcription</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedFile.transcribedText || '');
                      toast.success('Transcription copied to clipboard!');
                    }}
                    className="flex items-center gap-2 px-3 py-1 bg-indigo-500 text-white text-sm rounded-lg hover:bg-indigo-600 transition-colors"
                  >
                    <Icon icon="mdi:content-copy" width={16} />
                    Copy
                  </button>
                </div>
                
                {selectedFile.transcribedText ? (
                  <div className="bg-white rounded-lg p-4 border border-gray-200 max-h-60 overflow-y-auto">
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                      {selectedFile.transcribedText}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Icon icon="mdi:text-box-remove-outline" width={48} className="text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No transcription text available</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Progress Indicator (Google Drive style) */}
      <FloatingProgressIndicator files={files} />
    </div>
  );
}
