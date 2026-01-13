'use client';

import { useState } from 'react';

export default function OGPreviewPage() {
  const [shareId, setShareId] = useState('');
  const [username, setUsername] = useState('');
  const [threadId, setThreadId] = useState('');

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '32px' }}>
        OG Image Preview
      </h1>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Explore */}
        <section>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Explore Page</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a
              href={`${baseUrl}/api/og-image/explore`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '12px 24px',
                backgroundColor: '#6366F1',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: '600',
              }}
            >
              Open Image
            </a>
            <img
              src={`${baseUrl}/api/og-image/explore`}
              alt="Explore OG Image"
              style={{ border: '2px solid #ddd', maxWidth: '600px' }}
            />
          </div>
        </section>

        {/* Forum */}
        <section>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Forum Page</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a
              href={`${baseUrl}/api/og-image/forum`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: '12px 24px',
                backgroundColor: '#6366F1',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '4px',
                fontWeight: '600',
              }}
            >
              Open Image
            </a>
            <img
              src={`${baseUrl}/api/og-image/forum`}
              alt="Forum OG Image"
              style={{ border: '2px solid #ddd', maxWidth: '600px' }}
            />
          </div>
        </section>

        {/* Forum Thread */}
        <section>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Forum Thread</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Enter thread ID"
              value={threadId}
              onChange={(e) => setThreadId(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '2px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '200px',
              }}
            />
            {threadId && (
              <>
                <a
                  href={`${baseUrl}/api/og-image/forum/${threadId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6366F1',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: '600',
                  }}
                >
                  Open Image
                </a>
                <img
                  src={`${baseUrl}/api/og-image/forum/${threadId}`}
                  alt="Forum Thread OG Image"
                  style={{ border: '2px solid #ddd', maxWidth: '600px' }}
                />
              </>
            )}
          </div>
        </section>

        {/* Profile */}
        <section>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Profile</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '2px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '200px',
              }}
            />
            {username && (
              <>
                <a
                  href={`${baseUrl}/api/og-image/profile/${encodeURIComponent(username)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6366F1',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: '600',
                  }}
                >
                  Open Image
                </a>
                <img
                  src={`${baseUrl}/api/og-image/profile/${encodeURIComponent(username)}`}
                  alt="Profile OG Image"
                  style={{ border: '2px solid #ddd', maxWidth: '600px' }}
                />
              </>
            )}
          </div>
        </section>

        {/* Process */}
        <section>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px' }}>Process</h2>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="Enter share ID"
              value={shareId}
              onChange={(e) => setShareId(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '2px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px',
                minWidth: '200px',
              }}
            />
            {shareId && (
              <>
                <a
                  href={`${baseUrl}/api/og-image/process/${shareId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#6366F1',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    fontWeight: '600',
                  }}
                >
                  Open Image
                </a>
                <img
                  src={`${baseUrl}/api/og-image/process/${shareId}`}
                  alt="Process OG Image"
                  style={{ border: '2px solid #ddd', maxWidth: '600px' }}
                />
              </>
            )}
          </div>
        </section>
      </div>

      <div style={{ marginTop: '48px', padding: '24px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '12px' }}>Direct URLs:</h3>
        <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <li>
            <code style={{ backgroundColor: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
              {baseUrl}/api/og-image/explore
            </code>
          </li>
          <li>
            <code style={{ backgroundColor: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
              {baseUrl}/api/og-image/forum
            </code>
          </li>
          <li>
            <code style={{ backgroundColor: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
              {baseUrl}/api/og-image/forum/[threadId]
            </code>
          </li>
          <li>
            <code style={{ backgroundColor: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
              {baseUrl}/api/og-image/profile/[username]
            </code>
          </li>
          <li>
            <code style={{ backgroundColor: '#fff', padding: '4px 8px', borderRadius: '4px' }}>
              {baseUrl}/api/og-image/process/[shareId]
            </code>
          </li>
        </ul>
      </div>
    </div>
  );
}
