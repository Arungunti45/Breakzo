import pathlib
root = pathlib.Path(r"c:/abhivorn/food_app/frontend/src")
for f in root.rglob('*.jsx'):
    try:
        txt = f.read_text(encoding='utf-8')
        if 'http://localhost:5000' in txt:
            new_txt = txt.replace('http://localhost:5000', 'http://localhost:8000')
            f.write_text(new_txt, encoding='utf-8')
            print(f'Updated {f}')
    except Exception as e:
        print(f'Error processing {f}: {e}')
