import { NextRequest } from 'next/server';
import puppeteer from 'puppeteer';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } | Promise<{ username: string }> }
) {
  const startTime = Date.now();
  console.log(`[OG Image] Starting generation at ${new Date().toISOString()}`);
  
  // Check for cache bypass query parameter
  const { searchParams } = new URL(request.url);
  const bypassCache = searchParams.get('nocache') === '1' || searchParams.get('nocache') === 'true';
  
  try {
    // Handle both Next.js 14 (sync) and 15 (async) params
    const resolvedParams = params instanceof Promise ? await params : params;
    const username = decodeURIComponent(resolvedParams.username);
    
    console.log(`[OG Image] Generating for username: ${username} (bypassCache: ${bypassCache})`);
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    const pageUrl = `${appUrl}/sankey/${encodeURIComponent(username)}`;
    
    console.log(`[OG Image] Page URL: ${pageUrl}`);
    
    // Launch headless browser with Railway-optimized settings
    console.log(`[OG Image] Launching Puppeteer browser...`);
    const browserLaunchStart = Date.now();
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Scroll to the chart element to ensure it's in view
      await page.evaluate(() => {
        const element = document.querySelector('[data-sankey-chart]');
        if (element) {
          element.scrollIntoView({ behavior: 'instant', block: 'start' });
        }
      });
      
      // Wait a moment for scroll to complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get the bounding box of the Sankey chart container
      const chartElement = await page.$('[data-sankey-chart]');
      if (!chartElement) {
        throw new Error('Sankey chart element not found');
      }
      
      const boundingBox = await chartElement.boundingBox();
      if (!boundingBox) {
        throw new Error('Could not get bounding box of chart');
      }
      
      // Log bounding box for debugging
      console.log('Chart bounding box:', {
        x: boundingBox.x,
        y: boundingBox.y,
        width: boundingBox.width,
        height: boundingBox.height,
      });
      
      // Get viewport size to ensure clip is within bounds
      const viewport = page.viewport();
      const viewportWidth = viewport?.width || 1920;
      const viewportHeight = viewport?.height || 1080;
      
      const clipX = Math.max(0, Math.floor(boundingBox.x));
      const clipY = Math.max(0, Math.floor(boundingBox.y));
      const clipWidth = Math.min(Math.floor(boundingBox.width), viewportWidth - clipX);
      const clipHeight = Math.min(Math.floor(boundingBox.height), viewportHeight - clipY);
      
      const clip = {
        x: clipX,
        y: clipY,
        width: clipWidth,
        height: clipHeight,
      };
      
      console.log('Screenshot clip:', clip);
      console.log('Viewport:', viewport);
      
      // Crop screenshot to only the chart element using its exact coordinates
      console.log(`[OG Image] Taking screenshot...`);
      const screenshotStart = Date.now();
      const screenshot = await page.screenshot({
        type: 'png',
        clip,
      });
      const screenshotDuration = Date.now() - screenshotStart;
      
      const duration = Date.now() - startTime;
      console.log(`[OG Image] Screenshot taken in ${screenshotDuration}ms`);
      console.log(`[OG Image] Total generation time: ${duration}ms`);
      console.log(`[OG Image] Screenshot size: ${screenshot.length} bytes`);
      
      // Set cache headers based on bypass flag
      const cacheControl = bypassCache 
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=3600, s-maxage=3600';
      
      return new Response(screenshot as unknown as BodyInit, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': cacheControl,
          'X-Generation-Time': `${duration}ms`,
          'X-Screenshot-Time': `${screenshotDuration}ms`,
          'X-Cache-Bypassed': bypassCache ? 'true' : 'false',
        },
      });
    } finally {
      await browser.close();
    }
  } catch (e: any) {
    const duration = Date.now() - startTime;
    console.error(`[OG Image] Error after ${duration}ms:`, e);
    console.error(`[OG Image] Error stack:`, e.stack);
    
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
