import urllib.request
import re

def inspect_page(url, name):
    print(f"=== {name} ===")
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", errors="ignore")
        # Remove tags
        text = re.sub(r'<[^>]+>', ' ', html)
        lines = [re.sub(r'\s+', ' ', l).strip() for l in text.split('\n')]
        clean_lines = [l for l in lines if l]
        for l in clean_lines:
            if any(k in l.lower() for k in ["download", "registration", "register", "agree", "terms", "license", "form", "kaggle", "request"]):
                print("  ", l[:140])
    except Exception as e:
        print(f"Error {name}: {e}")

if __name__ == "__main__":
    inspect_page("https://analyse.kmi.open.ac.uk/open_dataset/download", "OULAD")
    inspect_page("https://sites.google.com/site/assistmentsdata/home/assistment-2009-2010-data", "ASSISTments")
