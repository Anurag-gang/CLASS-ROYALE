import urllib.request
import re

def check_assistments():
    print("=== Checking ASSISTments Data Sources ===")
    # ASSISTments 2009-2010 or 2012-2013 data
    urls = [
        "https://sites.google.com/site/assistmentsdata/home/assistment-2009-2010-data",
        "https://sites.google.com/site/assistmentsdata/home/2012-13-school-data-with-affect",
        "https://sites.google.com/view/assistmentsdatamining/dataset"
    ]
    for u in urls:
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
            res = urllib.request.urlopen(req, timeout=15)
            html = res.read().decode("utf-8", errors="ignore")
            print(f"URL: {u} -> Status: {res.getcode()}")
            # Find links
            links = re.findall(r'href=[\'"]?([^\'" >]+)', html)
            data_links = [l for l in links if any(ext in l.lower() for ext in ['.csv', '.zip', '.tar.gz', 'download', 'drive.google'])]
            print(f"  Data links found ({len(data_links)}):", data_links[:5])
        except Exception as e:
            print(f"URL: {u} -> Error: {e}")

def check_oulad():
    print("\n=== Checking OULAD Data Sources ===")
    url = "https://analyse.kmi.open.ac.uk/open_dataset/download"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        res = urllib.request.urlopen(req, timeout=15)
        html = res.read().decode("utf-8", errors="ignore")
        print(f"URL: {url} -> Status: {res.getcode()}")
        links = re.findall(r'href=[\'"]?([^\'" >]+)', html)
        data_links = [l for l in links if any(ext in l.lower() for ext in ['.zip', '.csv', '.tar.gz', 'download'])]
        print(f"  OULAD data links ({len(data_links)}):", data_links[:5])
        # Check if login or form is required
        if "login" in html.lower() or "register" in html.lower() or "form" in html.lower():
            print("  Notice: Page mentions login/registration/terms form.")
    except Exception as e:
        print(f"URL: {url} -> Error: {e}")

if __name__ == "__main__":
    check_assistments()
    check_oulad()
