import type { Metadata } from 'next';

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = decodeURIComponent(params.username);
  
  // Get API URL for server-side requests
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  
  let displayName = username;
  
  try {
    // Make direct HTTP request (server-side, no auth needed for public endpoint)
    const response = await fetch(`${apiUrl}/api/analytics/${encodeURIComponent(username)}/public`, {
      cache: 'no-store', // Don't cache metadata
    });
    
    if (response.ok) {
      const analytics = await response.json();
      displayName = analytics.is_anonymous 
        ? (analytics.display_name || 'Anonymous User')
        : analytics.username;
    }
  } catch (error) {
    // Use username as fallback if API call fails
    console.error('Failed to fetch analytics for metadata:', error);
  }
  
  const imageUrl = `${appUrl}/api/analytics/${encodeURIComponent(username)}/sankey-image`;
  const pageUrl = `${appUrl}/analytics/${encodeURIComponent(username)}`;
  
  return {
    title: `Analytics - ${displayName}'s Process Flow`,
    description: `View the stage flow visualization for ${displayName}'s public processes`,
    openGraph: {
      title: `Analytics - ${displayName}'s Process Flow`,
      description: `View the stage flow visualization for ${displayName}'s public processes`,
      type: 'website',
      url: pageUrl,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Sankey diagram for ${displayName}'s process flow`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `Analytics - ${displayName}'s Process Flow`,
      description: `View the stage flow visualization for ${displayName}'s public processes`,
      images: [imageUrl],
    },
  };
}

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

