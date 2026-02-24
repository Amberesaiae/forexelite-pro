"""
Logging Configuration
Structured JSON logging for production, pretty logging for development
"""
import logging
import sys
from app.core.config import get_settings


def setup_logging():
    """Configure application logging."""
    settings = get_settings()
    
    # Get root logger
    logger = logging.getLogger()
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    
    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)
    
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    
    # Format based on environment
    if settings.DEBUG:
        # Pretty format for development
        formatter = logging.Formatter(
            "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
    else:
        # JSON format for production
        class JSONFormatter(logging.Formatter):
            def format(self, record):
                import json
                return json.dumps({
                    "timestamp": self.formatTime(record),
                    "level": record.levelname,
                    "logger": record.name,
                    "message": record.getMessage(),
                    "exception": record.exc_info and self.formatException(record.exc_info),
                })
        
        formatter = JSONFormatter()
    
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    
    return logger
