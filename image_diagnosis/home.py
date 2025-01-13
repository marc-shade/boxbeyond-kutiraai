from flask import Flask, request
import classification.classify as classify
import numpy as np
import json
from PIL import Image
import os

app = Flask(__name__)

@app.route('/query-example')
def query_example():
    language = request.args.get('language')
    return f'Query String Example for {language}'

@app.route('/evaluate', methods=['POST'])
def json_example():

    statusCode = 200
    message = ''

    # get the request json object
    request_data = request.get_json()

    # get the image name from the request
    image_name = request_data.get('image_name')
    

    try :
        # Construct full path to image
        input_path = os.getenv('INPUT_FILE_PATH', '/files')
        full_image_path = os.path.join(input_path, image_name)
        
        # Verify file exists
        if not os.path.exists(full_image_path):
            raise FileNotFoundError(f"Image {image_name} not found in shared volume")
        
        results = classify.predict(image_name)
        if results:
            message = results.names 
            probs = results.probs.data.tolist()
            class_name = results.names[np.argmax(probs)].upper()
            metric = results.speed
    except Exception as error:
        statusCode = 500
        message = error.response['Error']['Message']
    
    return {
        'statusCode': statusCode,
        'body': json.dumps({"message": message, "probs": probs, "class": class_name, "metric": metric})
    }

if __name__ == '__main__':
    app.run(debug=True, port=5000)