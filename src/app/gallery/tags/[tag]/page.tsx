import React from 'react';
import { GalleryView } from '@/components/GalleryView';

export default async function GalleryTagPage({
  params,
}: {
  params: Promise<{ tag: string }>;
}) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return <GalleryView initialTopic={decoded} />;
}
