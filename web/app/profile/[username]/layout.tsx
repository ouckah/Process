import type { Metadata } from 'next';

type Props = {
  params: { username: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = decodeURIComponent(params.username);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  
  let profile: any = null;
  let displayName = username;
  let description = `View ${username}'s public profile on Process`;
  
  try {
    const response = await fetch(`${apiUrl}/api/profiles/${encodeURIComponent(username)}`, {
      cache: 'no-store',
    });
    if (response.ok) {
      profile = await response.json();
      displayName = profile.is_anonymous 
        ? (profile.display_name || 'Anonymous User')
        : profile.username;
      const stats = profile.stats || {};
      const processCount = stats.total_public_processes || 0;
      const offers = stats.offers_received || 0;
      description = `${displayName} - ${processCount} public processes, ${offers} offers received`;
    }
  } catch (error) {
    console.error('Failed to fetch profile for metadata:', error);
  }
  
  const imageUrl = `${appUrl}/api/og-image/profile/${encodeURIComponent(username)}`;
  const pageUrl = `${appUrl}/profile/${encodeURIComponent(username)}`;
  
  return {
    title: `${displayName} - Profile`,
    description,
    openGraph: {
      title: `${displayName} - Profile`,
      description,
      type: 'profile',
      url: pageUrl,
      siteName: 'Process',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName}'s profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} - Profile`,
      description,
      images: [imageUrl],
    },
  };
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
