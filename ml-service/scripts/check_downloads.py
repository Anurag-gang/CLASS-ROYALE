import urllib.request
import json

def check_mathe_zip():
    url = "https://archive.ics.uci.edu/static/public/1031/dataset+for+assessing+mathematics+learning+in+higher+education.zip"
    print("Testing MathE ZIP:", url)
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        res = urllib.request.urlopen(req, timeout=15)
        print("MathE Status:", res.getcode())
        print("MathE Content-Length:", res.headers.get("Content-Length"))
        print("MathE Content-Type:", res.headers.get("Content-Type"))
    except Exception as e:
        print("MathE Error:", e)

def check_ednet_repo_contents():
    print("\nChecking Riiid EdNet GitHub contents...")
    try:
        req = urllib.request.Request("https://api.github.com/repos/riiid/ednet/contents", headers={"User-Agent": "Mozilla/5.0"})
        res = urllib.request.urlopen(req, timeout=15)
        contents = json.loads(res.read().decode("utf-8"))
        for item in contents:
            print(f"  {item['name']} ({item['type']}): {item.get('download_url') or item.get('html_url')}")
    except Exception as e:
        print("EdNet GitHub contents error:", e)

if __name__ == "__main__":
    check_mathe_zip()
    check_ednet_repo_contents()
