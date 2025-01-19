from ultralytics import YOLO
import os
import cv2 as cv
import io
# build the path
SEG_MODEL_PATH = os.path.join('.', 'runs', 'breast', 'weights', 'best.pt')

# YOLO model
YOLO_MODEL = YOLO(SEG_MODEL_PATH)

def predict(image_name):
    """
    Predict using YOLO model from an image in the mounted volume
    
    Args:
        image_name (str): Path to the image file in the mounted volume
        
    Returns:
        The prediction result from YOLO model
    """
    try:
        # Read image from mounted volume using OpenCV
        img = cv.imread(image_name)
        
        if img is None:
            raise ValueError(f"Failed to load image from path: {image_name}")

        # Predict using YOLO model
        results = YOLO_MODEL.predict(img)
        result = results[0]

        return result

    except Exception as e:
        print(f"Error predicting image {image_name}: {str(e)}")
        raise