import { NextRequest, NextResponse } from 'next/server';
import { chromium } from 'playwright';
import { Website } from '@/lib/supabase';
import path from 'path';
import fs from 'fs';
import https from 'https';
import tls from 'tls';

type ScreenshotResult = {
  id: number;
  url: string;
  screenshot_path?: string;
  status: 'up' | 'down' | 'error';
  ssl_valid: boolean;
  ssl_expires?: string;
  ssl_days_remaining?: number;
  ssl_issued_date?: string;
  response_time?: number;
  error_message?: string;
};

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function getSSLCertificateInfo(url: string): Promise<{
  ssl_valid: boolean;
  ssl_expires?: string;
  ssl_days_remaining?: number;
  ssl_issued_date?: string;
}> {
  try {
    // Only check SSL for HTTPS URLs
    if (!url.startsWith('https://')) {
      return { ssl_valid: false };
    }

    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    const port = urlObj.port ? parseInt(urlObj.port) : 443;

    return new Promise((resolve) => {
      const socket = tls.connect(port, hostname, { servername: hostname }, () => {
        const cert = socket.getPeerCertificate();
        
        if (!cert || !cert.valid_from || !cert.valid_to) {
          socket.destroy();
          resolve({ ssl_valid: false });
          return;
        }

        const now = new Date();
        const validFrom = new Date(cert.valid_from);
        const validTo = new Date(cert.valid_to);
        
        const isValid = now >= validFrom && now <= validTo;
        const daysRemaining = Math.floor((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        socket.destroy();
        resolve({
          ssl_valid: isValid,
          ssl_expires: validTo.toISOString().split('T')[0], // YYYY-MM-DD format
          ssl_days_remaining: daysRemaining,
          ssl_issued_date: validFrom.toISOString().split('T')[0]
        });
      });

      socket.on('error', () => {
        resolve({ ssl_valid: false });
      });

      socket.setTimeout(5000, () => {
        socket.destroy();
        resolve({ ssl_valid: false });
      });
    });
  } catch (error) {
    return { ssl_valid: false };
  }
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
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Try GET request first for better compatibility with sites that block HEAD requests
    const response = await fetch(url, { 
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
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
      timeout: 30000 
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
      
      // Get detailed SSL certificate information
      const sslInfo = await getSSLCertificateInfo(website.url);
      
      // Always attempt to take screenshot, even if status check failed
      let screenshot_path: string | undefined;
      screenshot_path = await takeScreenshot(website.url, website.id) || undefined;
      
      // If screenshot was successful but status check failed, mark as 'up'
      let finalStatus = statusCheck.status;
      if (screenshot_path && statusCheck.status !== 'up') {
        finalStatus = 'up';
        console.log(`Status override for ${website.url}: Screenshot successful, marking as 'up'`);
      }

      // Determine final SSL validity - prioritize detailed SSL check, fallback to basic check
      let finalSSLValid = sslInfo.ssl_valid;
      if (!finalSSLValid && screenshot_path && website.url.startsWith('https://')) {
        finalSSLValid = true; // If screenshot successful and HTTPS, assume SSL is working
      }

      const result: ScreenshotResult = {
        id: website.id,
        url: website.url,
        screenshot_path,
        status: finalStatus,
        ssl_valid: finalSSLValid,
        ssl_expires: sslInfo.ssl_expires,
        ssl_days_remaining: sslInfo.ssl_days_remaining,
        ssl_issued_date: sslInfo.ssl_issued_date,
        response_time: statusCheck.response_time,
        error_message: screenshot_path ? undefined : statusCheck.error_message,
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
