import os
import re
from pathlib import Path
import json

def find_links(content):
    # Match [label](path)
    md_links = re.findall(r'\[.*?\]\((.*?)\)', content)
    # Match href="..." and src="..."
    html_links = re.findall(r'(?:href|src)=["\'](.*?)["\']', content)
    return md_links + html_links

def strip_prefix(name):
    # Strip leading numbers and hyphens: "01-system-design" -> "system-design"
    return re.sub(r'^\d+[-_ ]+', '', name)

def get_best_match(target_name, collection_map):
    # collection_map is {stripped_name: [original_paths]}
    target_stripped = strip_prefix(target_name).lower()
    
    # 1. Exact stripped match
    if target_stripped in collection_map:
        return collection_map[target_stripped]
    
    # 2. Fuzzy match on stripped names
    stripped_names = list(collection_map.keys())
    matches = difflib.get_close_matches(target_stripped, stripped_names, n=1, cutoff=0.7)
    if matches:
        return collection_map[matches[0]]
    
    return []

def resolve_path(current_file_path, link_path):
    if link_path.startswith(('http://', 'https://', 'mailto:', '#')):
        return None
    if link_path.startswith('/'):
        return Path(link_path[1:])
    current_dir = Path(current_file_path).parent
    try:
        resolved_str = os.path.normpath(os.path.join(current_dir, link_path))
        resolved = Path(resolved_str)
        repo_root = Path(os.getcwd()).resolve()
        if resolved.is_relative_to(repo_root):
            return resolved.relative_to(repo_root)
        else:
            return None 
    except Exception:
        return None

def main():
    repo_root = Path(os.getcwd()).resolve()
    all_files = list(repo_root.glob('**/*'))
    
    # Map stripped basename -> list of Paths
    file_map = {} 
    dir_map = {}
    
    for f in all_files:
        if '.git' in f.parts: continue
        rel_path = f.relative_to(repo_root)
        basename = f.name
        stripped = strip_prefix(basename).lower()
        
        target_map = file_map if f.is_file() else dir_map
        if stripped not in target_map:
            target_map[stripped] = []
        target_map[stripped].append(rel_path)

    broken_links = []
    
    md_files = list(repo_root.glob('**/*.md'))
    for md_file in md_files:
        if '.git' in md_file.parts: continue
        
        try:
            with open(md_file, 'r', encoding='utf-8') as f:
                content = f.read()
                links = find_links(content)
                
                for link in links:
                    clean_link = link.split('#')[0]
                    anchor = '#' + link.split('#')[1] if '#' in link else ''
                    if not clean_link: continue
                    
                    resolved = resolve_path(md_file, clean_link)
                    if resolved and not (repo_root / resolved).exists():
                        basename = Path(clean_link).name
                        
                        # Find best suggestion
                        best_suggestion = None
                        
                        # README.md handled specially
                        if basename.lower() == 'readme.md' and link.count('..') > 0:
                            if Path('README.md').exists():
                                best_suggestion = Path('README.md')
                        
                        if not best_suggestion:
                            # Try files then dirs
                            suggestions = get_best_match(basename, file_map)
                            if not suggestions:
                                suggestions = get_best_match(basename, dir_map)
                            
                            if suggestions:
                                if len(suggestions) == 1:
                                    best_suggestion = suggestions[0]
                                else:
                                    # Overlap heuristic
                                    file_parts = set(md_file.relative_to(repo_root).parts)
                                    def overlap_score(p):
                                        return len(set(p.parts) & file_parts)
                                    best_suggestion = max(suggestions, key=overlap_score)

                        new_link = None
                        if best_suggestion:
                            new_link_path = os.path.relpath(repo_root / best_suggestion, md_file.parent)
                            if not new_link_path.startswith('.'):
                                new_link_path = './' + new_link_path
                            new_link = new_link_path + anchor

                        broken_links.append({
                            'file': str(md_file.relative_to(repo_root)),
                            'old_link': link,
                            'new_link': new_link
                        })
        except Exception as e:
            pass

    print(json.dumps(broken_links, indent=2))

if __name__ == "__main__":
    main()
