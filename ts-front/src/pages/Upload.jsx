import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { toast } from 'react-toastify';
import * as yup from 'yup';
import useAuthStore from '../store/authStore';

// Validation schema
const uploadSchema = yup.object().shape({
  file: yup
    .mixed()
    .required('Please select a file to upload')
    .test('fileType', 'Only .mp3, .wav, .mp4, and .m4a files are allowed', (value) => {
      if (!value) return false;
      const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/x-wav', 'video/mp4', 'audio/mp4', 'audio/x-m4a'];
      return allowedTypes.includes(value.type);
    })
    .test('fileSize', 'File size must not exceed 100MB', (value) => {
      if (!value) return false;
      return value.size <= 100 * 1024 * 1024; // 100MB
    }),
});

const Upload = () => {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuthStore();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});

  // Redirect if not authenticated
  if (!isAuthenticated()) {
    navigate('/login');
    return null;
  }

  const validateFile = async (selectedFile) => {
    try {
      await uploadSchema.validate({ file: selectedFile }, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      const validationErrors = {};
      err.inner.forEach((error) => {
        validationErrors[error.path] = error.message;
      });
      setErrors(validationErrors);
      return false;
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const isValid = await validateFile(selectedFile);
      if (isValid) {
        setFile(selectedFile);
      } else {
        setFile(null);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const isValid = await validateFile(droppedFile);
      if (isValid) {
        setFile(droppedFile);
      } else {
        setFile(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:3001/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`,
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      toast.success(response.data.message);
      setFile(null);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to upload file. Please try again.';
      toast.error(errorMessage);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = () => {
    setFile(null);
    setErrors({});
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Upload Media File</h1>
          <p className="text-gray-600">Upload audio or video files for transcription</p>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Icon icon="mdi:cloud-upload" className="text-6xl text-indigo-500 mx-auto mb-4" />
          <p className="text-lg font-semibold text-gray-700 mb-2">
            Drag and drop your file here
          </p>
          <p className="text-sm text-gray-500 mb-4">or</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".mp3,.wav,.mp4,.m4a"
            className="hidden"
            disabled={isUploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Browse Files
          </button>
          <p className="text-xs text-gray-500 mt-4">
            Supported formats: MP3, WAV, MP4, M4A (Max 100MB)
          </p>
        </div>

        {/* Validation Errors */}
        {errors.file && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <Icon icon="mdi:alert-circle" className="text-red-500 text-xl" />
            <p className="text-sm text-red-600">{errors.file}</p>
          </div>
        )}

        {/* Selected File Preview */}
        {file && !errors.file && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Icon
                  icon={file.type.startsWith('video/') ? 'mdi:video' : 'mdi:music'}
                  className="text-3xl text-indigo-600"
                />
                <div>
                  <p className="font-semibold text-gray-800">{file.name}</p>
                  <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              {!isUploading && (
                <button
                  onClick={handleCancel}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <Icon icon="mdi:close-circle" className="text-2xl" />
                </button>
              )}
            </div>

            {/* Progress Bar */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upload Button */}
        {file && !errors.file && (
          <div className="mt-6 flex gap-4">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <Icon icon="mdi:loading" className="animate-spin text-xl" />
                  Uploading...
                </>
              ) : (
                <>
                  <Icon icon="mdi:upload" className="text-xl" />
                  Upload File
                </>
              )}
            </button>
            {!isUploading && (
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        )}

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center justify-center gap-2 mx-auto"
          >
            <Icon icon="mdi:arrow-left" />
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Upload;
