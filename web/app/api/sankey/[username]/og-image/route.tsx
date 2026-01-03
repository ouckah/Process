import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } | Promise<{ username: string }> }
) {
  try {
    // Handle both Next.js 14 (sync) and 15 (async) params
    const resolvedParams = params instanceof Promise ? await params : params;
    const username = decodeURIComponent(resolvedParams.username);
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const pageUrl = `${appUrl}/sankey/${encodeURIComponent(username)}`;
    
    // Launch headless browser with Railway-optimized settings
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // Important for Railway
        '--disable-gpu',
      ],
    });
    
    try {
      const page = await browser.newPage();
      
      // Set a larger viewport to capture the full page
      await page.setViewport({
        width: 1920,
        height: 1080,
        deviceScaleFactor: 2,
      });
      
      // Navigate to the Sankey page
      await page.goto(pageUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000,
      });
      
      // Wait for the Sankey chart to be visible
      await page.waitForSelector('[data-sankey-chart]', { timeout: 10000 });
      
      // Wait a bit more for any animations to complete
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get the bounding box of the Sankey chart container
      const chartElement = await page.$('[data-sankey-chart]');
      if (!chartElement) {
        throw new Error('Sankey chart element not found');
      }
      
      const boundingBox = await chartElement.boundingBox();
      if (!boundingBox) {
        throw new Error('Could not get bounding box of chart');
      }
      
      // Calculate centered capture area (1200x630 for OG image)
      const targetWidth = 1200;
      const targetHeight = 630;
      
      // Get page dimensions
      const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      
      // Center horizontally on the chart
      // We want the chart to be roughly centered in the OG image
      const chartCenterX = boundingBox.x + boundingBox.width / 2;
      const clipX = Math.max(0, Math.floor(chartCenterX - targetWidth / 2));
      
      // Position vertically to include title and chart
      // Include some space above the chart for the title
      const titleSpace = 180; // Space for title above chart
      const clipY = Math.max(0, Math.floor(boundingBox.y - titleSpace));
      
      // Ensure we don't go beyond page bounds
      const finalX = Math.min(clipX, pageWidth - targetWidth);
      const finalY = Math.min(clipY, pageHeight - targetHeight);
      const finalWidth = Math.min(targetWidth, pageWidth - finalX);
      const finalHeight = Math.min(targetHeight, pageHeight - finalY);
      
      // Take screenshot of the centered chart area
      const screenshot = await page.screenshot({
        type: 'png',
        clip: {
          x: finalX,
          y: finalY,
          width: finalWidth,
          height: finalHeight,
        },
      });
      
      return new Response(screenshot as unknown as BodyInit, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    } finally {
      await browser.close();
    }
  } catch (e: any) {
    console.error('Error generating OG image with Puppeteer:', e);
    
    // Return a simple fallback image
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#F9FAFB"/>
  <text x="600" y="300" font-family="Arial" font-size="60" font-weight="700" text-anchor="middle" fill="#111827">
    📊 Sankey Diagram
  </text>
  <text x="600" y="360" font-family="Arial" font-size="30" text-anchor="middle" fill="#9CA3AF">
    Error loading diagram
  </text>
</svg>`,
      {
        headers: {
          'Content-Type': 'image/svg+xml',
        },
      }
    );
  }
}
