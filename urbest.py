import requests
from flask import current_app

# Define the URBEST API URL
api_url = 'https://urbest.io/graphql'

def generate_urbest_bearer_token():
    # Retrieve URBEST email, password, and API URL from Flask app config
    email = current_app.config['URBEST_EMAIL']
    password = current_app.config['URBEST_PASSWORD']
    
    generate_token_mutation = f'''
    mutation {{
      user {{
        generate_token(credentials: {{
          email: "{email}"
          password: "{password}"
        }}) {{
          token
        }}
      }}
    }}
    '''

    # Make the GraphQL request to generate the URBEST token
    response = requests.post(api_url, json={'query': generate_token_mutation})

    # Parse the response to retrieve the URBEST token
    token_data = response.json()
    urbest_bearer_token = token_data['data']['user']['generate_token']['token']

    return urbest_bearer_token

def fetch_previous_issues(bearer_token, organization_id):
    # Define your GraphQL query to fetch previous issues
    graphql_query = f'''
    {{
      an_organization(input: {{ id: "{organization_id}" }}) {{
        all_issues(input: {{ filters: {{ archived: both }}, ordering: {{}}, pagination: {{}} }}) {{
          total
          issues {{
            address
            archived
            author_id
            category_id
            created_at
            description
            image_id
            issue_id
            lat
            lng
            organization_id
            policy
            responsible_id
            status
            subcategory_id
            title
            updated_at
            urgent
          }}
        }}
      }}
    }}
    '''

    # Define the headers with the bearer token
    headers = {
        'Authorization': bearer_token,
        'Content-Type': 'application/json',
    }

    # Make the GraphQL request to fetch previous issues with the token
    response = requests.post(api_url, json={'query': graphql_query}, headers=headers)

    # Return the response data
    return response.json()

def fetch_building_categories(bearer_token, organization_id):
    # Define the GraphQL query to fetch building categories
    categories_query = f'''
    {{
      an_organization(input: {{ id: "{organization_id}" }}) {{
        buildings(input: {{}}) {{
          buildings(input: {{ ordering: {{ order_by: "building-name" }}, pagination: {{}} }}) {{
            building_id
            categories(input: {{}}) {{
              categories {{
                category_id
                enabled
                image
                title
              }}
            }}
          }}
        }}
      }}
    }}
    '''

    # Define the headers with the bearer token for the subsequent request
    headers_for_subsequent_request = {
        'Authorization': bearer_token,
        'Content-Type': 'application/json',
    }

    # Make the GraphQL request to retrieve building categories with the token
    response_for_categories_request = requests.post(api_url, json={'query': categories_query}, headers=headers_for_subsequent_request)

    # Return the response data
    return response_for_categories_request.json()

