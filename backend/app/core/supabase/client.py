from supabase import create_client, Client
import os
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables right here, before we try to use them
# Get the backend directory (where your .env file is)
backend_dir = Path(__file__).parent.parent.parent.parent  # Go up from core/supabase/client.py to backend/
env_path = backend_dir / '.env'
load_dotenv(dotenv_path=env_path)

class SupabaseClient:
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL")
        self.key = os.environ.get("SUPABASE_KEY")
        
        if not self.url or not self.key:
            print(f"🔍 Looking for .env at: {env_path}")
            print(f"🔍 .env exists: {env_path.exists()}")
            print(f"🔍 SUPABASE_URL: {self.url}")
            print(f"🔍 SUPABASE_KEY: {'***' if self.key else None}")
            raise ValueError(
                f"Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_KEY in {env_path}"
            )
        
        self.client = create_client(self.url, self.key)
        print(f"✅ Supabase client initialized with URL: {self.url[:20]}...")
    
    def get_client(self) -> Client:
        return self.client

supabase_client = SupabaseClient()