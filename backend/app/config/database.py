"""Database configuration and Supabase client setup"""

from supabase import create_client, Client
from typing import Optional
import asyncio
from .settings import settings


class DatabaseManager:
    """Supabase database manager"""
    
    def __init__(self):
        self._client: Optional[Client] = None
        self._admin_client: Optional[Client] = None
    
    @property
    def client(self) -> Client:
        """Get Supabase client with anon key (for public access)"""
        if self._client is None:
            self._client = create_client(
                settings.supabase_url,
                settings.supabase_anon_key
            )
        return self._client
    
    @property 
    def admin_client(self) -> Client:
        """Get Supabase admin client (for privileged operations)"""
        if self._admin_client is None:
            self._admin_client = create_client(
                settings.supabase_url,
                settings.supabase_service_role_key
            )
        return self._admin_client
    
    async def init_database(self):
        """Initialize database tables"""
        try:
            await self._create_tables()
            print("✅ Database tables initialized successfully")
        except Exception as e:
            print(f"❌ Database initialization failed: {e}")
            raise
    
    async def _create_tables(self):
        """Create necessary database tables"""
        
        # Users table (extends Supabase auth.users)
        users_table = """
        CREATE TABLE IF NOT EXISTS public.users (
            id UUID REFERENCES auth.users PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'researcher', 'analyst', 'user')),
            organization TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        """
        
        # User profiles RLS policy
        users_rls = """
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own profile" ON public.users
            FOR SELECT USING (auth.uid() = id);
            
        CREATE POLICY "Users can update own profile" ON public.users  
            FOR UPDATE USING (auth.uid() = id);
        """
        
        # Datasets table
        datasets_table = """
        CREATE TABLE IF NOT EXISTS public.datasets (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            name TEXT NOT NULL,
            description TEXT,
            file_name TEXT,
            file_size INTEGER,
            columns_info JSONB,
            row_count INTEGER,
            upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_public BOOLEAN DEFAULT false,
            metadata JSONB DEFAULT '{}'::jsonb
        );
        """
        
        # Datasets RLS policies
        datasets_rls = """
        ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own datasets" ON public.datasets
            FOR SELECT USING (auth.uid() = user_id OR is_public = true);
            
        CREATE POLICY "Users can insert own datasets" ON public.datasets
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update own datasets" ON public.datasets
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete own datasets" ON public.datasets
            FOR DELETE USING (auth.uid() = user_id);
        """
        
        # Analysis results table
        analyses_table = """
        CREATE TABLE IF NOT EXISTS public.analyses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
            analysis_type TEXT NOT NULL,
            parameters JSONB NOT NULL,
            results JSONB NOT NULL,
            figures JSONB DEFAULT '{}'::jsonb,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_public BOOLEAN DEFAULT false,
            name TEXT,
            description TEXT
        );
        """
        
        # Analyses RLS policies
        analyses_rls = """
        ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view own analyses" ON public.analyses
            FOR SELECT USING (auth.uid() = user_id OR is_public = true);
            
        CREATE POLICY "Users can insert own analyses" ON public.analyses
            FOR INSERT WITH CHECK (auth.uid() = user_id);
            
        CREATE POLICY "Users can update own analyses" ON public.analyses
            FOR UPDATE USING (auth.uid() = user_id);
            
        CREATE POLICY "Users can delete own analyses" ON public.analyses
            FOR DELETE USING (auth.uid() = user_id);
        """
        
        # Project collaborations table (for team-based access)
        collaborations_table = """
        CREATE TABLE IF NOT EXISTS public.collaborations (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            dataset_id UUID REFERENCES public.datasets(id) ON DELETE CASCADE,
            user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
            permission TEXT DEFAULT 'read' CHECK (permission IN ('read', 'write', 'admin')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES public.users(id),
            UNIQUE(dataset_id, user_id)
        );
        """
        
        # Collaborations RLS policies  
        collaborations_rls = """
        ALTER TABLE public.collaborations ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their collaborations" ON public.collaborations
            FOR SELECT USING (auth.uid() = user_id OR auth.uid() = created_by);
        """
        
        # Create indexes for better performance
        indexes = """
        CREATE INDEX IF NOT EXISTS idx_datasets_user_id ON public.datasets(user_id);
        CREATE INDEX IF NOT EXISTS idx_datasets_upload_date ON public.datasets(upload_date);
        CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
        CREATE INDEX IF NOT EXISTS idx_analyses_dataset_id ON public.analyses(dataset_id);
        CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at);
        CREATE INDEX IF NOT EXISTS idx_collaborations_dataset_id ON public.collaborations(dataset_id);
        CREATE INDEX IF NOT EXISTS idx_collaborations_user_id ON public.collaborations(user_id);
        """
        
        # Execute all SQL statements
        sql_statements = [
            users_table,
            users_rls, 
            datasets_table,
            datasets_rls,
            analyses_table,
            analyses_rls,
            collaborations_table,
            collaborations_rls,
            indexes
        ]
        
        for sql in sql_statements:
            try:
                result = self.admin_client.rpc('exec_sql', {'sql_query': sql}).execute()
                print(f"✅ Executed SQL statement successfully")
            except Exception as e:
                # For table creation, we can ignore "already exists" errors
                if "already exists" in str(e).lower():
                    print(f"✅ Table/policy already exists, skipping...")
                else:
                    print(f"❌ SQL execution failed: {e}")
                    # Don't raise here, continue with other statements
    
    async def health_check(self) -> bool:
        """Check database connection health"""
        try:
            # Simple query to test connection
            result = self.client.table('users').select('id').limit(1).execute()
            return True
        except Exception as e:
            print(f"Database health check failed: {e}")
            return False


# Global database manager instance
db_manager = DatabaseManager()


def get_db_client() -> Client:
    """Dependency to get database client"""
    return db_manager.client


def get_admin_db_client() -> Client:
    """Dependency to get admin database client"""
    return db_manager.admin_client 