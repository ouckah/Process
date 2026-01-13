import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } | Promise<{ username: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const username = decodeURIComponent(resolvedParams.username);
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Fetch profile data
    let profile: any = null;
    try {
      const response = await fetch(`${apiUrl}/api/profiles/${encodeURIComponent(username)}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        profile = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
    
    const displayName = profile?.display_name || profile?.username || username;
    const isAnonymous = profile?.is_anonymous || false;
    const stats = profile?.stats || {};
    const processes = profile?.processes || [];
    
    const totalProcesses = stats.total_public_processes || 0;
    const offers = stats.offers_received || 0;
    const active = stats.active_applications || 0;
    const rejected = stats.rejected || 0;
    const successRate = stats.success_rate || 0;
    
    // Get unique companies (truncated to 5)
    const companyNames: string[] = processes
      .map((p: any) => p.company_name)
      .filter((name: any): name is string => typeof name === 'string' && name !== null && name !== undefined);
    const companies: string[] = Array.from(new Set(companyNames)).slice(0, 5);
    
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
            backgroundColor: '#FAF9F6',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Background layer - shadow */}
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              width: '100%',
              height: '100%',
              backgroundColor: '#1A1A1A',
            }}
          />
          
          {/* Main content box */}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              width: '90%',
              height: '85%',
              backgroundColor: '#FAF9F6',
              border: '16px solid #1A1A1A',
              padding: '48px',
              transform: 'rotate(1deg)',
            }}
          >
            {/* Username/Display Name */}
            <div
              style={{
                fontSize: 56,
                fontWeight: 900,
                textTransform: 'uppercase',
                color: '#1A1A1A',
                marginBottom: 32,
                lineHeight: 1.2,
                letterSpacing: '-0.02em',
              }}
            >
              {isAnonymous ? displayName : `@${username}`}
            </div>
            
            {/* Stats Row */}
            <div
              style={{
                display: 'flex',
                gap: 20,
                marginBottom: 32,
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  backgroundColor: '#10B981',
                  color: '#FAF9F6',
                  padding: '12px 24px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(1deg)',
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {totalProcesses} PROCESSES
              </div>
              <div
                style={{
                  backgroundColor: '#3B82F6',
                  color: '#FAF9F6',
                  padding: '12px 24px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(-1deg)',
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {offers} OFFERS
              </div>
              <div
                style={{
                  backgroundColor: '#F59E0B',
                  color: '#1A1A1A',
                  padding: '12px 24px',
                  border: '8px solid #1A1A1A',
                  transform: 'rotate(1deg)',
                  fontSize: 20,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {active} ACTIVE
              </div>
              {successRate > 0 && (
                <div
                  style={{
                    backgroundColor: '#6366F1',
                    color: '#FAF9F6',
                    padding: '12px 24px',
                    border: '8px solid #1A1A1A',
                    transform: 'rotate(-1deg)',
                    fontSize: 20,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {successRate}% SUCCESS
                </div>
              )}
            </div>
            
            {/* Companies */}
            {companies.length > 0 && (
              <div
                style={{
                  marginTop: 'auto',
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    color: '#1A1A1A',
                    textTransform: 'uppercase',
                    marginBottom: 16,
                  }}
                >
                  COMPANIES
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                  }}
                >
                  {companies.map((company: string, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: '#1A1A1A',
                        color: '#FAF9F6',
                        padding: '10px 20px',
                        border: '6px solid #1A1A1A',
                        transform: idx % 2 === 0 ? 'rotate(0.5deg)' : 'rotate(-0.5deg)',
                        fontSize: 20,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                      }}
                    >
                      {company}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error: any) {
    console.error('OG image generation error:', error);
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#FAF9F6',
            fontSize: 32,
            fontWeight: 700,
            color: '#1A1A1A',
          }}
        >
          Profile
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
