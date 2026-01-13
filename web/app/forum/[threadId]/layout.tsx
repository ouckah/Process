import type { Metadata } from 'next';

type Props = {
  params: { threadId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const threadId = params.threadId;
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  
  let thread: any = null;
  let title = 'Forum Thread';
  let description = 'View this forum thread on Process';
  
  try {
    const response = await fetch(`${apiUrl}/api/forum/threads/${threadId}`, {
      cache: 'no-store',
    });
    if (response.ok) {
      thread = await response.json();
      title = thread.title || title;
      const authorName = thread.author_username || thread.author_display_name || 'Anonymous';
      description = `Posted by ${authorName} - ${thread.reply_count || 0} replies, ${thread.view_count || 0} views`;
    }
  } catch (error) {
    console.error('Failed to fetch thread for metadata:', error);
  }
  
  const imageUrl = `${appUrl}/api/og-image/forum/${threadId}`;
  const pageUrl = `${appUrl}/forum/${threadId}`;
  
  return {
    title: `${title} - Forum`,
    description,
    openGraph: {
      title: `${title} - Forum`,
      description,
      type: 'article',
      url: pageUrl,
      siteName: 'Process',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} - Forum`,
      description,
      images: [imageUrl],
    },
  };
}

export default function ForumThreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
