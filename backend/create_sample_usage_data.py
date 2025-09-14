#!/usr/bin/env python3
"""
Script to create sample usage data for testing the admin panel.
This will add some test usage records to demonstrate the admin functionality.
"""

import asyncio
from datetime import datetime, timedelta, timezone
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from app.config.database import get_admin_db_client


async def create_sample_usage_data():
    """Create sample usage data for testing the admin panel"""
    
    print("🔄 Creating sample usage data for admin panel testing...")
    
    try:
        admin_db = get_admin_db_client()
        
        # Get all users
        users_response = admin_db.table('users').select('id, email, role').execute()
        
        if not users_response.data:
            print("❌ No users found. Please create some users first.")
            return
        
        print(f"📊 Found {len(users_response.data)} users")
        
        sample_data = []
        current_time = datetime.now(timezone.utc)
        
        for i, user in enumerate(users_response.data):
            user_id = user['id']
            email = user['email']
            role = user['role']
            
            # Create varying usage patterns
            if role == 'admin':
                # Admin users - high usage
                stat_count = 15 + i
                fig_count = 12 + i
            elif role == 'researcher':
                # Researchers - medium-high usage
                stat_count = 8 + i
                fig_count = 6 + i
            else:
                # Regular users - low usage
                stat_count = min(3, 1 + i)  # Respect the limit
                fig_count = min(3, 1 + i)   # Respect the limit
            
            # Add some randomness to last activity (within last 30 days)
            days_ago = i % 30
            last_activity = current_time - timedelta(days=days_ago, hours=i % 24)
            
            # Create statistical analysis usage record
            if stat_count > 0:
                sample_data.append({
                    'user_id': user_id,
                    'feature_type': 'statistical_analysis',
                    'usage_count': stat_count,
                    'first_used': (last_activity - timedelta(days=days_ago)).isoformat(),
                    'last_used': last_activity.isoformat()
                })
            
            # Create figure analysis usage record
            if fig_count > 0:
                sample_data.append({
                    'user_id': user_id,
                    'feature_type': 'figure_analysis',
                    'usage_count': fig_count,
                    'first_used': (last_activity - timedelta(days=days_ago)).isoformat(),
                    'last_used': last_activity.isoformat()
                })
            
            print(f"  👤 {email} ({role}): {stat_count} stat, {fig_count} fig analyses")
        
        # Insert all sample data
        if sample_data:
            result = admin_db.table('user_usage').upsert(sample_data).execute()
            print(f"✅ Created {len(result.data)} usage records")
        
        # Also create some anonymous usage data
        print("🌐 Creating anonymous usage data...")
        anonymous_data = [
            {
                'ip_address': '192.168.1.100',
                'feature_type': 'statistical_analysis',
                'usage_count': 1,
                'first_used': (current_time - timedelta(days=2)).isoformat(),
                'last_used': (current_time - timedelta(days=2)).isoformat()
            },
            {
                'ip_address': '192.168.1.101',
                'feature_type': 'figure_analysis',
                'usage_count': 1,
                'first_used': (current_time - timedelta(days=1)).isoformat(),
                'last_used': (current_time - timedelta(days=1)).isoformat()
            },
            {
                'ip_address': '10.0.0.50',
                'feature_type': 'statistical_analysis',
                'usage_count': 1,
                'first_used': (current_time - timedelta(hours=5)).isoformat(),
                'last_used': (current_time - timedelta(hours=5)).isoformat()
            }
        ]
        
        anon_result = admin_db.table('anonymous_usage').upsert(anonymous_data).execute()
        print(f"✅ Created {len(anon_result.data)} anonymous usage records")
        
        print("🎉 Sample usage data created successfully!")
        print("🔄 Refresh the admin panel to see the new data.")
        
    except Exception as e:
        print(f"❌ Error creating sample data: {str(e)}")
        raise


async def clear_usage_data():
    """Clear all usage data"""
    print("🗑️  Clearing all usage data...")
    
    try:
        admin_db = get_admin_db_client()
        
        # Clear user usage
        user_result = admin_db.table('user_usage').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"🗑️  Cleared user usage records")
        
        # Clear anonymous usage
        anon_result = admin_db.table('anonymous_usage').delete().neq('id', '00000000-0000-0000-0000-000000000000').execute()
        print(f"🗑️  Cleared anonymous usage records")
        
        print("✅ All usage data cleared!")
        
    except Exception as e:
        print(f"❌ Error clearing data: {str(e)}")
        raise


async def main():
    """Main function"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Manage sample usage data for admin panel testing")
    parser.add_argument("--clear", action="store_true", help="Clear all usage data")
    parser.add_argument("--create", action="store_true", help="Create sample usage data")
    
    args = parser.parse_args()
    
    if args.clear:
        await clear_usage_data()
    elif args.create:
        await create_sample_usage_data()
    else:
        print("📋 Sample Usage Data Manager")
        print("=" * 40)
        
        choice = input("Choose action:\n1. Create sample data\n2. Clear all data\nEnter choice (1-2): ").strip()
        
        if choice == "1":
            await create_sample_usage_data()
        elif choice == "2":
            await clear_usage_data()
        else:
            print("❌ Invalid choice")


if __name__ == "__main__":
    asyncio.run(main()) 