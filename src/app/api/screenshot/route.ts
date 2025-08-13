import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { Website } from '@/lib/supabase';
import path from 'path';
import fs from 'fs';

type ScreenshotResult = {
  id: number;
  url: string;
  screenshot_path?: string;
  status: 'up' | 'down' | 'error';
  ssl_valid: boolean;
  response_time?: number;
  error_message?: string;
};

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function checkWebsiteStatus(url: string): Promise<{
  status: 'up' | 'down' | 'error';
  ssl_valid: boolean;
  response_time?: number;
  error_message?: string;
}> {
  const startTime = Date.now();
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(url, { 
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    clearTimeout(timeoutId);
    const response_time = Date.now() - startTime;

    return {
      status: response.ok ? 'up' : 'down',
      ssl_valid: url.startsWith('https://') && response.ok,
      response_time,
    };
  } catch (error: any) {
    const response_time = Date.now() - startTime;
    
    let error_message = 'Connection failed';
    if (error.name === 'AbortError') {
      error_message = 'Request timeout';
    } else if (error.message) {
      error_message = error.message.substring(0, 100); // Limit error message length
    }

    return {
      status: 'error',
      ssl_valid: false,
      response_time,
      error_message,
    };
  }
}

async function takeScreenshot(url: string, id: number): Promise<string | null> {
  let browser;
  
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080'
      ]
    });

    const page = await browser.newPage({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    });
    
    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to the page with timeout
    await page.goto(url, { 
      waitUntil: 'domcontentloaded', 
      timeout: 15000 
    });

    // Wait a bit for dynamic content to load
    await page.waitForTimeout(2000);

    // Take screenshot
    const fileName = `${id}_${Date.now()}.png`;
    const filePath = path.join(screenshotsDir, fileName);
    
    await page.screenshot({ 
      path: filePath, 
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 }
    });

    return `/screenshots/${fileName}`;
  } catch (error) {
    console.error(`Screenshot error for ${url}:`, error);
    return null;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { websites }: { websites: Website[] } = await request.json();

    if (!websites || !Array.isArray(websites) || websites.length === 0) {
      return NextResponse.json(
        { error: 'No websites provided' },
        { status: 400 }
      );
    }

    const results: ScreenshotResult[] = [];

    // Process websites sequentially to avoid overwhelming the system
    for (const website of websites) {
      console.log(`Processing ${website.url}...`);
      
      // Check website status
      const statusCheck = await checkWebsiteStatus(website.url);
      
      // Take screenshot only if the website is up
      let screenshot_path: string | undefined;
      if (statusCheck.status === 'up') {
        screenshot_path = await takeScreenshot(website.url, website.id) || undefined;
      }

      const result: ScreenshotResult = {
        id: website.id,
        url: website.url,
        screenshot_path,
        status: statusCheck.status,
        ssl_valid: statusCheck.ssl_valid,
        response_time: statusCheck.response_time,
        error_message: statusCheck.error_message,
      };

      results.push(result);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Screenshot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
