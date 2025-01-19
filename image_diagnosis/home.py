from flask import Flask, request
import lung.classify as lung_predictor
import breast.segment as breast_predictor
import numpy as np
import json
import os

app = Flask(__name__)

@app.route('/query-example')
def query_example():
    language = request.args.get('language')
    return f'Query String Example for {language}'

@app.route('/predict', methods=['POST'])
def json_example():

    statusCode = 200
    message = ''

    # get the request json object
    request_data = request.get_json()

    # get the image name from the request
    image_name = request_data.get('image_name')
    
    # get the modality name for the request
    image_modality = request_data.get('image_modality')
    
    try :
        # Construct full path to image
        input_path = os.getenv('INPUT_FILE_PATH', '/files')
        full_image_path = os.path.join(input_path, image_name)
        
        # Verify file exists
        if not os.path.exists(full_image_path):
            raise FileNotFoundError(f"Image {image_name} not found in shared volume")
        
        # check if the modality is lung
        if image_modality == 'lung':
            results = lung_predictor.predict(image_name)
            if results:
                message = results.names 
                probs = results.probs.data.tolist()
                class_name = results.names[np.argmax(probs)].upper()
                metric = results.speed
        elif image_modality == 'breast':
            results = breast_predictor.predict(image_name)
            if results is not None:
                metric = results.speed
                message = results.names
                classify_output = []
                if len(results.boxes.cls) > 0:
                    # iterate each tensor and process the results
                    for index in range(len(results.boxes.cls)):
                        class_name = message[results.boxes.cls.data[index].int().item()].upper()
                        probs =  format(results.boxes.conf.data[index].float().item(), ".0%")
                        classify_output.append({"class": class_name, "prob": probs})
                else:
                    class_name = "normal"
                    probs = ""
                    classify_output.append({"class": class_name, "prob": ''})
    except Exception as error:
        statusCode = 500
        message = error.response['Error']['Message']
    
    return {
        'statusCode': statusCode,
        'body': json.dumps({"message": message, "probs": probs, "class": class_name, "metric": metric})
    }

if __name__ == '__main__':
    app.run(debug=True, port=5000)