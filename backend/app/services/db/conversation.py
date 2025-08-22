# /services/conversationService.py
from supabase import Client
from typing import List, Optional, Dict, Any

class ConversationService:
    def __init__(self, supabase_client: Client):
        # Arrr, ready to sail the conversation seas!
        self.client = supabase_client
    
    def create_conversation(self, name: str) -> Dict[str, Any]:
        """
        Create a new conversation - perfect for starting fresh analysis adventures!
        """
        try:
            result = self.client.table('conversations').insert({
                'name': name
            }).execute()
            
            if result.data:
                print(f"🏴‍☠️ New conversation created: {name}")
                return result.data[0]
            else:
                raise Exception("No data returned from insert")
                
        except Exception as e:
            print(f"⚠️ Failed to create conversation: {e}")
            raise
    
    def get_conversation(self, conversation_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a conversation by its ID - for when ye need to revisit old treasures
        """
        try:
            result = self.client.table('conversations').select('*').eq('id', conversation_id).execute()
            return result.data[0] if result.data else None
        except Exception as e:
            print(f"⚠️ Failed to fetch conversation: {e}")
            return None
        
    def get_all_conversations(self) -> List[Dict[str, Any]]:
        """
        Fetch all conversations - perfect for listing the treasure ye've collected!
        """
        try:
            result = self.client.table('conversations').select('*').order('created_at', desc=True).execute()
            
            if result.data:
                print(f"🏴‍☠️ Found {len(result.data)} conversations")
                return result.data
            else:
                print("🏴‍☠️ No conversations found in the treasure chest")
                return []
                
        except Exception as e:
            print(f"⚠️ Failed to fetch conversations: {e}")
            raise