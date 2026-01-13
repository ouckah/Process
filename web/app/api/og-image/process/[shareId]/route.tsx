import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { shareId: string } | Promise<{ shareId: string }> }
) {
  try {
    const resolvedParams = params instanceof Promise ? await params : params;
    const shareId = resolvedParams.shareId;
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Fetch process data
    let processData: any = null;
    try {
      const response = await fetch(`${apiUrl}/api/processes/share/${shareId}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        processData = await response.json();
      }
    } catch (error) {
      console.error('Failed to fetch process:', error);
    }
    
    const companyName = processData?.company_name || 'Process';
    const position = processData?.position || null;
    const username = processData?.username || null;
    const status = processData?.status || 'active';
    const stages = processData?.stages || [];
    const stageCount = stages.length;
    
    // Status colors - matching email colors
    const statusColors: Record<string, { bg: string; text: string }> = {
      active: { bg: '#3b82f6', text: '#ffffff' },
      completed: { bg: '#10b981', text: '#ffffff' },
      rejected: { bg: '#ef4444', text: '#ffffff' },
    };
    const statusColor = statusColors[status] || statusColors.active;
    
    // Get first few stage names
    const stageNames = stages.slice(0, 3).map((s: any) => s.stage_name);
    
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
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '1000px', gap: '24px' }}>
            {/* Company Name - matching email title-wrapper */}
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
                    fontSize: '56px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '-0.02em',
                    margin: 0,
                    display: 'flex',
                  }}
                >
                  {companyName}
                </div>
              </div>
            </div>
            
            {/* Position - matching email button-wrapper */}
            {position ? (
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
                    padding: '12px 24px',
                    border: '4px solid #1c1917',
                    transform: 'rotate(-1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '24px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    display: 'flex',
                  }}
                >
                  {position}
                </div>
              </div>
            ) : (
              <div style={{ display: 'none' }} />
            )}
            
            {/* Status and Author */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                marginBottom: 32,
                flexWrap: 'wrap',
              }}
            >
              {/* Status Badge - matching email button-wrapper */}
              <div style={{ position: 'relative', display: 'flex' }}>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundColor: statusColor.bg === '#3B82F6' ? '#3b82f6' : statusColor.bg === '#10B981' ? '#10b981' : '#ef4444',
                    transform: 'translate(8px, 8px)',
                    display: 'flex',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    backgroundColor: statusColor.bg === '#3B82F6' ? '#3b82f6' : statusColor.bg === '#10B981' ? '#10b981' : '#ef4444',
                    color: '#ffffff',
                    padding: '12px 24px',
                    border: '4px solid #1c1917',
                    transform: 'rotate(1deg)',
                    fontFamily: 'DM Sans, system-ui, sans-serif',
                    fontSize: '18px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em',
                    display: 'flex',
                  }}
                >
                  {status.toUpperCase()}
                </div>
              </div>
              
              {/* Username Badge - matching email button-wrapper */}
              {username ? (
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
                      fontSize: '18px',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      display: 'flex',
                    }}
                  >
                    @{username}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'none' }} />
              )}
            </div>
            
            {/* Stages */}
            {stageCount > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
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
                  {stageCount} {stageCount === 1 ? 'STAGE' : 'STAGES'}
                </div>
                {stageNames.length > 0 ? (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                    }}
                  >
                    {stageNames.map((name: string, idx: number) => (
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
                            backgroundColor: '#F59E0B',
                            color: '#1c1917',
                            padding: '10px 20px',
                            border: '4px solid #1c1917',
                            transform: idx % 2 === 0 ? 'rotate(1deg)' : 'rotate(-1deg)',
                            fontSize: 18,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            display: 'flex',
                            fontFamily: 'DM Sans, system-ui, sans-serif',
                          }}
                        >
                          {name}
                        </div>
                      </div>
                    ))}
                    {stageCount > 3 ? (
                      <div
                        style={{
                          fontFamily: 'DM Sans, system-ui, sans-serif',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: '#1c1917',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          display: 'flex',
                        }}
                      >
                        +{stageCount - 3} MORE
                      </div>
                    ) : (
                      <div style={{ display: 'none' }} />
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'none' }} />
                )}
              </div>
            ) : (
              <div style={{ display: 'none' }} />
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
          Process
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
