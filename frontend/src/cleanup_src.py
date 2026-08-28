import pathlib, re

root = pathlib.Path(r"c:/abhivorn/food_app/frontend/src")

for file_path in root.rglob('*.jsx'):
    try:
        text = file_path.read_text(encoding='utf-8')
        # Remove leading line numbers like "12: " at start of lines
        cleaned = re.sub(r"^\d+:\s", "", text, flags=re.MULTILINE)
        # Replace old backend port 5000 with 8000
        cleaned = cleaned.replace('http://localhost:5000', 'http://localhost:8000')
        # Also replace socket.io URL if present
        cleaned = cleaned.replace("io('http://localhost:5000')", "io('http://localhost:8000')")
        file_path.write_text(cleaned, encoding='utf-8')
        print(f'Cleaned {file_path}')
    except Exception as e:
        print(f'Error processing {file_path}: {e}')
