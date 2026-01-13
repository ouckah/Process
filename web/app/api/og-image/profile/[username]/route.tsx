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
    const discordAvatar = profile?.discord_avatar;
    const discordId = profile?.discord_id;
    
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
    
    // Generate Discord avatar URL if available
    const avatarUrl = discordAvatar && discordId
      ? `https://cdn.discordapp.com/avatars/${discordId}/${discordAvatar}.png?size=256`
      : null;
    
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
            backgroundColor: '#fefcf8',
            fontFamily: 'DM Sans, system-ui, sans-serif',
            position: 'relative',
            padding: '40px',
          }}
        >
          {/* Main wrapper - matching email structure */}
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'row', width: '100%', maxWidth: '1000px', gap: '40px', alignItems: 'flex-start' }}>
            {/* Left side - Content */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: '24px' }}>
            {/* Username/Display Name - matching email title-wrapper */}
            <div style={{ position: 'relative', display: 'flex' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: '#1c1917',
                  transform: 'translate(8px, 8px)',
                  display: 'flex',
                }}
              />
              <div
                style={{
                  position: 'relative',
                  backgroundColor: '#1c1917',
                  color: '#fefcf8',
                  padding: '16px 24px',
                  border: '4px solid #1c1917',
                  transform: 'rotate(1deg)',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '48px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    margin: 0,
                    display: 'flex',
                  }}
                >
                  {isAnonymous ? displayName : `@${username}`}
                </div>
              </div>
            </div>
            
            {/* Stats Row - matching email button-wrapper */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              {/* Processes */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#10b981',
                    transform: 'translate(8px, 8px)',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#10b981',
                    color: '#ffffff',
                    padding: '12px 24px',
                    border: '4px solid #1c1917',
                    transform: 'rotate(1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                  }}
                >
                  {totalProcesses} PROCESSES
                </div>
              </div>
              
              {/* Offers */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#3b82f6',
                    transform: 'translate(8px, 8px)',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    padding: '12px 24px',
                    border: '4px solid #1c1917',
                    transform: 'rotate(-1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                  }}
                >
                  {offers} OFFERS
                </div>
              </div>
              
              {/* Active */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#f59e0b',
                    transform: 'translate(8px, 8px)',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: '#f59e0b',
                    color: '#1c1917',
                    padding: '12px 24px',
                    border: '4px solid #1c1917',
                    transform: 'rotate(1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '16px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                  }}
                >
                  {active} ACTIVE
                </div>
              </div>
              
              {/* Success Rate */}
              {successRate > 0 ? (
                <div style={{ position: 'relative', display: 'flex' }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: '#4f46e5',
                      transform: 'translate(8px, 8px)',
                      display: 'flex',
                    }}
                  />
                  <div
                    style={{
                      position: 'relative',
                      backgroundColor: '#4f46e5',
                      color: '#ffffff',
                      padding: '12px 24px',
                      border: '4px solid #1c1917',
                      transform: 'rotate(-1deg)',
                      fontFamily: 'DM Sans, system-ui, sans-serif',
                      fontSize: '16px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      display: 'flex',
                    }}
                  >
                    {successRate}% SUCCESS
                  </div>
                </div>
              ) : (
                <div style={{ display: 'none' }} />
              )}
            </div>
            
            {/* Companies - matching email notification-wrapper */}
            {companies.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div
                  style={{
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '20px',
                    fontWeight: 700,
                    color: '#1c1917',
                    textTransform: 'uppercase',
                    marginBottom: '8px',
                    letterSpacing: '0.05em',
                    display: 'flex',
                  }}
                >
                  COMPANIES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {companies.map((company: string, idx: number) => (
                    <div key={idx} style={{ position: 'relative', display: 'flex' }}>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: '#1c1917',
                          transform: 'translate(8px, 8px)',
                          display: 'flex',
                        }}
                      />
                      <div
                        style={{
                          position: 'relative',
                          backgroundColor: '#1c1917',
                          color: '#fefcf8',
                          padding: '10px 20px',
                          border: '4px solid #1c1917',
                          transform: idx % 2 === 0 ? 'rotate(1deg)' : 'rotate(-1deg)',
                          fontFamily: 'DM Sans, system-ui, sans-serif',
                          fontSize: '16px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.1em',
                          display: 'flex',
                        }}
                      >
                        {company}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ display: 'none' }} />
            )}
            </div>
            
            {/* Right side - Profile Picture */}
            {avatarUrl ? (
              <div style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#1c1917',
                    transform: 'translate(8px, 8px)',
                    borderRadius: '50%',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    border: '4px solid #1c1917',
                    transform: 'rotate(2deg)',
                    overflow: 'hidden',
                    display: 'flex',
                  }}
                >
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'flex',
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{ position: 'relative', display: 'flex', flexShrink: 0 }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: '#1c1917',
                    transform: 'translate(8px, 8px)',
                    borderRadius: '50%',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    border: '4px solid #1c1917',
                    backgroundColor: '#4f46e5',
                    transform: 'rotate(2deg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '72px',
                    fontWeight: 900,
                    color: '#ffffff',
                  }}
                >
                  {(displayName || username || '?').charAt(0).toUpperCase()}
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
            backgroundColor: '#fefcf8',
            fontSize: 32,
            fontWeight: 700,
            color: '#1c1917',
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
