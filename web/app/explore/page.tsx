import type { Metadata } from 'next';
import ExplorePageClient from './ExplorePageClient';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

export async function generateMetadata(): Promise<Metadata> {
  const imageUrl = `${appUrl}/api/og-image/explore`;
  const pageUrl = `${appUrl}/explore`;
  
  return {
    title: 'Explore Processes - Process',
    description: 'Discover job application processes shared by the community. Browse companies, positions, and stages.',
    openGraph: {
      title: 'Explore Processes - Process',
      description: 'Discover job application processes shared by the community. Browse companies, positions, and stages.',
      type: 'website',
      url: pageUrl,
      siteName: 'Process',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: 'Explore Processes',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Explore Processes - Process',
      description: 'Discover job application processes shared by the community.',
      images: [imageUrl],
    },
  };
}

export default function ExplorePage() {
  return <ExplorePageClient />;
}
