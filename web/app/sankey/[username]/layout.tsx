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
    console.error('Failed to fetch Sankey data for metadata:', error);
  }
  
  // Open Graph image - must be absolute URL
  // Add cache-busting based on actual data changes (process count + last updated timestamp)
  // This ensures the OG image URL changes when processes are added/updated/deleted
  // External platforms (Discord, Twitter) cache OG images, so we need unique URLs per data state
  let cacheBuster = '';
  try {
    const analyticsResponse = await fetch(`${apiUrl}/api/analytics/${encodeURIComponent(username)}/public`, {
      cache: 'no-store',
    });
    
    if (analyticsResponse.ok) {
      const analytics = await analyticsResponse.json();
      if (analytics?.processes && analytics.processes.length > 0) {
        // Get the most recent updated_at timestamp from all processes AND stages
        let mostRecentUpdate: string | null = null;
        
        // Check process updated_at
        analytics.processes.forEach((process: any) => {
          const updatedAt = process.updated_at;
          if (!mostRecentUpdate || (updatedAt && updatedAt > mostRecentUpdate)) {
            mostRecentUpdate = updatedAt;
          }
        });
        
        // Also check stage updated_at from process_details
        if (analytics.process_details) {
          analytics.process_details.forEach((detail: any) => {
            if (detail.stages) {
              detail.stages.forEach((stage: any) => {
                const stageUpdatedAt = stage.updated_at;
                if (!mostRecentUpdate || (stageUpdatedAt && stageUpdatedAt > mostRecentUpdate)) {
                  mostRecentUpdate = stageUpdatedAt;
                }
              });
            }
          });
        }
        
        // Create cache buster from process count + most recent update timestamp
        // This changes whenever:
        // - A process is added (count changes)
        // - A process is deleted (count changes)
        // - A process is updated (mostRecentUpdate changes)
        // - A stage is added/updated (mostRecentUpdate changes)
        const processCount = analytics.processes.length;
        const updateHash = mostRecentUpdate 
          ? new Date(mostRecentUpdate).getTime() 
          : Date.now();
        
        // Use a short hash to keep URL manageable
        cacheBuster = `?v=${processCount}-${updateHash}`;
      } else {
        // No processes, use timestamp
        cacheBuster = `?v=0-${Date.now()}`;
      }
    } else {
      // API call failed, use timestamp as fallback
      cacheBuster = `?v=${Date.now()}`;
    }
  } catch (error) {
    // Fallback to timestamp if we can't fetch analytics
    cacheBuster = `?v=${Date.now()}`;
  }
  
  const imageUrl = new URL(`/api/sankey/${encodeURIComponent(username)}/og-image${cacheBuster}`, appUrl).toString();
  const pageUrl = new URL(`/sankey/${encodeURIComponent(username)}`, appUrl).toString();
  
  return {
    title: `Sankey Diagram - ${displayName}'s Process Flow`,
    description: `View the Sankey diagram visualization for ${displayName}'s public processes`,
    openGraph: {
      title: `Sankey Diagram - ${displayName}'s Process Flow`,
      description: `View the Sankey diagram visualization for ${displayName}'s public processes`,
      type: 'website',
      url: pageUrl,
      siteName: 'Process',
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
      title: `Sankey Diagram - ${displayName}'s Process Flow`,
      description: `View the Sankey diagram visualization for ${displayName}'s public processes`,
      images: [imageUrl],
    },
  };
}

export default function SankeyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

