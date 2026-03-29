# Image Storage Strategy (Free Tier Firebase)

## Current Implementation: Base64 in Firestore

Since Cloud Storage cannot be enabled on free tier Firebase accounts, images are now stored as **Base64 data URLs directly in Firestore**.

### How It Works

1. **Image Upload Flow**:
   - User uploads image in admin dashboard media tab
   - Image cropped via `ngx-image-cropper`
   - FileReader converts Blob → Base64 data URL (e.g., `data:image/jpeg;base64,...`)
   - SHA-256 hash computed for deduplication
   - Entire Base64 string stored in Firestore `media` collection

2. **Image Display**:
   - Product images loaded directly via `<img [src]="mediaItem.downloadUrl">` 
   - No additional requests; Base64 URLs render inline
   - Browser handles MIME type from data URL prefix

### Limitations & Workarounds

| Constraint | Impact | Workaround |
|-----------|--------|-----------|
| **1MB Firestore field limit** | Max ~800KB images after Base64 overhead | Compress/resize before upload; crop to essential area |
| **50KB Firestore read* | Slow page loads with many images | Cache media list locally (already done via signals) |
| **No CDN caching** | Slower international access | Upgrade plan or use Supabase/Cloudinary |
| **Browser memory** | Large Base64 strings can bloat DOM | Lazy-load media; limit dashboard preview count |

*Firestore bills per 100KB read; Base64 images inflate bytes vs. binary.

### Production Migration Path

When ready to upgrade beyond free tier, migrate to one of these (in priority order):

#### **Option 1: Firebase Cloud Storage** (Recommended)
- Enable Cloud Storage in Firebase Console
- Update [media.service.ts](../src/app/core/services/media.service.ts) to restore Cloud Storage upload code
- Benefits: Same Firebase ecosystem, pay-per-use pricing, CDN delivery
- Cost: ~$0.18/GB stored × image volume

#### **Option 2: Supabase Storage** (Drop-in Replacement)
- Sign up at supabase.com (free tier: 1GB storage)
- Supabase SDK is nearly identical to Firebase Storage API
- Update media service to use `supabase.storage.from('media').upload(...)`
- Simpler integration than Firebase (no complex rules)

#### **Option 3: Cloudinary** (Best for Images)
- Free tier: 10GB storage, unlimited transformations, CDN delivery
- Optimizes images automatically (WebP, thumbnails, responsive sizes)
- No code overhead; just upload via URL upload endpoint

#### **Option 4: AWS S3 + CloudFront** (Enterprise Scale)
- Free tier: 5GB storage for 12 months
- Fastest CDN, highest reliability
- Integration via AWS SDK or CloudFront presigned URLs

### Current File References

- **Media Upload**: [src/app/features/admin/admin-dashboard/admin-dashboard.component.ts](../src/app/features/admin/admin-dashboard/admin-dashboard.component.ts) (media tab)
- **Image Storage**: [src/app/core/services/media.service.ts](../src/app/core/services/media.service.ts)
- **Firebase Config**: [src/app/core/config/firebase.config.ts](../src/app/core/config/firebase.config.ts)

### Testing Base64 Images Locally

1. Start dev server: `npm run start:portable`
2. Login: `/admin/login` (admin / password)
3. Navigate to Admin Dashboard → Media tab
4. Upload any image (auto-crops to 16:10 aspect ratio)
5. Image appears in grid + becomes available in Products tab image selector
6. Product with image renders on `/products` and detail pages

### Performance Notes

- Base64 increases document size ~33% vs. binary storage
- Firestore costs scale with document size (charged per 100KB read)
- Typical product image (~200KB JPEG) → ~270KB as Base64 in Firestore
- 100 products × 270KB = 27MB Firestore data = ~2,700 read operations at 100% utilization

**Recommendation**: Stick with Base64 up to 50–100 products. Beyond that, migrate to paid plan + Cloud Storage or Supabase.

---

**Last Updated**: March 30, 2026  
**Firebase SDK**: v12.11+ (modular imports, no Cloud Storage module)
