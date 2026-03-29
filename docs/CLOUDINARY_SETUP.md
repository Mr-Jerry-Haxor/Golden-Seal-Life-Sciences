# Cloudinary Integration Setup

Your Angular app is now configured to upload images directly to **Cloudinary** via the upload preset **`Golden_Seal_Life_Sciences`**.

## Quick Setup

### 1. Get Your Cloudinary Cloud Name

1. Log in to your Cloudinary account
2. Go to **Settings** → **Account** tab
3. Copy your **Cloud Name** (e.g., `djyp4qb2a`)

### 2. Update the Config

Edit [src/app/core/config/cloudinary.config.ts](../src/app/core/config/cloudinary.config.ts):

```typescript
export const cloudinaryConfig = {
  cloudName: 'YOUR_CLOUD_NAME',  // ← REPLACE with your cloud name
  uploadPreset: 'Golden_Seal_Life_Sciences',
  // ... rest stays the same
};
```

**Example:**
```typescript
cloudName: 'djyp4qb2a',  // Your actual cloud name
```

### 3. Verify Upload Preset

In your Cloudinary console:
1. Go to **Settings** → **Upload**
2. Under **Upload presets**, verify `Golden_Seal_Life_Sciences` exists
3. It should have:
   - **Unsigned uploads enabled** (required for browser uploads)
   - **Folder**: `golden-seal-life-sciences`

If the preset doesn't exist, create it:
1. Click **Add upload preset**
2. Name: `Golden_Seal_Life_Sciences`
3. Signing mode: **Unsigned**
4. Folder: `golden-seal-life-sciences`
5. Save

### 4. Start Using It

Run the app:
```bash
npm run start:portable
```

Login to admin dashboard:
- URL: `http://localhost:4200/admin/login`
- Username: `admin`
- Password: `password`

Go to **Media** tab and upload an image:
- The image will be uploaded directly to Cloudinary
- Appears in your admin media library
- Available in product image selector
- Renders on product pages via Cloudinary CDN

## How It Works

### Upload Flow
1. **Admin uploads image** → Media tab file input
2. **Image cropped** → 16:10 aspect ratio (optional)
3. **Sent to Cloudinary** → Via upload preset (no server needed)
4. **Metadata stored in Firestore** → Just ID, name, hash, URL
5. **Image displays** → Via Cloudinary CDN (fast, cached globally)

### Key Benefits

| Feature | Benefit |
|---------|---------|
| **10GB free storage** | 100+ high-quality product images included |
| **CDN delivery** | Automatic caching, fast loads worldwide |
| **Auto-optimization** | Webp format, lazy loading, responsive sizes |
| **No Firebase Storage** | Avoids free tier Cloud Storage unavailability |
| **SHA-256 deduplication** | Same image uploaded twice = single Cloudinary file |

### Image Transformations

Cloudinary automatically optimizes images. The app requests:
- **Thumbnails**: 300×188px (16:10 aspect), quality 85
- **Product pages**: 800×500px (16:10 aspect), quality 85
- **Format**: Automatic WebP + fallback PNG/JPEG

These are defined in [cloudinary.config.ts](../src/app/core/config/cloudinary.config.ts).

## Fallback Behavior

If Cloudinary is not configured (cloud name is `YOUR_CLOUD_NAME`), images automatically fall back to **Base64 storage in Firestore**.

This means:
- ✅ App still works without Cloudinary setup
- ⚠️ Performance is slower (Firestore read/write costs)
- ✅ Useful during development or testing

To force Base64 mode for testing, change the cloud name back to `YOUR_CLOUD_NAME`.

## Troubleshooting

### Upload Fails with 401 Error
**Problem**: "Invalid upload preset"
- **Fix**: Verify preset name is exactly `Golden_Seal_Life_Sciences`
- **Fix**: Ensure preset has **Unsigned uploads enabled**

### Upload Fails with 422 Error
**Problem**: "Invalid file or format"
- **Fix**: Only JPEG, PNG, WebP, GIF allowed
- **Fix**: Max file size is 50MB

### Image Shows `data:image/...` URLs
**Problem**: Images still using Base64 fallback
- **Fix**: Update `cloudinaryConfig.cloudName` in [cloudinary.config.ts](../src/app/core/config/cloudinary.config.ts)
- **Fix**: Check browser console for errors

### Slow Image Loading
**Problem**: Taking >2 seconds to display
- **Fix**: This is normal for first upload (Cloudinary processing)
- **Fix**: Cached images load instantly after that
- **Optimization**: Consider reducing image size before upload

## Production Checklist

- [ ] Cloudinary account created and verified
- [ ] `cloudName` updated in cloudinary.config.ts
- [ ] Upload preset `Golden_Seal_Life_Sciences` created and enabled
- [ ] Test upload in admin media tab
- [ ] Verify images appear on `/products` page
- [ ] Check Cloudinary console for uploaded media folder

## Next Steps

### Scale Beyond Free Tier (if needed)
- **Current**: 10GB storage (`golden-seal-life-sciences` folder)
- **At 500 products**: ~5-8GB used (typically 10-15MB per image)
- **Cost**: $0.10/GB/month for storage after free tier

### Advanced Features
- **Image search**: Cloudinary AI tagging (find images by content)
- **Responsive delivery**: Different sizes for mobile/desktop
- **Automated cropping**: Smart crop to subject for thumbnails
- **Metadata**: Preserve EXIF, add watermarks

See [Cloudinary Docs](https://cloudinary.com/documentation) for details.

---

**Version**: March 30, 2026  
**Integration**: Cloudinary upload preset + Firestore metadata  
**Status**: Production-ready
