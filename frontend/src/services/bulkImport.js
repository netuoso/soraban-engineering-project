// src/services/bulkImport.js
import api from './api';

const BULK_IMPORT_ENDPOINTS = {
  create: '/bulk_imports',
  progress: (sessionId) => `/bulk_imports/progress?session_id=${sessionId}`,
  list: '/bulk_imports',
  cancel: (sessionId) => `/bulk_imports/cancel?session_id=${sessionId}`
};

export const startBulkImport = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post(BULK_IMPORT_ENDPOINTS.create, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Bulk import start error:', error);
    throw error;
  }
};

export const getBulkImportProgress = async (sessionId) => {
  try {
    const response = await api.get(BULK_IMPORT_ENDPOINTS.progress(sessionId));
    return response.data;
  } catch (error) {
    console.error('Get bulk import progress error:', error);
    throw error;
  }
};

export const getBulkImportHistory = async () => {
  try {
    const response = await api.get(BULK_IMPORT_ENDPOINTS.list);
    return response.data;
  } catch (error) {
    console.error('Get bulk import history error:', error);
    throw error;
  }
};

export const cancelBulkImport = async (sessionId) => {
  try {
    const response = await api.post(BULK_IMPORT_ENDPOINTS.cancel(sessionId));
    return response.data;
  } catch (error) {
    console.error('Cancel bulk import error:', error);
    throw error;
  }
};

// Utility function to format file size
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Utility function to format duration
export const formatDuration = (seconds) => {
  if (!seconds || seconds < 0) return 'Unknown';
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  
  if (minutes < 60) {
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
};

// Utility function to validate CSV file
export const validateCSVFile = (file) => {
  const errors = [];
  const maxSize = 100 * 1024 * 1024; // 50MB
  
  if (!file) {
    errors.push('No file selected');
    return errors;
  }
  
  // Check file type
  if (!file.type.includes('csv') && !file.name.toLowerCase().endsWith('.csv')) {
    errors.push('File must be a CSV file');
  }
  
  // Check file size
  if (file.size > maxSize) {
    errors.push(`File size (${formatFileSize(file.size)}) exceeds maximum allowed size (100MB)`);
  }
  
  // Check if file is empty
  if (file.size === 0) {
    errors.push('File is empty');
  }
  
  return errors;
};
