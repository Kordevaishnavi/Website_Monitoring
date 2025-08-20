 import { NextRequest, NextResponse } from "next/server";
import { chromium } from "playwright";
import { Website } from "@/lib/supabase";
import path from "path";
import fs from "fs";
import tls from "tls";
import sslChecker from "ssl-checker";

type ScreenshotResult = {
  id: number;
  url: string;
  screenshot_path?: string;
  status: "up" | "down" | "error";
  ssl_valid: boolean;
  ssl_issued_date?: string;        // From remote: Date SSL was issued 
  ssl_expires?: string;            // From remote: Alias for ssl_expire_date
  ssl_expire_date?: string;        // From your version
  ssl_renew_date?: string;         // From your version
  ssl_days_remaining?: number;
  response_time?: number;
  error_message?: string;
};

// Ensure screenshots directory exists
const screenshotsDir = path.join(process.cwd(), "public", "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// Helper function to determine if a URL needs special handling
function needsSpecialHandling(url: string): boolean {
  const specialSites = [
    "amazon.com",
    "amazon.co.uk",
    "amazon.de",
    "amazon.fr",
    "amazon.in",
    "amazon.ca",
    "amazon.com.au",
    "ebay.com",
    "netflix.com",
    "facebook.com",
    "instagram.com",
    "twitter.com",
    "linkedin.com",
  ];

  return specialSites.some((site) => url.toLowerCase().includes(site));
}

// Get SSL certificate info using native TLS (more reliable for some sites)
async function getSSLCertificateInfo(url: string): Promise<{
  ssl_valid: boolean;
  ssl_expire_date?: string;
  ssl_expires?: string;
  ssl_days_remaining?: number;
  ssl_renew_date?: string;
  ssl_issued_date?: string;
}> {
  try {
    // Only check SSL for HTTPS URLs
    if (!url.startsWith("https://")) {
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

        const expire_date = validTo.toISOString().split('T')[0]; // YYYY-MM-DD format
        const issued_date = validFrom.toISOString().split('T')[0];

        socket.destroy();
        resolve({
          ssl_valid: isValid,
          ssl_expire_date: expire_date,
          ssl_expires: expire_date, // Include both formats for compatibility
          ssl_days_remaining: daysRemaining,
          ssl_renew_date: issued_date,
          ssl_issued_date: issued_date // Include both formats for compatibility
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

// Alternative SSL check using ssl-checker package
async function checkSSLWithChecker(url: string): Promise<{
  ssl_valid: boolean;
  ssl_renew_date?: string;
  ssl_issued_date?: string;
  ssl_expire_date?: string;
  ssl_expires?: string;
  ssl_days_remaining?: number;
}> {
  if (!url.startsWith("https://")) {
    return { ssl_valid: false };
  }

  try {
    const { valid, validFrom, validTo, daysRemaining } = await sslChecker(
      url.replace(/^https?:\/\//, "").replace(/\/$/, ""), 
      { method: "GET", port: 443 }
    );
    
    return {
      ssl_valid: !!valid,
      ssl_renew_date: validFrom,
      ssl_issued_date: validFrom, // Include both formats for compatibility
      ssl_expire_date: validTo,
      ssl_expires: validTo, // Include both formats for compatibility
      ssl_days_remaining: daysRemaining
    };
  } catch (e) {
    return { ssl_valid: false };
  }
}

async function checkWebsiteStatus(url: string): Promise<{
  status: "up" | "down" | "error";
  ssl_valid: boolean;
  ssl_renew_date?: string;
  ssl_issued_date?: string;
  ssl_expire_date?: string;
  ssl_expires?: string;
  ssl_days_remaining?: number;
  response_time?: number;
  error_message?: string;
}> {
  const startTime = Date.now();
  const isSpecialSite = needsSpecialHandling(url);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    // Always use GET for better compatibility
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1"
      },
    });

    clearTimeout(timeoutId);
    const response_time = Date.now() - startTime;

    // Get SSL certificate info
    let sslInfo: {
      ssl_valid: boolean;
      ssl_renew_date?: string;
      ssl_issued_date?: string;
      ssl_expire_date?: string;
      ssl_expires?: string;
      ssl_days_remaining?: number;
    } = { ssl_valid: false };
    
    if (url.startsWith("https://")) {
      // Try both SSL check methods and use the one that works
      const nativeSslInfo = await getSSLCertificateInfo(url);
      if (nativeSslInfo.ssl_valid) {
        sslInfo = nativeSslInfo;
      } else {
        const checkerSslInfo = await checkSSLWithChecker(url);
        if (checkerSslInfo.ssl_valid) {
          sslInfo = checkerSslInfo;
        }
      }
    }

    return {
      status: response.ok ? "up" : "down",
      ssl_valid: url.startsWith("https://") && (response.ok || sslInfo.ssl_valid),
      ssl_renew_date: sslInfo.ssl_renew_date,
      ssl_issued_date: sslInfo.ssl_issued_date || sslInfo.ssl_renew_date,
      ssl_expire_date: sslInfo.ssl_expire_date,
      ssl_expires: sslInfo.ssl_expires || sslInfo.ssl_expire_date,
      ssl_days_remaining: sslInfo.ssl_days_remaining,
      response_time,
    };
  } catch (error: any) {
    const response_time = Date.now() - startTime;
    let error_message = "Connection failed";
    if (error.name === "AbortError") {
      error_message = "Request timeout";
    } else if (error.message) {
      error_message = error.message.substring(0, 100); // Limit error message length
    }

    // Try to get SSL info even if connection failed
    let sslInfo: {
      ssl_valid: boolean;
      ssl_renew_date?: string;
      ssl_issued_date?: string;
      ssl_expire_date?: string;
      ssl_expires?: string;
      ssl_days_remaining?: number;
    } = { ssl_valid: false };
    
    if (url.startsWith("https://")) {
      const nativeSslInfo = await getSSLCertificateInfo(url);
      if (nativeSslInfo.ssl_valid) {
        sslInfo = nativeSslInfo;
      } else {
        const checkerSslInfo = await checkSSLWithChecker(url);
        if (checkerSslInfo.ssl_valid) {
          sslInfo = checkerSslInfo;
        }
      }
    }

    return {
      status: "error",
      ssl_valid: sslInfo.ssl_valid,
      ssl_renew_date: sslInfo.ssl_renew_date,
      ssl_issued_date: sslInfo.ssl_issued_date || sslInfo.ssl_renew_date,
      ssl_expire_date: sslInfo.ssl_expire_date,
      ssl_expires: sslInfo.ssl_expires || sslInfo.ssl_expire_date,
      ssl_days_remaining: sslInfo.ssl_days_remaining,
      response_time,
      error_message,
    };
  }
}

async function takeScreenshot(
  url: string,
  id: number,
  retryCount: number = 0
): Promise<string | null> {
  let browser;
  const isSpecialSite = needsSpecialHandling(url);

  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080",
        "--disable-blink-features=AutomationControlled",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-http2", // Disable HTTP2 to avoid protocol errors
        "--disable-background-networking",
        ...(isSpecialSite
          ? [
              "--disable-background-timer-throttling",
              "--disable-backgrounding-occluded-windows",
              "--disable-renderer-backgrounding",
            ]
          : []),
      ],
    });

    const page = await browser.newPage({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    });

    // Set viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Set longer timeouts for complex sites
    const timeout = isSpecialSite ? 60000 : 45000; // 60 seconds for special sites, 45 for others
    page.setDefaultTimeout(timeout);
    page.setDefaultNavigationTimeout(timeout);

    // For special sites, use a different wait strategy
    const waitUntil = isSpecialSite ? "domcontentloaded" : "networkidle";

    // Navigate to the page with extended timeout
    await page.goto(url, {
      waitUntil,
      timeout,
    });

    // Special handling for different site types
    if (isSpecialSite) {
      // For Amazon and similar sites, wait longer and handle potential redirects
      await page.waitForTimeout(5000); // Initial wait

      // Try to wait for common elements
      try {
        await Promise.race([
          page.waitForSelector("body", { timeout: 10000 }),
          page.waitForSelector("[data-testid]", { timeout: 10000 }),
          page.waitForSelector(".nav-logo", { timeout: 10000 }), // Amazon specific
          page.waitForTimeout(10000),
        ]);
      } catch (waitError) {
        console.log(
          `Special site element wait failed for ${url}, continuing...`
        );
      }

      // Additional wait for dynamic content
      await page.waitForTimeout(5000);
    } else {
      // Standard handling for other sites
      try {
        await Promise.race([
          page.waitForSelector("body", { timeout: 5000 }),
          page.waitForTimeout(5000),
        ]);
        await page.waitForTimeout(3000);
      } catch (waitError) {
        console.log(
          `Standard wait failed for ${url}, continuing with screenshot`
        );
      }
    }

    // Take screenshot
    const fileName = `${id}_${Date.now()}.png`;
    const filePath = path.join(screenshotsDir, fileName);

    await page.screenshot({
      path: filePath,
      fullPage: false,
      clip: { x: 0, y: 0, width: 1920, height: 1080 },
      timeout: 30000, // 30 second timeout for screenshot
    });

    return `/screenshots/${fileName}`;
  } catch (error: any) {
    console.error(
      `Screenshot error for ${url} (attempt ${retryCount + 1}):`,
      error
    );

    // Retry logic for timeout errors (max 1 retry)
    if (
      retryCount < 1 &&
      error?.message &&
      (error.message.includes("timeout") ||
        error.message.includes("Navigation"))
    ) {
      console.log(`Retrying screenshot for ${url}...`);
      if (browser) {
        await browser.close();
      }
      // Wait a bit before retry
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return takeScreenshot(url, id, retryCount + 1);
    }

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
        { error: "No websites provided" },
        { status: 400 }
      );
    }

    const results: ScreenshotResult[] = [];

    // Process websites sequentially to avoid overwhelming the system
    for (const website of websites) {
      console.log(`Processing ${website.url}...`);

      // Check website status first
      const statusCheck = await checkWebsiteStatus(website.url);

      // Always attempt to take screenshot, even for sites that appear to be down
      let screenshot_path: string | undefined;
      console.log(`Taking screenshot for ${website.url}...`);
      screenshot_path = (await takeScreenshot(website.url, website.id)) || undefined;

      // If screenshot was successful but status check failed, mark as 'up'
      if (screenshot_path && statusCheck.status !== "up") {
        statusCheck.status = "up";
        console.log(`Status override for ${website.url}: Screenshot successful, marking as 'up'`);
        
        if (website.url.startsWith("https://")) {
          statusCheck.ssl_valid = true; // If HTTPS site can be screenshotted, SSL is likely working
        }
      }

      const result: ScreenshotResult = {
        id: website.id,
        url: website.url,
        screenshot_path,
        status: statusCheck.status,
        ssl_valid: statusCheck.ssl_valid,
        ssl_renew_date: statusCheck.ssl_renew_date,
        ssl_issued_date: statusCheck.ssl_issued_date,
        ssl_expire_date: statusCheck.ssl_expire_date,
        ssl_expires: statusCheck.ssl_expires,
        ssl_days_remaining: statusCheck.ssl_days_remaining,
        response_time: statusCheck.response_time,
        error_message: screenshot_path ? undefined : statusCheck.error_message,
      };

      results.push(result);
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error("Screenshot API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
