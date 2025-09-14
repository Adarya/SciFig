#!/usr/bin/env python3
"""
Manual database fix script to add missing project_id column to analyses table
"""

import os
import psycopg2
from dotenv import load_dotenv

def main():
    load_dotenv()
    
    # Parse Supabase URL to get connection details
    supabase_url = os.getenv('SUPABASE_URL')
    if not supabase_url:
        print("Error: SUPABASE_URL not found in environment")
        return
    
    # Extract database connection info from Supabase URL
    # Format: https://project-id.supabase.co
    project_id = supabase_url.replace('https://', '').replace('.supabase.co', '')
    
    # Supabase connection details
    conn_params = {
        'host': f'db.{project_id}.supabase.co',
        'database': 'postgres',
        'user': 'postgres',
        'password': os.getenv('SUPABASE_DB_PASSWORD', ''),  # You need to set this
        'port': 5432
    }
    
    print("Note: You need to set SUPABASE_DB_PASSWORD in your .env file")
    print("You can find this in your Supabase dashboard under Settings > Database")
    print()
    print("Alternative: Run this SQL manually in your Supabase SQL Editor:")
    print()
    print("ALTER TABLE public.analyses ADD COLUMN IF NOT EXISTS project_id UUID;")
    print("ALTER TABLE public.analyses ADD CONSTRAINT analyses_project_id_fkey")
    print("  FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;")
    print()
    
    # Try to connect if password is provided
    if conn_params['password']:
        try:
            conn = psycopg2.connect(**conn_params)
            cur = conn.cursor()
            
            # Add the column
            cur.execute("""
                ALTER TABLE public.analyses 
                ADD COLUMN IF NOT EXISTS project_id UUID;
            """)
            
            # Add the foreign key constraint
            cur.execute("""
                ALTER TABLE public.analyses 
                ADD CONSTRAINT IF NOT EXISTS analyses_project_id_fkey
                FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL;
            """)
            
            conn.commit()
            print("✅ Successfully added project_id column to analyses table")
            
        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            if 'conn' in locals():
                conn.close()

if __name__ == "__main__":
    main() 