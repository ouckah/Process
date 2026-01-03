import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const username = decodeURIComponent(params.username);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Fetch analytics data
    const response = await fetch(
      `${apiUrl}/api/analytics/${encodeURIComponent(username)}/public`,
      { cache: 'no-store' }
    );
    
    if (!response.ok) {
      return new Response('Not Found', { status: 404 });
    }
    
    const analytics = await response.json();
    const displayName = analytics.is_anonymous
      ? (analytics.display_name || 'Anonymous User')
      : analytics.username;
    
    // Create Open Graph image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F9FAFB',
            fontSize: 60,
            fontWeight: 700,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: 80, marginBottom: 20 }}>
              📊 Process Flow Analytics
            </div>
            <div style={{ fontSize: 50, color: '#6B7280', marginBottom: 40 }}>
              {displayName}
            </div>
            <div style={{ fontSize: 40, color: '#9CA3AF' }}>
              {analytics.stats.total_public_processes} public process
              {analytics.stats.total_public_processes !== 1 ? 'es' : ''}
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e: any) {
    console.error('Error generating OG image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}

