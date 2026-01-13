import type { Metadata } from 'next';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const imageUrl = `${appUrl}/api/og-image/forum`;
  const pageUrl = `${appUrl}/forum`;
  
  return {
    title: 'Forum - Process',
    description: 'Discuss job application processes, share experiences, and get advice from the community.',
    openGraph: {
      title: 'Forum - Process',
      description: 'Discuss job application processes, share experiences, and get advice from the community.',
      type: 'website',
      url: pageUrl,
      siteName: 'Process',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: 'Forum',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Forum - Process',
      description: 'Discuss job application processes, share experiences, and get advice from the community.',
      images: [imageUrl],
    },
  };
}

export default function ForumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
