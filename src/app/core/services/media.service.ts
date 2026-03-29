import { Injectable, inject } from '@angular/core';
import { MediaItem } from '../models/site.models';
import { SiteContentService } from './site-content.service';
import {
  cloudinaryConfig,
  isCloudinaryConfigured,
  isCloudinaryDeleteConfigured
} from '../config/cloudinary.config';

type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  deleteToken?: string;
};

@Injectable({
  providedIn: 'root'
})
export class MediaService {
  private readonly siteContent = inject(SiteContentService);

  /**
   * Upload image to Cloudinary via upload preset.
   * Metadata stored in Firestore for quick lookups.
   * Actual image files hosted on Cloudinary CDN (no Firebase Storage needed).
   */
  async uploadImage(file: Blob, originalFileName: string): Promise<MediaItem> {
    const hash = await this.hashBlob(file);

    this.validateUploadFile(file, originalFileName);

    // Use Base64 fallback if Cloudinary not configured
    if (!isCloudinaryConfigured(cloudinaryConfig)) {
      console.warn('Cloudinary not configured. Falling back to Base64 storage.');
      return this.uploadAsBase64(file, originalFileName, hash);
    }

    // Upload to Cloudinary via preset
    const cloudinaryUpload = await this.uploadToCloudinary(file, hash);

    const mediaItem: MediaItem = {
      id: crypto.randomUUID(),
      name: originalFileName,
      hash,
      storagePath: `cloudinary:${hash}`,
      downloadUrl: cloudinaryUpload.secureUrl,
      cloudinaryPublicId: cloudinaryUpload.publicId,
      cloudinaryDeleteToken: cloudinaryUpload.deleteToken,
      createdAt: Date.now()
    };

    await this.siteContent.saveMediaItem(mediaItem);
    return mediaItem;
  }

  async deleteImage(item: MediaItem): Promise<void> {
    if (item.storagePath.startsWith('cloudinary:') && isCloudinaryConfigured(cloudinaryConfig)) {
      await this.deleteFromCloudinary(item);
    }

    await this.siteContent.deleteMediaItem(item.id);
  }

