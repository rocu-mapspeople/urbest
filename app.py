from flask import Flask, render_template, request, redirect, url_for, current_app, jsonify
from config import DevelopmentConfig, ProductionConfig
from mapsindoors_auth import init_mapsindoors_api
from urbest import generate_urbest_bearer_token, fetch_building_categories
import requests
import random
import string
import os
import json

app = Flask(__name__)

# Load configuration based on environment (Development or Production)
app.config.from_object(DevelopmentConfig if app.debug else ProductionConfig)

# logging.basicConfig(level=logging.DEBUG)


# Initialize MapsIndoors API using the function from mapsindoors_auth
app.geo, app.auth = init_mapsindoors_api()
ORGANIZATION_ID = 1842

def reinitialize_mapsindoors():
    app.geo, app.auth = init_mapsindoors_api()


@app.route("/")
def index():
    try:
        # Generate the URBEST bearer token
        bearer_token = generate_urbest_bearer_token()
        mapsindoors_api_key = os.environ.get('MI_API_KEY')
        
        # Fetch building categories using the bearer token and organization id from the app config
        categories_data = fetch_building_categories(bearer_token, ORGANIZATION_ID)

        
        # Extract and structure the categories from the API response data
        buildings = categories_data['data']['an_organization']['buildings']['buildings']
        categories = []
        for building in buildings:
            building_id = building['building_id']
            building_categories = building['categories']['categories']
            for category in building_categories:
                categories.append({
                    'building_id': building_id,
                    'category_id': category['category_id'],
                    'category_title': category['title']
                })

        # Pass the extracted categories to the template for rendering
        return render_template("index2.html", categories=categories, mapsindoors_api_key=mapsindoors_api_key, MI_API_KEY=app.config["MI_API_KEY"], MAPBOX_TOKEN=app.config["MAPBOX_TOKEN"])
    
    except Exception as e:
        # Log the error for debugging
        print(f"An error occurred: {str(e)}")
        
        # Display error to user in a user-friendly manner
        return render_template("error.html", error_message=str(e))


