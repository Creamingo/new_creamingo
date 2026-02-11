/**
 * Upload Service
 * Handles file uploads for images and videos
 */

import apiClient from './api';

export interface UploadResponse {
  success: boolean;
  message?: string;
  data?: {
    filename: string;
    originalname: string;
    size: number;
    url: string;
  };
}

export interface MultipleUploadResponse {
  success: boolean;
  message?: string;
  data?: {
    files: Array<{
      filename: string;
      originalname: string;
      size: number;
      url: string;
    }>;
  };
}

class UploadService {
  /**
   * Upload single file
   */
  async uploadSingle(file: File, type?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('image', file);

    const typeQuery = type ? `?type=${encodeURIComponent(type)}` : '';
    const response = await apiClient.uploadFormData(`/upload/single${typeQuery}`, formData);
    return response as UploadResponse;
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(files: File[], type?: string): Promise<MultipleUploadResponse> {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append('images', file);
    });

    const typeQuery = type ? `?type=${encodeURIComponent(type)}` : '';
    const response = await apiClient.uploadFormData(`/upload/multiple${typeQuery}`, formData);
    return response as MultipleUploadResponse;
  }

  /**
   * Delete uploaded file
   */
  async deleteFile(filename: string): Promise<{ success: boolean; message?: string }> {
    const response = await apiClient.delete(`/upload/${filename}`);
    return response;
  }

  /**
   * Get file info
   */
  async getFileInfo(filename: string): Promise<{ success: boolean; data?: any }> {
    const response = await apiClient.get(`/upload/${filename}`);
    return response;
  }

  /**
   * Validate file type and size
   */
  validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file type
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Only image and video files are allowed (JPEG, JPG, PNG, GIF, WebP, MP4, WebM, OGG, AVI, MOV)'
      };
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    return { isValid: true };
  }

  /**
   * Get file type (image or video)
   */
  getFileType(file: File): 'image' | 'video' {
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return imageTypes.includes(file.type) ? 'image' : 'video';
  }
}

// Create singleton instance
const uploadService = new UploadService();

export default uploadService;
