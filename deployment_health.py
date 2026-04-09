#!/usr/bin/env python3
"""
Deployment health checks.
Verifies pages respond 200 after deploy before marking batch complete.
Also pings sitemaps and monitors for indexing.
"""
import logging
import time
import urllib.request
import urllib.error
from typing import List, Dict, Optional
from collections import defaultdict

logger = logging.getLogger(__name__)

class HealthChecker:
    """Verify deployed pages and sitemaps."""

    def __init__(self, timeout: int = 10, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries

    def check_page(self, url: str) -> Dict[str, any]:
        """
        Check single page.

        Returns:
            {
                "url": str,
                "status": int or None,
                "response_time": float,
                "error": str or None,
                "success": bool
            }
        """
        result = {
            "url": url,
            "status": None,
            "response_time": 0,
            "error": None,
            "success": False
        }

        for attempt in range(1, self.max_retries + 1):
            try:
                start = time.time()

                with urllib.request.urlopen(url, timeout=self.timeout) as response:
                    result["status"] = response.status
                    result["response_time"] = time.time() - start
                    result["success"] = (response.status == 200)

                    if result["success"]:
                        logger.info(f"  {url} → 200 ({result['response_time']:.2f}s) ✓")
                        return result

                    logger.warning(f"  {url} → {response.status}")
                    result["error"] = f"HTTP {response.status}"
                    return result

            except urllib.error.HTTPError as e:
                result["status"] = e.code
                result["error"] = f"HTTP {e.code}"
                logger.warning(f"  {url} → {e.code} (attempt {attempt}/{self.max_retries})")

            except urllib.error.URLError as e:
                result["error"] = str(e.reason)
                if attempt < self.max_retries:
                    logger.warning(f"  {url} → URLError (attempt {attempt}/{self.max_retries}, retrying...)")
                    time.sleep(2 ** attempt)  # exponential backoff
                else:
                    logger.error(f"  {url} → URLError: {e.reason}")

            except Exception as e:
                result["error"] = f"{type(e).__name__}: {e}"
                logger.error(f"  {url} → Error: {result['error']}")
                return result

        return result

    def check_pages(self, urls: List[str]) -> Dict[str, any]:
        """
        Check multiple pages.

        Returns:
            {
                "total": int,
                "passed": int,
                "failed": int,
                "errors": [{"url": str, "error": str}],
                "response_times": [float]
            }
        """
        logger.info(f"\nHealth Check: {len(urls)} pages")

        results = []
        errors = []
        response_times = []

        for url in urls:
            result = self.check_page(url)
            results.append(result)

            if not result["success"]:
                errors.append({
                    "url": url,
                    "error": result.get("error", "Unknown error"),
                    "status": result.get("status")
                })
            else:
                response_times.append(result["response_time"])

        summary = {
            "total": len(urls),
            "passed": len(results) - len(errors),
            "failed": len(errors),
            "errors": errors,
            "response_times": response_times,
            "avg_response_time": sum(response_times) / len(response_times) if response_times else 0,
            "success": len(errors) == 0
        }

        logger.info(f"Health Check Summary:")
        logger.info(f"  Passed: {summary['passed']}/{summary['total']}")
        logger.info(f"  Failed: {summary['failed']}/{summary['total']}")
        if response_times:
            logger.info(f"  Avg Response Time: {summary['avg_response_time']:.2f}s")

        if errors:
            logger.error(f"Failed URLs:")
            for err in errors:
                logger.error(f"    {err['url']} → {err['error']}")

        return summary

    def check_sitemap(self, sitemap_url: str) -> Dict[str, any]:
        """
        Check if sitemap is accessible and parseable.

        Returns:
            {
                "url": str,
                "status": int or None,
                "url_count": int,
                "success": bool,
                "error": str or None
            }
        """
        result = {
            "url": sitemap_url,
            "status": None,
            "url_count": 0,
            "success": False,
            "error": None
        }

        try:
            logger.info(f"Checking sitemap: {sitemap_url}")

            with urllib.request.urlopen(sitemap_url, timeout=self.timeout) as response:
                result["status"] = response.status

                if response.status != 200:
                    result["error"] = f"HTTP {response.status}"
                    logger.warning(f"  Sitemap → {response.status}")
                    return result

                # Parse XML
                import xml.etree.ElementTree as ET
                try:
                    root = ET.fromstring(response.read())

                    # Count <url> or <sitemap> entries
                    namespace = {"": "http://www.sitemaps.org/schemas/sitemap/0.9"}
                    urls = root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}url")

                    if not urls:  # might be sitemap index
                        urls = root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}sitemap")

                    result["url_count"] = len(urls)
                    result["success"] = True

                    logger.info(f"  Sitemap → 200 ({result['url_count']} entries) ✓")

                except ET.ParseError as e:
                    result["error"] = f"XML Parse Error: {e}"
                    logger.error(f"  Sitemap → Invalid XML: {e}")

        except urllib.error.HTTPError as e:
            result["status"] = e.code
            result["error"] = f"HTTP {e.code}"
            logger.error(f"  Sitemap → {e.code}")

        except Exception as e:
            result["error"] = f"{type(e).__name__}: {e}"
            logger.error(f"  Sitemap → Error: {e}")

        return result

    def check_sitemaps(self, sitemap_urls: List[str]) -> Dict[str, any]:
        """Check multiple sitemaps."""
        logger.info(f"\nSitemap Check: {len(sitemap_urls)} sitemaps")

        results = []
        total_urls = 0

        for url in sitemap_urls:
            result = self.check_sitemap(url)
            results.append(result)
            if result["success"]:
                total_urls += result["url_count"]

        summary = {
            "total_sitemaps": len(sitemap_urls),
            "accessible": sum(1 for r in results if r["success"]),
            "total_urls_indexed": total_urls,
            "results": results,
            "success": all(r["success"] for r in results)
        }

        logger.info(f"Sitemap Summary:")
        logger.info(f"  Accessible: {summary['accessible']}/{summary['total_sitemaps']}")
        logger.info(f"  Total URLs: {total_urls}")

        return summary


class PageRenderValidator:
    """
    Validate that generated pages render correctly.
    Checks for common issues: missing data, broken layouts, JS errors.
    """

    @staticmethod
    def validate_render(html_content: str, project_type: str) -> Dict[str, any]:
        """
        Validate rendered HTML.

        Args:
            html_content: Raw HTML response body
            project_type: "snapbrand" | "cardsnap" | "movieslike"

        Returns:
            {"valid": bool, "issues": []}
        """
        issues = []

        # Check for common broken patterns
        if not html_content or len(html_content) < 100:
            issues.append("HTML too short (likely 404 or error page)")

        if "<!DOCTYPE" not in html_content:
            issues.append("Missing DOCTYPE (may be error page)")

        if "<html" not in html_content.lower():
            issues.append("Missing <html> tag")

        # Check for placeholder/template markers
        if "{{" in html_content or "{%" in html_content:
            issues.append("Unrendered template variables found")

        if "[object Object]" in html_content:
            issues.append("JSON object serialized to string (likely missing data)")

        # Project-specific checks
        if project_type == "snapbrand":
            if "GENERATED_BUSINESS_TYPES" not in html_content:
                issues.append("Generated business types not in page")

        elif project_type == "cardsnap":
            if "GENERATED_NICHE_CONTENT" not in html_content:
                issues.append("Generated niche content not in page")

        elif project_type == "movieslike":
            if "movie" not in html_content.lower():
                issues.append("Movie content not found")

        return {
            "valid": len(issues) == 0,
            "issues": issues,
            "html_length": len(html_content)
        }
