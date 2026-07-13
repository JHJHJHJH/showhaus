import json
import os
import re
import time
import random
import requests
from urllib.parse import urljoin, quote, urlparse
from playwright.sync_api import sync_playwright

def random_delay(min_sec=1.0, max_sec=3.0):
    """Adds a randomized sleep delay."""
    time.sleep(random.uniform(min_sec, max_sec))

def get_mapbox_coordinates(address):
    """Retrieves WGS84 coordinates from Mapbox Geocoding API."""
    api_key = os.environ.get("MAPBOX_API_KEY")
    if not api_key:
        # Try to load from .env if not in environment
        try:
            with open(".env", "r") as f:
                for line in f:
                    if line.startswith("MAPBOX_API_KEY="):
                        api_key = line.split("=", 1)[1].strip()
                        break
        except Exception:
            pass
            
    if not api_key:
        print("Warning: MAPBOX_API_KEY not found. Skipping geocoding.")
        return None

    try:
        # Using Geocoding v6 API as per documentation
        encoded_address = quote(f"{address}, Singapore")
        url = f"https://api.mapbox.com/search/geocode/v6/forward?q={encoded_address}&country=sg&access_token={api_key}"
        
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            data = response.json()
            if data.get("features"):
                # Extract coordinates from the first feature
                # GeoJSON coordinates are [longitude, latitude]
                coords = data["features"][0]["geometry"]["coordinates"]
                return {
                    "longitude": coords[0],
                    "latitude": coords[1]
                }
    except Exception as e:
        print(f"Error geocoding address '{address}': {e}")
    
    return None

def human_scroll(page):
    """Simulates a human scrolling through the page."""
    for _ in range(random.randint(3, 7)):
        page.mouse.wheel(0, random.randint(300, 700))
        time.sleep(random.uniform(0.3, 0.8))

def download_file(url, folder, filename):
    """Downloads a file from a URL to a specific folder with human-like headers."""
    if not url:
        return None
    
    os.makedirs(folder, exist_ok=True)
    filepath = os.path.join(folder, filename)
    
    if os.path.exists(filepath):
        return filepath

    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://newlauncher.com.sg/"
    }

    try:
        response = requests.get(url, headers=headers, stream=True, timeout=15)
        if response.status_code == 200:
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            return filepath
    except Exception as e:
        print(f"Error downloading {url}: {e}")
    return None

def infer_file_extension(url, default=".jpg"):
    """Infers a file extension from a URL path."""
    if not url:
        return default

    parsed = urlparse(url)
    ext = os.path.splitext(parsed.path)[1]
    return ext or default

def extract_gallery_image_urls(page, gallery_selector, base_url):
    """Collects unique image URLs from a gallery, preferring full-size links."""
    gallery = page.query_selector(gallery_selector)
    if not gallery:
        return []

    urls = []
    seen = set()
    attribute_priority = ("href", "data-src", "data-image", "data-full", "data-zoom-image", "src")
    slide_elements = gallery.query_selector_all(".an-image")
    elements_to_scan = slide_elements if slide_elements else gallery.query_selector_all("a, img")

    for elem in elements_to_scan:
        candidates = [elem]
        if elem not in slide_elements:
            candidates = [elem]
        else:
            candidates.extend(elem.query_selector_all("a, img"))

        resolved_url = None
        for candidate_elem in candidates:
            for attr in attribute_priority:
                value = candidate_elem.get_attribute(attr)
                if not value or value.startswith("data:") or value.startswith("javascript:"):
                    continue

                candidate = urljoin(base_url, value)
                if candidate in seen:
                    continue

                resolved_url = candidate
                break

            if resolved_url:
                break

        if not resolved_url:
            continue

        seen.add(resolved_url)
        urls.append(resolved_url)

    return urls

def extract_table_data(table_elem):
    """Extracts data from a table element into a list of dicts."""
    if not table_elem:
        return []
    
    headers = []
    thead = table_elem.query_selector("thead")
    if thead:
        headers = [th.inner_text().strip() for th in thead.query_selector_all("th")]
    
    rows = []
    tbody = table_elem.query_selector("tbody")
    if tbody:
        tr_elements = tbody.query_selector_all("tr")
        for tr in tr_elements:
            cells = tr.query_selector_all("td")
            if cells:
                row_data = {}
                for i, cell in enumerate(cells):
                    header = headers[i] if i < len(headers) else f"column_{i}"
                    row_data[header] = cell.inner_text().strip()
                rows.append(row_data)
    return rows

