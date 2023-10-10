import os
from mapsindoors.auth_client import OAuthToken
from mapsindoors.geo_functions import GeoFunctions

# Function to initialize the MapsIndoors API
def init_mapsindoors_api():
    # Retrieve MapsIndoors username, password, and API key from environment variables
    username = os.environ.get('MI_USER_NAME')
    password = os.environ.get('MI_USER_PASS')
    api_key = os.environ.get('MI_API_KEY')

    geo = GeoFunctions(api_key)
    auth = OAuthToken(username, password, api_key)

    return geo, auth
