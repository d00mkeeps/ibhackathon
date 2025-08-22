import logging
from logging.handlers import RotatingFileHandler

def setup_logging():
    # Configure root logger at INFO level instead of DEBUG
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Clear existing handlers (prevents duplicate logs)
    if root_logger.handlers:
        root_logger.handlers.clear()
    
    # Create handlers
    c_handler = logging.StreamHandler()
    f_handler = RotatingFileHandler('app.log', maxBytes=10000, backupCount=3)
    
    # Set console to INFO and file to DEBUG (for troubleshooting)
    c_handler.setLevel(logging.INFO)
    f_handler.setLevel(logging.DEBUG)
    
    # Create formatters and add to handlers
    format = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
    c_handler.setFormatter(format)
    f_handler.setFormatter(format)
    
    # Add handlers to the root logger
    root_logger.addHandler(c_handler)
    root_logger.addHandler(f_handler)
    
    # Reduce verbosity for noisy third-party libraries
    logging.getLogger('httpx').setLevel(logging.WARNING)
    logging.getLogger('httpcore').setLevel(logging.WARNING)
    logging.getLogger('hpack').setLevel(logging.ERROR)  # Very noisy
    logging.getLogger('anthropic').setLevel(logging.INFO)
    logging.getLogger('urllib3').setLevel(logging.WARNING)
    
    # Ensure your app's logs are still informative
    app_logger = logging.getLogger('app')
    app_logger.setLevel(logging.INFO)
    
    # Test log message
    app_logger.info("Logging has been set up")