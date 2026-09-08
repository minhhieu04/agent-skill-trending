#!/usr/bin/env python3
"""
Enriches all skills in agent_skills.db and backend/agent_skills.db with:
- Rich, distinct 3-item use_cases
- Contextual comparison_notes
- Specific target_audience
Importing from analyzer.skill_enricher.
"""

import sqlite3
import json
import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from analyzer.skill_enricher import derive_skill_details

def enrich_database(db_path: str):
    if not os.path.exists(db_path):
        print(f"Skipping {db_path}, file does not exist.")
        return
        
    print(f"Enriching database: {db_path}...")
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    
    cur.execute("SELECT id, name, title, description, category, primary_language, tags FROM skills")
    rows = cur.fetchall()
    
    updated_count = 0
    for row in rows:
        skill_id, name, title, desc, cat, lang, tags_json = row
        tags = []
        if tags_json:
            try:
                tags = json.loads(tags_json) if isinstance(tags_json, str) else tags_json
            except Exception:
                tags = []
                
        ucs, comp, aud = derive_skill_details(name, title, desc, cat, lang, tags)
        
        cur.execute(
            "UPDATE skills SET use_cases = ?, comparison_notes = ?, target_audience = ? WHERE id = ?",
            (json.dumps(ucs, ensure_ascii=False), comp, aud, skill_id)
        )
        updated_count += 1
        
    conn.commit()
    conn.close()
    print(f"Successfully enriched {updated_count} skills in {db_path}")

if __name__ == '__main__':
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
    dbs = [
        os.path.join(root_dir, 'agent_skills.db'),
        os.path.join(root_dir, 'backend', 'agent_skills.db')
    ]
    for db in dbs:
        enrich_database(db)
