import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your_secret_key')
    URBEST_EMAIL = os.getenv('URBEST_EMAIL')
    URBEST_PASSWORD = os.getenv('URBEST_PASSWORD')
    MI_USER_NAME = os.getenv('MI_USER_NAME')
    MI_USER_PASS = os.getenv('MI_USER_PASS')
    MI_API_KEY = os.getenv('MI_API_KEY')
    MAPBOX_TOKEN = os.getenv('MAPBOX_TOKEN')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False