  private async uploadToCloudinary(file: Blob, hash: string): Promise<CloudinaryUploadResult> {
    const formData = new FormData();

    // Ensure file is appended as 'file' field (required by Cloudinary API)
    if (file instanceof File) {
      formData.append('file', file, file.name);
    } else {
      // Convert Blob to File if needed
      formData.append('file', new File([file], `${hash}.jpg`, { type: 'image/jpeg' }));
    }

    formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    formData.append('folder', cloudinaryConfig.folder);
    formData.append('public_id', hash); // Use SHA-256 hash as public ID for deduplication
    formData.append('return_delete_token', '1');

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
        // Do NOT set Content-Type header; fetch will set it with proper boundary for multipart/form-data
      });

      if (!response.ok) {
        let errorMessage = response.statusText;
        let fullResponse = '';
        
        try {
          fullResponse = await response.text();
          const errorPayload = JSON.parse(fullResponse) as {
            error?: { message?: string };
          };
          if (errorPayload.error?.message) {
            errorMessage = errorPayload.error.message;
          }
        } catch {
          // If response is not JSON, use the text as fallback
          errorMessage = fullResponse || response.statusText;
        }

        console.error('Cloudinary 400 response:', { 
          status: response.status, 
          errorMessage, 
          formDataKeys: Array.from(formData.entries()).map(([k]) => k)
        });

        throw new Error(`Cloudinary upload failed (${response.status}): ${errorMessage}`);
      }

      const data = (await response.json()) as {
        secure_url: string;
        public_id: string;
        delete_token?: string;
      };
      console.log('Cloudinary upload successful:', data.public_id, 'URL:', data.secure_url);

      // Return URL and metadata for future delete operations.
      return {
        secureUrl: data.secure_url,
        publicId: data.public_id,
        deleteToken: data.delete_token
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw error;
    }
  }

  private async deleteFromCloudinary(item: MediaItem): Promise<void> {
    if (item.cloudinaryDeleteToken?.trim()) {
      await this.deleteFromCloudinaryByToken(item.cloudinaryDeleteToken.trim());
      return;
    }

    if (!isCloudinaryDeleteConfigured(cloudinaryConfig)) {
      throw new Error(
        'Cloudinary delete credentials are missing. Add cloudinaryConfig.apiKey/apiSecret or delete soon after upload while delete token is available.'
      );
    }

    const publicId =
      item.cloudinaryPublicId?.trim() ||
      item.storagePath.replace(/^cloudinary:/, '').trim();

    if (!publicId) {
      throw new Error('Missing Cloudinary public ID for delete operation.');
    }

    await this.deleteFromCloudinaryBySignedRequest(publicId);
  }

  private async deleteFromCloudinaryByToken(deleteToken: string): Promise<void> {
    const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/delete_by_token`;
    const formData = new FormData();
    formData.append('token', deleteToken);

    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const message = await this.extractCloudinaryErrorMessage(response);
      throw new Error(`Cloudinary token delete failed (${response.status}): ${message}`);
    }
  }

  private async deleteFromCloudinaryBySignedRequest(publicId: string): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1000);
    const signatureBase = `public_id=${publicId}&timestamp=${timestamp}${cloudinaryConfig.apiSecret}`;
    const signature = await this.sha1(signatureBase);

    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', String(timestamp));
    formData.append('api_key', cloudinaryConfig.apiKey);
    formData.append('signature', signature);
    formData.append('invalidate', 'true');

    const url = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/destroy`;
    const response = await fetch(url, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const message = await this.extractCloudinaryErrorMessage(response);
      throw new Error(`Cloudinary signed delete failed (${response.status}): ${message}`);
    }

    const payload = (await response.json()) as { result?: string; error?: { message?: string } };
    if (payload.error?.message) {
      throw new Error(`Cloudinary signed delete failed: ${payload.error.message}`);
    }

    if (payload.result !== 'ok' && payload.result !== 'not found') {
      throw new Error(`Cloudinary signed delete returned unexpected result: ${payload.result || 'unknown'}`);
    }
  }

  private async extractCloudinaryErrorMessage(response: Response): Promise<string> {
    let fullResponse = '';

    try {
      fullResponse = await response.text();
      const parsed = JSON.parse(fullResponse) as {
        error?: { message?: string };
      };

      if (parsed.error?.message) {
        return parsed.error.message;
      }
    } catch {
      // Fall back to raw response text or status text.
    }

    return fullResponse || response.statusText;
  }

  private async sha1(value: string): Promise<string> {
    const encoded = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest('SHA-1', encoded);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  private async uploadAsBase64(
    file: Blob,
    originalFileName: string,
    hash: string
  ): Promise<MediaItem> {
    const downloadUrl = await this.blobToDataUrl(file);

    const mediaItem: MediaItem = {
      id: crypto.randomUUID(),
      name: originalFileName,
      hash,
      storagePath: `base64-fallback:${hash}`,
      downloadUrl,
      createdAt: Date.now()
    };

    await this.siteContent.saveMediaItem(mediaItem);
    return mediaItem;
  }

  private async hashBlob(blob: Blob): Promise<string> {
    const bytes = await blob.arrayBuffer();
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest))
      .map((value) => value.toString(16).padStart(2, '0'))
      .join('');
  }

  private validateUploadFile(file: Blob, originalFileName: string): void {
    const safeName = originalFileName || 'upload-file';
    const extension = safeName.includes('.') ? safeName.split('.').pop()?.toLowerCase() || '' : '';
    const allowedExtensionSet = new Set(cloudinaryConfig.allowedFormats.map((format) => format.toLowerCase()));

    if (file.size > cloudinaryConfig.maxFileSize) {
      const maxSizeMb = Math.round(cloudinaryConfig.maxFileSize / (1024 * 1024));
      throw new Error(`Image exceeds ${maxSizeMb}MB limit for upload preset.`);
    }

    if (extension && !allowedExtensionSet.has(extension)) {
      throw new Error(`Unsupported image format: .${extension}. Allowed: ${cloudinaryConfig.allowedFormats.join(', ')}`);
    }
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Unable to read image blob.'));
      reader.readAsDataURL(blob);
    });
  }
}
