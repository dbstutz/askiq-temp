# AskIQ Scraper

This directory contains the web scraping components for the AskIQ project.

## Setup

### Python Dependencies
Install the required Python packages:
```bash
pip install -r requirements.txt
```

### Usage
Run the sitemap crawler:
```bash
python crawl_sitemap.py <sitemap_url> <category> <title>
```

Example:
```bash
python crawl_sitemap.py "https://example.com/sitemap.xml" "technology" "Tech Documentation"
```

## Files
- `crawl_sitemap.py` - Main crawler that processes sitemaps and crawls URLs
- `insert_data.py` - Data processing and storage utilities
- `requirements.txt` - Python dependencies