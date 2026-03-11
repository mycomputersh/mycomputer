import { tool, type UIToolInvocation } from "ai"
import { z } from "zod"
import { chromium, type Browser } from "playwright"

const CHROME_EXECUTABLE =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

// ─── Shared browser singleton (reuses web-search's instance if available) ─────

let _browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (_browser?.isConnected()) return _browser

  _browser = await chromium.launch({
    executablePath: CHROME_EXECUTABLE,
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-blink-features=AutomationControlled",
    ],
  })

  _browser.on("disconnected", () => {
    _browser = null
  })

  return _browser
}

// ─── Page content extraction ──────────────────────────────────────────────────

async function fetchPageContent(
  url: string,
  timeout: number,
): Promise<{ title: string; content: string; url: string }> {
  const browser = await getBrowser()
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "en-US",
  })
  const page = await context.newPage()

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout })

    const result = await page.evaluate(() => {
      // Remove noise elements
      for (const sel of [
        "script", "style", "noscript", "iframe",
        "nav", "header", "footer", "aside",
        "[role='banner']", "[role='navigation']", "[role='complementary']",
        ".cookie-banner", ".ad", ".advertisement", "#cookie-notice",
      ]) {
        document.querySelectorAll(sel).forEach((el) => el.remove())
      }

      const title = document.title?.trim() ?? ""

      // Try to find the main content area
      const mainSelectors = [
        "main", "article", "[role='main']",
        ".post-content", ".article-content", ".entry-content",
        ".content", "#content", "#main",
      ]

      let contentEl: Element | null = null
      for (const sel of mainSelectors) {
        const el = document.querySelector(sel)
        if (el && (el.textContent?.trim().length ?? 0) > 200) {
          contentEl = el
          break
        }
      }

      // Fall back to body
      const rawText = ((contentEl ?? document.body) as HTMLElement).innerText ?? ""

      // Normalise whitespace: collapse runs of blank lines to at most two
      const content = rawText
        .replace(/\r\n/g, "\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim()

      return { title, content }
    })

    return { title: result.title, content: result.content, url: page.url() }
  } finally {
    await context.close()
  }
}

// ─── Tool definition ──────────────────────────────────────────────────────────

export const fetchPageTool = tool({
  description:
    "Fetch and extract the readable text content of a web page by URL. Use after webSearch to read the full content of a result.",
  inputSchema: z.object({
    url: z.string().url().describe("The URL to fetch"),
    maxChars: z
      .number()
      .optional()
      .default(20000)
      .describe("Maximum characters to return (default 20 000)"),
  }),
  execute: async ({ url, maxChars = 20_000 }) => {
    const { title, content, url: finalUrl } = await fetchPageContent(url, 15_000)
    const truncated = content.length > maxChars
    return {
      url: finalUrl,
      title,
      content: truncated ? content.slice(0, maxChars) + "\n\n[truncated]" : content,
      truncated,
      charCount: Math.min(content.length, maxChars),
    }
  },
})

export type FetchPageInvocation = UIToolInvocation<typeof fetchPageTool>
