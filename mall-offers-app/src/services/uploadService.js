import { Platform } from 'react-native';
import apiClient from './apiClient';

/**
 * Uploads an image to the backend /api/upload endpoint.
 * @param {string} localUri - The local URI of the image (from ImagePicker).
 * @returns {Promise<string>} - The public Cloudinary URL.
 */
export const uploadImage = async (localUri) => {
    if (!localUri) return null;
    
    // If it's already an HTTP(S) URL, skip upload
    if (localUri.startsWith('http')) return localUri;

    console.log('[UploadService] Starting upload for:', localUri);

    const formData = new FormData();
    
    if (Platform.OS === 'web') {
        // Web: ImagePicker's URI can be a base64 or a blob URI
        // Axios handles this well if we just pass the object or Blob
        // But the most reliable way on Web is to fetch the blob
        const response = await fetch(localUri);
        const blob = await response.blob();
        formData.append('image', blob, 'upload.jpg');
    } else {
        // Native: Needs the special object format for FormData
        const filename = localUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : `image`;

        formData.append('image', {
            uri: localUri,
            name: filename,
            type: type,
        });
    }

    try {
        const response = await apiClient.post('/upload', formData); // Header omitted for automatic boundary set

        if (response.success && response.imageUrl) {
            console.log('[UploadService] Upload successful:', response.imageUrl);
            return response.imageUrl;
        }
        
        throw new Error(response.message || 'Upload failed');
    } catch (error) {
        console.error('[UploadService] Error:', error);
        throw error;
    }
};
