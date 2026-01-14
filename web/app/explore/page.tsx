import type { Metadata } from 'next';
import ExplorePageClient from './ExplorePageClient';

const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

type Props = {
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const imageUrl = `${appUrl}/og-image.png`;
  
  // Build description based on search params
  const query = searchParams.search as string | undefined;
  const company = searchParams.company as string | undefined;
  const stage = searchParams.stage as string | undefined;
  const position = searchParams.position as string | undefined;
  const status = searchParams.status as string | undefined;
  const page = searchParams.page as string | undefined;
  
  let description = 'Discover job application processes shared by the community. Browse companies, positions, and stages.';
  const queryParts: string[] = [];
  
  if (query) queryParts.push(`search: "${query}"`);
  if (company) queryParts.push(`company: ${company}`);
  if (stage) queryParts.push(`stage: ${stage}`);
  if (position) queryParts.push(`position: ${position}`);
  if (status) queryParts.push(`status: ${status}`);
  if (page && page !== '1') queryParts.push(`page ${page}`);
  
  if (queryParts.length > 0) {
    description = `Discover job application processes: ${queryParts.join(', ')}. Browse companies, positions, and stages.`;
  }
  
  // Build URL with search params
  const params = new URLSearchParams();
  if (query) params.set('search', query);
  if (company) params.set('company', company);
  if (stage) params.set('stage', stage);
  if (position) params.set('position', position);
  if (status) params.set('status', status);
  if (page && page !== '1') params.set('page', page);
  
  const pageUrl = `${appUrl}/explore${params.toString() ? `?${params.toString()}` : ''}`;
  
  return {
    title: 'Explore Processes - Process',
    description,
    openGraph: {
      title: 'Explore Processes - Process',
      description,
      type: 'website',
      url: pageUrl,
      siteName: 'Process',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: 'Process - Job Application Tracker and Discord Bot',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Explore Processes - Process',
      description,
      images: [imageUrl],
    },
  };
}

export default function ExplorePage({ searchParams }: Props) {
  return <ExplorePageClient initialSearchParams={searchParams} />;
}