def scrape_project_details(page, url):
    """Scrapes comprehensive details from an individual project page with human-like behavior."""
    print(f"Scraping detailed data for: {url}")
    project_id = url.split("/")[-1]
    project_folder = os.path.join("data", project_id)
    doc_folder = os.path.join(project_folder, "documents")
    fp_folder = os.path.join(doc_folder, "floor_plans")
    media_gallery_folder = os.path.join(doc_folder, "media_gallery")
    
    os.makedirs(project_folder, exist_ok=True)
    os.makedirs(doc_folder, exist_ok=True)
    os.makedirs(fp_folder, exist_ok=True)
    os.makedirs(media_gallery_folder, exist_ok=True)

    try:
        # Navigate with a random delay before starting
        random_delay(1.5, 4.0)
        page.goto(url, wait_until="domcontentloaded")
        
        # Simulate 'reading' the page
        human_scroll(page)
        random_delay(2.0, 5.0)
        
        content = page.content()
        
        details = {
            "id": project_id,
            "url": url,
            "name": "",
            "project_info": {},
            "facilities": [],
            "essential_amenities": [],
            "unit_mix": [],
            "balance_units": [],
            "floor_plans": [],
            "documents": {},
            "coordinates": None
        }
        
        # 1. Project Name
        h1_elem = page.query_selector("h1")
        if h1_elem:
            details["name"] = h1_elem.inner_text().strip()
        
        # 2. Project Info Section
        info_items = page.query_selector_all(".text_info_item")
        for item in info_items:
            small_tag = item.query_selector("small")
            p_tag = item.query_selector("p")
            if small_tag and p_tag:
                label = small_tag.inner_text().strip()
                value = p_tag.inner_text().strip().replace("\n", " ")
                details["project_info"][label] = value

        # Geocode the address
        address = details["project_info"].get("Street Address")
        if address:
            # Combining project name and street address for better precision
            search_query = f"{details['name']}, {address}"
            details["coordinates"] = get_mapbox_coordinates(search_query)
            # If not found with project name, try just the street address
            if not details["coordinates"]:
                details["coordinates"] = get_mapbox_coordinates(address)

        # 3. Facilities
        facility_elements = page.query_selector_all("#section-3 .swiper-wrapper ul.swiper-slide li")
        details["facilities"] = [li.inner_text().strip() for li in facility_elements if li.inner_text().strip()]

        # 4. Essential Amenities
        amenities_table = page.query_selector("#section-4 table.table-location-map")
        details["essential_amenities"] = extract_table_data(amenities_table)

        # 5. Unit Mix
        unit_mix_table = page.query_selector("#section-5 .card-body table")
        details["unit_mix"] = extract_table_data(unit_mix_table)

        # 6. Balance Units
        balance_units_table = page.query_selector("#section-6 .card-body table")
        details["balance_units"] = extract_table_data(balance_units_table)

        # 7. Floor Plans (Data & Images)
        unit_fp_match = re.search(r"var unit_fp = (\[.*?\]);", content)
        if unit_fp_match:
            try:
                unit_fp_data = json.loads(unit_fp_match.group(1))
                details["floor_plans"] = unit_fp_data
                
                # Download floor plan images with delays
                for unit in unit_fp_data:
                    unit_name = unit.get("unit_name", "unknown").replace("/", "_").replace(" ", "_")
                    unit_type = unit.get("unit_type", "unknown").replace("/", "_").replace(" ", "_")
                    
                    for i, fp in enumerate(unit.get("floorplans", [])):
                        fp_path = fp.get("path")
                        if fp_path:
                            fp_url = urljoin("https://newlauncher.com.sg/", fp_path)
                            ext = os.path.splitext(fp_path)[1] or ".png"
                            filename = f"{unit_type}_{unit_name}_{i}{ext}"
                            download_file(fp_url, fp_folder, filename)
                            random_delay(0.2, 0.8) # Small delay between downloads
            except Exception as e:
                print(f"Error parsing unit_fp for {project_id}: {e}")

        # 8. Documents (Location Map, Site Plan, Media Gallery)
        # Site Plan
        site_plan_link = page.query_selector("#site-plan-gallery a")
        if site_plan_link:
            href = site_plan_link.get_attribute("href")
            ext = os.path.splitext(href)[1] or ".jpg"
            local_path = download_file(href, doc_folder, f"site_plan{ext}")
            if local_path:
                details["documents"]["site_plan"] = local_path
            random_delay(0.5, 1.2)

        # Location Map
        loc_map_link = page.query_selector("#location-map-gallery a")
        if loc_map_link:
            href = loc_map_link.get_attribute("href")
            ext = os.path.splitext(href)[1] or ".png"
            local_path = download_file(href, doc_folder, f"location_map{ext}")
            if local_path:
                details["documents"]["location_map"] = local_path
            random_delay(0.5, 1.2)
        
        # Unit Mix Map (if separate)
        unit_mix_map_link = page.query_selector("#unit-mix-gallery a")
        if unit_mix_map_link:
            href = unit_mix_map_link.get_attribute("href")
            ext = os.path.splitext(href)[1] or ".png"
            local_path = download_file(href, doc_folder, f"unit_mix_map{ext}")
            if local_path:
                details["documents"]["unit_mix_map"] = local_path

        media_gallery_urls = extract_gallery_image_urls(page, "#media-thumbnails-gallery", url)
        if media_gallery_urls:
            media_gallery_paths = []
            for i, media_url in enumerate(media_gallery_urls, start=1):
                ext = infer_file_extension(media_url)
                local_path = download_file(media_url, media_gallery_folder, f"media_gallery_{i:02d}{ext}")
                if local_path:
                    media_gallery_paths.append(local_path)
                random_delay(0.2, 0.8)

            if media_gallery_paths:
                details["documents"]["media_gallery"] = media_gallery_paths

        # Save detailed JSON for this project
        with open(os.path.join(project_folder, "details.json"), "w", encoding="utf-8") as f:
            json.dump(details, f, indent=2, ensure_ascii=False)

        return details
    except Exception as e:
        print(f"Error scraping detailed data for {url}: {e}")
        return {"url": url, "error": str(e)}

