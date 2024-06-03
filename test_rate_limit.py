import requests
import time

# Define the URL of the API endpoint
url = "http://localhost:3000/items"

# Function to perform a GET request
def make_request():
    try:
        response = requests.get(url)
        print(f"Status Code: {response.status_code}, Response: {response.text}")
    except requests.exceptions.RequestException as e:
        print(f"Request failed: {e}")

# Make 105 requests to test the rate limit (assuming the limit is 100 requests per 15 minutes)
for i in range(105):
    make_request()
    # Sleep for a short period to avoid sending all requests instantly
    time.sleep(0.1)
