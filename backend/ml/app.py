# pylint: disable=no-member, import-error
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import io

app = Flask(__name__)

# Enable CORS for all routes with proper configuration
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["POST", "OPTIONS", "GET"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }
})

# Load trained model
model = tf.keras.models.load_model("skin_tone_model.h5")

IMG_SIZE = 64
tone_map = {0: "Light", 1: "Medium", 2: "Dark"}

def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = np.array(image)
    image = cv2.resize(image, (IMG_SIZE, IMG_SIZE))
    image = image / 255.0
    image = np.expand_dims(image, axis=0)
    return image

@app.route("/predict-skin-tone", methods=["POST", "OPTIONS", "GET"])
def predict_skin_tone():
    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        return response

    # Handle GET request (for testing)
    if request.method == "GET":
        return jsonify({
            "message": "Send a POST request with an image file",
            "usage": "POST with multipart/form-data containing 'image' field"
        }), 200

    # Handle POST request
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image_file = request.files["image"]
    
    try:
        image = preprocess_image(image_file.read())

        prediction = model.predict(image)
        tone_index = int(np.argmax(prediction))
        confidence = float(np.max(prediction))

        return jsonify({
            "skin_tone": tone_map[tone_index],
            "confidence": confidence
        })
    except Exception as e:
        return jsonify({"error": f"Image processing failed: {str(e)}"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    return jsonify({"status": "healthy", "message": "Flask server is running"}), 200


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        return response

if __name__ == "__main__":
    print(" Flask server starting on port 5001...")
    print(" Accepting requests from: http://localhost:5173")
    print(" Endpoints:")
    print("   - POST  /predict-skin-tone (upload image)")
    print("   - GET   /predict-skin-tone (info)")
    print("   - GET   /health (server status)")
    app.run(port=5001, debug=True)