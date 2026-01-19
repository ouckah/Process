import type { Metadata } from 'next';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const processId = params.id;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  
  let processData: any = null;
  let title = 'Process';
  let description = 'View this job application process on Process';
  
  try {
    const response = await fetch(`${apiUrl}/api/processes/${processId}/public`, {
      cache: 'no-store',
    });
    if (response.ok) {
      processData = await response.json();
      title = processData.company_name || title;
      const position = processData.position ? ` - ${processData.position}` : '';
      const username = processData.username ? ` by @${processData.username}` : '';
      const processDescription = processData.description 
        ? (processData.description.length > 150 ? processData.description.substring(0, 147) + '...' : processData.description)
        : null;
      
      if (processDescription) {
        description = `${processData.company_name}${position}${username}: ${processDescription}`;
      } else {
        description = `${processData.company_name}${position}${username} - ${processData.status || 'active'} status`;
      }
    }
  } catch (error) {
    console.error('Failed to fetch process for metadata:', error);
  }
  
  const imageUrl = new URL(`/api/og-image/process/${processId}`, appUrl).toString();
  const pageUrl = new URL(`/processes/${processId}`, appUrl).toString();
  
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

export default function ProcessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
