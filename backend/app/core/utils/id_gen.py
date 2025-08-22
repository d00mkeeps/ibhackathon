from uuid import UUID, uuid4

async def new_uuid() -> UUID:
    """
    Generate a new UUID asynchronously.
    
    Returns:
        UUID: A new random UUID (version 4)
    """
    return uuid4()