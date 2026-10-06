import urllib.request
import re
import json

def probe_ednet():
    print("=== EDNET REPO PROBE ===")
    url = "https://raw.githubusercontent.com/riiid/ednet/master/README.md"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    content = urllib.request.urlopen(req, timeout=15).read().decode("utf-8", errors="ignore")
    
    # Look for download sections
    lines = content.split("\n")
    record = False
    for i, line in enumerate(lines):
        if "download" in line.lower() or "kt1" in line.lower() or "s3" in line.lower():
            start = max(0, i - 2)
            end = min(len(lines), i + 8)
            for j in range(start, end):
                print(f"{j:4d}: {lines[j]}")
            print("-" * 50)
            break

    # Find all links
    links = re.findall(r'https?://[^\s\)\"\'>]+', content)
    for l in set(links):
        print("Link:", l)

def probe_mathe():
    print("\n=== UCI MATHE PROBE ===")
    uci_api = "https://archive.ics.uci.edu/api/dataset?id=1031"
    try:
        req = urllib.request.Request(uci_api, headers={"User-Agent": "Mozilla/5.0"})
        res = urllib.request.urlopen(req, timeout=15).read().decode("utf-8")
        data = json.loads(res)
        dataset_info = data.get("data", {})
        print("Dataset Name:", dataset_info.get("name"))
        print("Download URL:", dataset_info.get("download_url"))
        print("License:", dataset_info.get("license_name") or dataset_info.get("license"))
        print("Instances:", dataset_info.get("num_instances"))
        print("Features:", dataset_info.get("num_features"))
        print("Files:")
        for f in dataset_info.get("files", []):
            print("  -", f)
    except Exception as e:
        print("UCI API error:", e)

def probe_secondary():
    print("\n=== SECONDARY DATASETS PROBE ===")
    # ASSISTments official research site
    print("Checking ASSISTments...")
    assistments_urls = [
        "https://sites.google.com/site/assistmentsdata/home",
        "https://sites.google.com/site/assistmentsdata/home/2012-13-school-data-with-affect",
        "https://sites.google.com/view/assistmentsdatamining/dataset"
    ]
    for u in assistments_urls:
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
            code = urllib.request.urlopen(req, timeout=10).getcode()
            print(f"  {u} -> Status: {code}")
        except Exception as e:
            print(f"  {u} -> Error: {e}")

    # OULAD
    print("Checking OULAD...")
    oulad_urls = [
        "https://analyse.kmi.open.ac.uk/open_dataset",
        "https://analyse.kmi.open.ac.uk/open_dataset/download"
    ]
    for u in oulad_urls:
        try:
            req = urllib.request.Request(u, headers={"User-Agent": "Mozilla/5.0"})
            code = urllib.request.urlopen(req, timeout=10).getcode()
            print(f"  {u} -> Status: {code}")
        except Exception as e:
            print(f"  {u} -> Error: {e}")

if __name__ == "__main__":
    probe_ednet()
    probe_mathe()
    probe_secondary()
