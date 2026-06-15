import glob
import re

files = glob.glob('c:/Users/pc/Desktop/Tinysteps/innonsh-tinysteps/**/*.tsx', recursive=True)
count = 0

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if '<Breadcrumbs' in content:
        new_content = re.sub(r'<Breadcrumbs[^>]*/>\s*', '', content)
        if new_content != content:
            with open(file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            count += 1
            print(f"Removed from {file}")

print(f"Total files updated: {count}")
