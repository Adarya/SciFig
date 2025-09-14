#!/usr/bin/env python3
"""
Script to create the first admin user for SciFig system.
This script bypasses the normal authentication flow and directly creates an admin user.

Usage:
    python create_admin_user.py --email admin@example.com --password your_secure_password

Or run interactively:
    python create_admin_user.py
"""

import asyncio
import argparse
import getpass
import os
import sys
from pathlib import Path

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

from supabase import create_client, Client
from app.config.settings import settings


def get_admin_db_client() -> Client:
    """Get admin Supabase client"""
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key  # Use service role key for admin operations
    )


async def create_admin_user(email: str, password: str, full_name: str = None):
    """Create an admin user"""
    
    print(f"🔐 Creating admin user: {email}")
    
    try:
        # Initialize database client
        admin_db = get_admin_db_client()
        
        # Create user with Supabase Auth using admin client
        print("📝 Creating user in Supabase Auth...")
        auth_response = admin_db.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True,  # Auto-confirm email for admin
            "user_metadata": {
                "full_name": full_name or "System Administrator"
            }
        })
        
        if not auth_response.user:
            raise Exception("User creation failed in Supabase Auth")
        
        user_id = auth_response.user.id
        print(f"✅ User created in Supabase Auth with ID: {user_id}")
        
        # Create user profile in our custom users table
        print("📊 Creating user profile in database...")
        profile_data = {
            'id': user_id,
            'email': email,
            'full_name': full_name or "System Administrator",
            'role': 'admin',
            'is_active': True
        }
        
        profile_response = admin_db.table('users').upsert(profile_data).execute()
        
        if not profile_response.data:
            raise Exception("User profile creation failed")
        
        print(f"✅ Admin user profile created successfully!")
        print(f"📧 Email: {email}")
        print(f"👤 Name: {full_name or 'System Administrator'}")
        print(f"🔑 Role: admin")
        print(f"🆔 User ID: {user_id}")
        
        return user_id
        
    except Exception as e:
        print(f"❌ Error creating admin user: {str(e)}")
        raise


async def check_existing_admins():
    """Check if any admin users already exist"""
    try:
        admin_db = get_admin_db_client()
        response = admin_db.table('users').select('email, full_name').eq('role', 'admin').execute()
        
        if response.data:
            print(f"⚠️  Found {len(response.data)} existing admin user(s):")
            for admin in response.data:
                print(f"   - {admin['email']} ({admin.get('full_name', 'No name')})")
            return True
        
        return False
        
    except Exception as e:
        print(f"❌ Error checking existing admins: {str(e)}")
        return False


async def promote_user_to_admin(email: str):
    """Promote an existing user to admin role"""
    try:
        admin_db = get_admin_db_client()
        
        # Find user by email
        user_response = admin_db.table('users').select('*').eq('email', email).execute()
        
        if not user_response.data:
            print(f"❌ User with email {email} not found")
            return False
        
        user = user_response.data[0]
        
        if user['role'] == 'admin':
            print(f"⚠️  User {email} is already an admin")
            return True
        
        # Update user role to admin
        update_response = admin_db.table('users').update({
            'role': 'admin',
            'updated_at': 'NOW()'
        }).eq('email', email).execute()
        
        if update_response.data:
            print(f"✅ Successfully promoted {email} to admin role")
            return True
        else:
            print(f"❌ Failed to promote {email} to admin")
            return False
            
    except Exception as e:
        print(f"❌ Error promoting user to admin: {str(e)}")
        return False


def validate_email(email: str) -> bool:
    """Basic email validation"""
    import re
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_password(password: str) -> bool:
    """Basic password validation"""
    return len(password) >= 8


async def interactive_mode():
    """Interactive mode for creating admin user"""
    print("🚀 SciFig Admin User Creation Tool")
    print("=" * 40)
    
    # Check existing admins
    has_admins = await check_existing_admins()
    
    if has_admins:
        choice = input("\nDo you want to create another admin user? (y/N): ").lower()
        if choice not in ['y', 'yes']:
            print("👋 Exiting...")
            return
    
    print("\nChoose an option:")
    print("1. Create new admin user")
    print("2. Promote existing user to admin")
    
    choice = input("Enter choice (1-2): ").strip()
    
    if choice == "1":
        # Create new admin user
        print("\n📝 Creating new admin user...")
        
        while True:
            email = input("Email: ").strip()
            if validate_email(email):
                break
            print("❌ Invalid email format. Please try again.")
        
        while True:
            password = getpass.getpass("Password (min 8 characters): ")
            if validate_password(password):
                break
            print("❌ Password must be at least 8 characters. Please try again.")
        
        full_name = input("Full name (optional): ").strip() or None
        
        print(f"\n🔍 Creating admin user with:")
        print(f"   Email: {email}")
        print(f"   Name: {full_name or 'System Administrator'}")
        
        confirm = input("\nProceed? (y/N): ").lower()
        if confirm in ['y', 'yes']:
            await create_admin_user(email, password, full_name)
        else:
            print("❌ Cancelled")
    
    elif choice == "2":
        # Promote existing user
        print("\n👑 Promoting existing user to admin...")
        
        while True:
            email = input("User email to promote: ").strip()
            if validate_email(email):
                break
            print("❌ Invalid email format. Please try again.")
        
        confirm = input(f"\nPromote {email} to admin? (y/N): ").lower()
        if confirm in ['y', 'yes']:
            await promote_user_to_admin(email)
        else:
            print("❌ Cancelled")
    
    else:
        print("❌ Invalid choice")


async def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Create admin user for SciFig system")
    parser.add_argument("--email", help="Admin user email")
    parser.add_argument("--password", help="Admin user password")
    parser.add_argument("--name", help="Admin user full name")
    parser.add_argument("--promote", help="Promote existing user to admin")
    
    args = parser.parse_args()
    
    # Check if required environment variables are set
    if not settings.supabase_url or not settings.supabase_service_role_key:
        print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables must be set")
        print("\nPlease set these environment variables in your .env file or environment:")
        print("   SUPABASE_URL=your_supabase_url")
        print("   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key")
        sys.exit(1)
    
    try:
        if args.promote:
            # Promote existing user
            if not validate_email(args.promote):
                print("❌ Invalid email format")
                sys.exit(1)
            
            await promote_user_to_admin(args.promote)
            
        elif args.email and args.password:
            # Command line mode
            if not validate_email(args.email):
                print("❌ Invalid email format")
                sys.exit(1)
            
            if not validate_password(args.password):
                print("❌ Password must be at least 8 characters")
                sys.exit(1)
            
            await create_admin_user(args.email, args.password, args.name)
            
        else:
            # Interactive mode
            await interactive_mode()
            
    except KeyboardInterrupt:
        print("\n❌ Cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main()) 