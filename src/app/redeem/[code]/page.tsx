import { redirect } from 'next/navigation';

export default async function RedeemCodePathPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  redirect(`/redeem?code=${encodeURIComponent(code)}`);
}
