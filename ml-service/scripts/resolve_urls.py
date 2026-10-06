import urllib.request
import re

def resolve_url(url):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        # Open with redirect handling
        opener = urllib.request.build_opener(urllib.request.HTTPRedirectHandler)
        res = opener.open(req, timeout=15)
        print(f"URL: {url} -> Resolved: {res.geturl()} (Status: {res.getcode()})")
        info = res.info()
        print(f"  Content-Type: {info.get('Content-Type')}, Content-Length: {info.get('Content-Length')}")
        return res.geturl()
    except Exception as e:
        print(f"URL: {url} -> Error: {e}")
        return None

def check_uci_mathe():
    print("\n--- Checking UCI MathE download ---")
    urls_to_try = [
        "https://archive.ics.uci.edu/static/public/1031/assessing+mathematics+learning+in+higher+education.zip",
        "https://archive.ics.uci.edu/dataset/1031/assessing+mathematics+learning+in+higher+education",
    ]
    for u in urls_to_try:
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
            res = urllib.request.urlopen(req, timeout=15)
            print(f"UCI URL: {u} -> Status: {res.getcode()}, Final URL: {res.geturl()}")
            info = res.info()
            print(f"  Content-Type: {info.get('Content-Type')}, Content-Length: {info.get('Content-Length')}")
            if "html" in info.get("Content-Type", ""):
                html = res.read().decode("utf-8", errors="ignore")
                matches = re.findall(r'href="([^"]+)"', html)
                dl_links = [m for m in matches if "download" in m.lower() or ".zip" in m.lower() or ".csv" in m.lower()]
                print("  Download-related hrefs:", dl_links[:10])
        except Exception as e:
            print(f"UCI URL: {u} -> Error: {e}")

if __name__ == "__main__":
    print("--- Resolving EdNet Links ---")
    resolve_url("http://bit.ly/ednet-content")
    resolve_url("http://bit.ly/ednet_kt1")
    check_uci_mathe()
