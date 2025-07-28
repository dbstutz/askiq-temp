import os
import sys
import psutil
import asyncio
import requests
from xml.etree import ElementTree

from typing import List
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode
from insert_data import process_and_store_document


async def crawl_parallel(urls: List[str], max_concurrent: int = 3):
    print("\n=== Parallel Crawling with Browser Reuse + Memory Check ===")

    # We'll keep track of peak memory usage across all tasks
    peak_memory = 0
    process = psutil.Process(os.getpid())

    def log_memory(prefix: str = ""):
        nonlocal peak_memory
        current_mem = process.memory_info().rss  # in bytes
        if current_mem > peak_memory:
            peak_memory = current_mem
        print(f"{prefix} Current Memory: {current_mem // (1024 * 1024)} MB, Peak: {peak_memory // (1024 * 1024)} MB")

    # Minimal browser config
    browser_config = BrowserConfig(
        headless=True,
        verbose=False,
        extra_args=[
        "--disable-gpu", 
        "--disable-dev-shm-usage", 
        "--no-sandbox",
        "--log-level=3",
        "--silent",
        "--disable-logging",
        "--disable-default-apps",
        "--disable-extensions"
    ],
    )
    crawl_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS, verbose=False)

    # Create the crawler instance
    crawler = AsyncWebCrawler(config=browser_config)
    await crawler.start()

    try:
        # We'll chunk the URLs in batches of 'max_concurrent'
        success_count = 0
        fail_count = 0
        for i in range(0, len(urls), max_concurrent):
            batch = urls[i : i + max_concurrent]
            tasks = []

            for j, url in enumerate(batch):
                # Unique session_id per concurrent sub-task
                session_id = f"parallel_session_{i + j}"
                task = crawler.arun(url=url, config=crawl_config, session_id=session_id)
                tasks.append(task)

            # Check memory usage prior to launching tasks
            log_memory(prefix=f"Before batch {i//max_concurrent + 1}: ")

            # Gather results
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Check memory usage after tasks complete
            log_memory(prefix=f"After batch {i//max_concurrent + 1}: ")

            # Evaluate results
            for url, result in zip(batch, results):
                if isinstance(result, Exception):
                    print(f"Error crawling {url}: {result}")
                    fail_count += 1
                elif result.success:
                    success_count += 1
                    await process_and_store_document(url, result.markdown_v2.raw_markdown)
                else:
                    fail_count += 1

        print(f"\nSummary:")
        print(f"  - Successfully crawled: {success_count}")
        print(f"  - Failed: {fail_count}")

    finally:
        print("\nClosing crawler...")
        await crawler.close()
        # Final memory log
        log_memory(prefix="Final: ")
        print(f"\nPeak memory usage (MB): {peak_memory // (1024 * 1024)}")
        return results


def get_urls(sitemap_url: str):
    try:
        response = requests.get(sitemap_url)
        response.raise_for_status()
        
        # Parse the XML
        root = ElementTree.fromstring(response.content)
        
        # Extract all URLs from the sitemap
        # The namespace is usually defined in the root element
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        urls = [loc.text for loc in root.findall('.//ns:loc', namespace)]
                
        print(f"Found {len(urls)} total URLs in sitemap")
        return urls
    except Exception as e:
        print(f"Error fetching sitemap: {e}")
        return []


async def main():
    # urls = get_urls("https://majors.stanford.edu/sitemap.xml")
    if len(sys.argv) < 4:
        print("Usage: python crawler.py <sitemap_url> <category> <title>")
        return
    sitemap_url = sys.argv[1]
    category = sys.argv[2]
    title = sys.argv[3]
    urls = get_urls(sitemap_url)
    if urls:
        print(f"Found {len(urls)} URLs to crawl")
        await crawl_parallel(urls, max_concurrent=10, category=category, title=title)
    else:
        print("No URLs found to crawl")    

if __name__ == "__main__":
    asyncio.run(main())