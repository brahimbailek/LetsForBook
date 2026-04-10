import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'],
  api_key: process.env['CLOUDINARY_API_KEY'],
  api_secret: process.env['CLOUDINARY_API_SECRET'],
});

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { folder } = await req.json();
  const timestamp = Math.round(new Date().getTime() / 1000);

  const params = {
    timestamp,
    folder: folder || 'salons',
  };

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env['CLOUDINARY_API_SECRET']!
  );

  return NextResponse.json({
    signature,
    timestamp,
    apiKey: process.env['CLOUDINARY_API_KEY'],
    cloudName: process.env['NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME'],
    folder: params.folder,
  });
}