def run_scraper(limit=None):
    """Orchestrates the scraping process with human-like delays and rotation."""
    base_url = "https://newlauncher.com.sg/search/page=MQ&sort_by=NA&"
    summary_file = "data/projects_summary.json"
    
    os.makedirs("data", exist_ok=True)
    
    user_agents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0"
    ]
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Randomize initial context
        context = browser.new_context(
            user_agent=random.choice(user_agents),
            viewport={"width": 1920, "height": 1080},
            extra_http_headers={"Accept-Language": "en-US,en;q=0.9"}
        )
        page = context.new_page()
        
        print(f"Navigating to search page: {base_url}")
        page.goto(base_url, wait_until="networkidle")
        
        project_links = page.query_selector_all("a[href^='https://newlauncher.com.sg/project/']")
        hrefs = []
        for link in project_links:
            href = link.get_attribute("href")
            if href and href not in hrefs:
                hrefs.append(href)
        
        total_found = len(hrefs)
        actual_limit = min(total_found, limit) if limit else total_found
        print(f"Found {total_found} unique projects. Scraping up to {actual_limit}...")
        
        summary_data = []
        for i, href in enumerate(hrefs[:actual_limit]):
            print(f"[{i+1}/{actual_limit}] Processing {href}...")
            detailed_data = scrape_project_details(page, href)
            
            # Create a summary entry
            summary_entry = {
                "id": detailed_data.get("id"),
                "name": detailed_data.get("name"),
                "url": detailed_data.get("url"),
                "district": detailed_data.get("project_info", {}).get("Postal District", ""),
                "property_type": detailed_data.get("project_info", {}).get("Project Category", ""),
                "expected_top": detailed_data.get("project_info", {}).get("Expected TOP", ""),
                "coordinates": detailed_data.get("coordinates")
            }
            summary_data.append(summary_entry)
            
            # Larger delay between different projects
            random_delay(5.0, 15.0)
            
        with open(summary_file, "w", encoding="utf-8") as f:
            json.dump(summary_data, f, indent=2, ensure_ascii=False)
            
        print(f"Scraping complete. Summary saved to {summary_file}")
        browser.close()

if __name__ == "__main__":
    # Default to a small limit for quick testing when run directly
    run_scraper(limit=2)
