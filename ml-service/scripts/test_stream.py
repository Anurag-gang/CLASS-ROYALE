import urllib.request
import zipfile
import io

def test_mathe_stream():
    url = "https://archive.ics.uci.edu/static/public/1031/dataset+for+assessing+mathematics+learning+in+higher+education.zip"
    print("Reading first 100KB of MathE ZIP...")
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=30) as res:
        data = res.read(100 * 1024)
        print("Read bytes:", len(data))
        # Let's read full stream if it's small
        full_data = data + res.read()
        print("Total MathE ZIP size (bytes):", len(full_data))
        
        # Test unzipping in memory to inspect filenames
        with zipfile.ZipFile(io.BytesIO(full_data)) as z:
            print("MathE ZIP files:", z.namelist())
            for info in z.infolist():
                print(f"  {info.filename}: size={info.file_size}")

def test_gdrive_download(file_id, label):
    print(f"\nTesting GDrive download for {label} (ID: {file_id})...")
    # Standard GDrive export/download URL
    url = f"https://drive.usercontent.google.com/download?id={file_id}&export=download&confirm=t"
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as res:
            print(f"  Status: {res.getcode()}, Content-Type: {res.headers.get('Content-Type')}")
            print(f"  Content-Disposition: {res.headers.get('Content-Disposition')}")
            print(f"  Content-Length: {res.headers.get('Content-Length')}")
            first_chunk = res.read(1024)
            print(f"  First 100 bytes (repr): {first_chunk[:100]}")
    except Exception as e:
        print(f"  GDrive error for {label}:", e)

if __name__ == "__main__":
    test_mathe_stream()
    test_gdrive_download("117aYJAWG3GU48suS66NPaB82HwFj6xWS", "EdNet-Contents")
    test_gdrive_download("1AmGcOs5U31wIIqvthn9ARqJMrMTFTcaw", "EdNet-KT1")