@app.route('/createGeoData', methods=['POST'])
def create_geo_data():
    try:
        data = request.json

        # Log received data
        app.logger.debug(f"Received data: {data}")
        
        # Utilize the already available access_token and api_key
        bearer_token = app.auth.access_token
    
        # Validate and extract data from frontend
        parentId = data.get('parentId')
        name = data.get('name')
        description = data.get('description')
        coordinates = data.get('coordinates')
        externalId = data.get('externalId')

        print(coordinates)

        service_order_location_type_id = app.geo.get_location_type_id('Work Order')
        dataset_id = app.geo.geodata_response[0]['datasetId']


        
        # Construct payload
        payload = [{
            "parentId": parentId,
            "datasetId": dataset_id, 
            "externalId": externalId,
            "baseType": "poi",
            "displayTypeId": service_order_location_type_id,
            "geometry": {
                "coordinates": coordinates,
                "type": "Point"
            },
            "anchor": {
                "coordinates": coordinates,
                "type": "Point"
            },
            "aliases": [],
            "categories": [],
            "status": 3,
            "baseTypeProperties": {
                "capacity": '0',
                "obstacle": 'false'
            },
            "properties": {
                "name@en": name,
                "description@en": description,
                "urbest_link@generic": f"https://urbest.io/dashboard?issue-id={externalId}"
            }
        }]

        # Log the constructed payload
        app.logger.debug(f"Payload: {payload}")

        # Make API call
        response = requests.post(
            f'https://integration.mapsindoors.com/{app.auth.api_key}/api/geodata',
            headers={
                'Authorization': bearer_token,
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            json=payload
        )

        # Log the API response
        app.logger.debug(f"API Response: {response.status_code}, {response.text}")

        # Reinitialize MapsIndoors if POST is successful

        if 200 <= response.status_code <= 299:
            reinitialize_mapsindoors()


        # Respond back to frontend
        return jsonify({
            "status": response.status_code,
            "data": response.json()
        })

 

    except ValueError as ve:
        # Handle validation error
        app.logger.error(f"Validation Error: {ve}")
        return jsonify({"status": 400, "error": str(ve)}), 400
    except Exception as e:
        # Handle generic exceptions
        app.logger.error(f"An error occurred: {e}")
        return jsonify({"status": 500, "error": "Internal Server Error"}), 500



@app.route('/create_issue', methods=['POST'])
def create_issue():
    if request.method == 'POST':
        try:
            building_id = request.form.get('building_id')
            category_id = request.form.get('category_id')
            description = request.form.get('description')
            floor_name = request.form.get('floor_name')
            app.logger.debug(f"Building ID: {building_id}, Category ID: {category_id}, Title: Ticket from map form")

            urbest_bearer_token = generate_urbest_bearer_token()

            create_issue_draft_mutation = f'''
            mutation {{
              draft_issue(input: {{}}) {{
                sync(input: {{
                  category_id: "{category_id}",
                  title: "generated from map form",
                  floor: "{floor_name}",
                  description: "{description}",
                  issue_type: building,
                  building_id: "{building_id}"
                }}) {{
                  issue {{
                    id
                  }}
                }}
              }}
            }}
            '''

            urbest_graphql_url = 'https://urbest.io/graphql'

            headers = {
                'Authorization': urbest_bearer_token,
                'Content-Type': 'application/json',
            }

            response_create_issue_draft = requests.post(urbest_graphql_url, json={'query': create_issue_draft_mutation}, headers=headers)
            response_data = response_create_issue_draft.json()

            if 'errors' in response_data:
                for error in response_data['errors']:
                    app.logger.error(f"GraphQL Error: {error['message']}")
            
            if 200 <= response_create_issue_draft.status_code <= 299 and 'data' in response_data:
                sync_data = response_data.get('data', {}).get('draft_issue', {}).get('sync')
                
                if sync_data is not None:
                    draft_issue_id = sync_data.get('issue', {}).get('id')

                    if draft_issue_id:
                        app.logger.debug(f"Issue draft created successfully with ID: {draft_issue_id}")
                        
                        publish_issue_mutation = f'''
                        mutation {{
                          draft_issue(input: {{}})
                          {{publish(input: {{
                            id: "{draft_issue_id}"
                          }})
                          {{issue {{
                            archived
                            author_id
                            category_id
                            created_at
                            description
                            image_id
                            issue_id
                            lat
                            lng
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

                        app.logger.debug(f"Publish Issue Mutation: {publish_issue_mutation}")



                        response_publish_issue = requests.post(urbest_graphql_url, json={'query': publish_issue_mutation}, headers=headers)
                        app.logger.debug(f"Publish Issue Response: {response_publish_issue.text}")

                        response_publish_data = response_publish_issue.json()

                        published_issue_id = response_publish_data['data']['draft_issue']['publish']['issue']['issue_id']


                        
                        if 200 <= response_publish_issue.status_code <= 299:
                            if 'errors' in response_publish_data:
                                for error in response_publish_data['errors']:
                                    app.logger.error(f"GraphQL Error while publishing: {error['message']}")
                                return jsonify({'error': 'Failed to publish issue due to GraphQL errors'}), 500
                            else:
                                published_issue_info = response_publish_data.get('data', {}).get('draft_issue', {}).get('publish', {}).get('issue', {})
                                published_issue_id = published_issue_info.get('issue_id')
                                app.logger.info(f"Issue published successfully. ID: {published_issue_id}, Title: {published_issue_info.get('title')}")
                                return jsonify({'issue_id': published_issue_id}), 200
                        else:
                            app.logger.error(f"Failed to publish issue draft, Response: {response_publish_issue.text}")
                            return jsonify({'error': 'Failed to publish issue draft'}), 500

                    else:
                        app.logger.error("Failed to retrieve issue ID")
                        return jsonify({'error': 'Failed to retrieve issue ID'}), 500
                else:
                    app.logger.error("Sync data is None, possibly due to a disabled category or other issue.")
                    return jsonify({'error': 'Failed to create issue draft due to server-side error'}), 500
            else:
                app.logger.error(f"Failed to create issue draft, Response: {response_create_issue_draft.text}")
                return jsonify({'error': 'Failed to create issue draft'}), 500
        except Exception as e:
            app.logger.error(f"An error occurred: {e}")
            return jsonify({"status": 500, "error": "Internal Server Error"}), 500

    return redirect(url_for('index'))


@app.route('/get_parent_id', methods=['GET'])
def get_parent_id():
    try:
        location_id = request.args.get('location_id')  # or fetch from request in another way, if needed
        
        if not location_id:
            raise ValueError("The 'location_id' parameter is required.")
        
        # Use your existing method to get the location
        location = app.geo.get_location(location_id, json=True)
        print(location_id)
        print("Location:", json.dumps(location, indent=4))

        floor_object = app.geo.get_location(location['parentId'], json=True)
        print("Floor:", json.dumps(floor_object, indent=4))
        
        return jsonify({'parentId': location['parentId']})

    except ValueError as ve:
        # Handle validation error
        app.logger.error(f"Validation Error: {ve}")
        return jsonify({"status": 400, "error": str(ve)}), 400
    except Exception as e:
        # Handle generic exceptions
        app.logger.error(f"An error occurred: {e}")
        return jsonify({"status": 500, "error": "Internal Server Error"}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))