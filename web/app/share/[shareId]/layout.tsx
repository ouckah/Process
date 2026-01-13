import type { Metadata } from 'next';

type Props = {
  params: { shareId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const shareId = params.shareId;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  
  let process: any = null;
  let title = 'Process';
  let description = 'View this job application process on Process';
  
  try {
    const response = await fetch(`${apiUrl}/api/processes/share/${shareId}`, {
      cache: 'no-store',
    });
    if (response.ok) {
      process = await response.json();
      title = process.company_name || title;
      const position = process.position ? ` - ${process.position}` : '';
      const username = process.username ? ` by @${process.username}` : '';
      description = `${process.company_name}${position}${username} - ${process.status || 'active'} status`;
    }
  } catch (error) {
    console.error('Failed to fetch process for metadata:', error);
  }
  
  const imageUrl = `${appUrl}/api/og-image/process/${shareId}`;
  const pageUrl = `${appUrl}/share/${shareId}`;
  
  return {
    title: `${title} - Process`,
    description,
    openGraph: {
      title: `${title} - Process`,
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'Process',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - Process`,
      description,
      images: [imageUrl],
    },
  };
}

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
