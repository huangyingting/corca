import { redirect } from 'next/navigation';

export default async function DeepProjectFileRoutePage({
  params,
}: {
  params: Promise<{ projectId: string; fileId: string[] }>;
}) {
  const { projectId, fileId } = await params;
  const targetFile = Array.isArray(fileId) ? fileId.join('/') : '';
  redirect(
    `/app/projects/${encodeURIComponent(projectId)}${
      targetFile ? `?file=${encodeURIComponent(targetFile)}` : ''
    }`
  );
}
