import { tool, type UIToolInvocation } from "ai"
import { z } from "zod"
import { chromium, type Browser } from "playwright"

const CHROME_EXECUTABLE =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

// ─── Browser singleton ────────────────────────────────────────────────────────

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

// ─── Search ───────────────────────────────────────────────────────────────────

export interface SearchResult {
  title: string
  url: string
  snippet: string
}

async function search(query: string, maxResults: number): Promise<SearchResult[]> {
  const browser = await getBrowser()
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    locale: "en-US",
  })
  const page = await context.newPage()

  try {
    // DuckDuckGo HTML endpoint — no bot blocking, clean DOM
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 })
    await page.waitForSelector(".result", { timeout: 10_000 })

    const results = await page.evaluate((max: number): SearchResult[] => {
      const out: SearchResult[] = []

      // Only select organic web results — excludes ads (result--ad class)
      for (const el of document.querySelectorAll(".result.web-result")) {
        if (out.length >= max) break

        const titleEl = el.querySelector(".result__a")
        const snippetEl = el.querySelector(".result__snippet")
        if (!titleEl) continue

        // DDG href format: //duckduckgo.com/l/?uddg=<encoded-url>&...
        const rawHref = titleEl.getAttribute("href") ?? ""
        let finalUrl = ""
        try {
          const qs = rawHref.includes("?") ? rawHref.split("?")[1] : ""
          const uddg = new URLSearchParams(qs).get("uddg")
          if (uddg) finalUrl = decodeURIComponent(uddg)
        } catch {
          // skip unparseable
        }

        if (!finalUrl.startsWith("http")) continue

        out.push({
          title: titleEl.textContent?.trim() ?? "",
          url: finalUrl,
          snippet: snippetEl?.textContent?.trim() ?? "",
        })
      }

      return out
    }, maxResults)

    return results
  } finally {
    await context.close()
  }
}

// ─── Tool definition ──────────────────────────────────────────────────────────

export const webSearchTool = tool({
  description:
    "Search the web for real-time information. Returns titles, URLs, and snippets. After calling this, you MUST immediately call fetchPage for ALL result URLs in parallel to get their full content.",
  inputSchema: z.object({
    query: z.string().describe("The search query"),
    maxResults: z
      .number()
      .optional()
      .default(5)
      .describe("Number of results to return (max 10)"),
  }),
  execute: async ({ query, maxResults = 5 }) => {
    const results = await search(query, Math.min(maxResults, 10))
    return { query, results, totalResults: results.length }
  },
})

export type WebSearchInvocation = UIToolInvocation<typeof webSearchTool>
