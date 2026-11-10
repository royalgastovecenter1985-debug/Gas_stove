import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { NextResponse } from 'next/server';
import { getAdmin } from '@/lib/auth';
import { BLOB_UPLOADS, IMAGE_MAX_MB, PDF_MAX_MB, TMP_PREFIX, VIDEO_MAX_MB } from '@/lib/uploads';

/**
 * POST /admin/upload — gives a signed-in admin's browser a short-lived token to upload one file
 * straight to Vercel Blob (under tmp/), bypassing Vercel's ~4.5 MB request limit.
 * The form then sends the file's Blob URL; the server action checks and processes it.
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!BLOB_UPLOADS) return NextResponse.json({ error: 'Direct uploads are not enabled.' }, { status: 404 });
  try {
    const body = (await request.json()) as HandleUploadBody;
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await getAdmin())) throw new Error('Please sign in again.');
        if (!pathname.startsWith(TMP_PREFIX) || pathname.includes('..')) throw new Error('Invalid upload path.');
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'],
          maximumSizeInBytes: Math.max(IMAGE_MAX_MB, VIDEO_MAX_MB, PDF_MAX_MB) * 1024 * 1024,
          addRandomSuffix: true,
          ttlDays: 1, // leftovers from forms that were never saved clean themselves up
        };
      },
    });
    return NextResponse.json(json);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Upload failed.' }, { status: 400 });
  }
}
