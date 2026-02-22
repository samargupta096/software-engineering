import json
import os
from pathlib import Path

def apply_updates(json_path):
    with open(json_path, 'r') as f:
        updates = json.load(f)
    
    # Group updates by file to minimize I/O
    file_updates = {}
    for update in updates:
        if update['new_link']:
            file_path = update['file']
            if file_path not in file_updates:
                file_updates[file_path] = []
            file_updates[file_path].append(update)
    
    total_fixed = 0
    for file_path, updates_list in file_updates.items():
        full_path = Path(file_path)
        if not full_path.exists():
            print(f"Warning: File {file_path} not found.")
            continue
            
        with open(full_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        new_content = content
        for update in updates_list:
            old_link = update['old_link']
            new_link = update['new_link']
            
            # Patterns to replace:
            # 1. Markdown: [label](old_link)
            # 2. HTML: href="old_link", href='old_link'
            # 3. HTML: src="old_link", src='old_link'
            
            # Markdown replacement
            search_md = f"({old_link})"
            replace_md = f"({new_link})"
            if search_md in new_content:
                new_content = new_content.replace(search_md, replace_md)
                total_fixed += 1
            
            # HTML replacement (href)
            for quote in ['"', "'"]:
                search_href = f'href={quote}{old_link}{quote}'
                replace_href = f'href={quote}{new_link}{quote}'
                if search_href in new_content:
                    new_content = new_content.replace(search_href, replace_href)
                    total_fixed += 1
                
                search_src = f'src={quote}{old_link}{quote}'
                replace_src = f'src={quote}{new_link}{quote}'
                if search_src in new_content:
                    new_content = new_content.replace(search_src, replace_src)
                    total_fixed += 1

        if new_content != content:
            with open(full_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Updated {file_path}")

    print(f"Total links fixed: {total_fixed}")

if __name__ == "__main__":
    import sys
    json_file = sys.argv[1] if len(sys.argv) > 1 else 'broken_links.json'
    apply_updates(json_file)
