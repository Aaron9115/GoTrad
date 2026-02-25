# pylint: disable=no-member, import-error
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import io
import base64

app = Flask(__name__)

# CORS for all routes with proper configuration
CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173"],
        "methods": ["POST", "OPTIONS", "GET"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }
})

# Load skin tone model
skin_tone_model = tf.keras.models.load_model("skin_tone_model.h5")

# Load virtual try-on model (if exists)
try:
    viton_model = tf.keras.models.load_model("viton_cnn_model.h5")
    print("✅ Virtual Try-On model loaded successfully")
except Exception as e:
    viton_model = None
    print(f"⚠️ Virtual Try-On model not found: {e}")

# Skin tone settings
IMG_SIZE = 64
tone_map = {0: "Light", 1: "Medium", 2: "Dark"}

# Virtual try-on settings
VITON_IMG_SIZE = 128  # Matches your training size

def preprocess_image(image_bytes):
    """Preprocess image for skin tone model"""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = np.array(image)
    image = cv2.resize(image, (IMG_SIZE, IMG_SIZE))
    image = image / 255.0
    image = np.expand_dims(image, axis=0)
    return image

def preprocess_viton_image(image_bytes):
    """Preprocess image for virtual try-on model"""
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = np.array(image)
    image = cv2.resize(image, (VITON_IMG_SIZE, VITON_IMG_SIZE))
    image = image / 255.0
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

        prediction = skin_tone_model.predict(image)
        tone_index = int(np.argmax(prediction))
        confidence = float(np.max(prediction))

        return jsonify({
            "skin_tone": tone_map[tone_index],
            "confidence": confidence
        })
    except Exception as e:
        return jsonify({"error": f"Image processing failed: {str(e)}"}), 500

@app.route("/virtual-tryon", methods=["POST", "OPTIONS"])
def virtual_tryon():
    # Handle preflight OPTIONS request
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        return response

    # Check if virtual try-on model is loaded
    if viton_model is None:
        return jsonify({"error": "Virtual Try-On model not available"}), 503

    # Check if both images are provided
    if "person_image" not in request.files:
        return jsonify({"error": "Person image is required"}), 400
    
    if "dress_image" not in request.files:
        return jsonify({"error": "Dress image is required"}), 400

    person_file = request.files["person_image"]
    dress_file = request.files["dress_image"]

    try:
        # Preprocess images
        person_img = preprocess_viton_image(person_file.read())
        dress_img = preprocess_viton_image(dress_file.read())

        # Add batch dimension
        dress_img = np.expand_dims(dress_img, axis=0)

        # ✅ FIX: Use only dress image (3 channels) not concatenated (6 channels)
        # Your model was trained on 3-channel images
        result = viton_model.predict(dress_img)

        # Convert result back to image format
        result_img = (result[0] * 255).astype(np.uint8)

        # Encode result image to send back
        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(result_img, cv2.COLOR_RGB2BGR))
        img_str = base64.b64encode(buffer).decode('utf-8')

        return jsonify({
            "message": "Virtual Try-On successful",
            "result_image": img_str
        }), 200

    except Exception as e:
        print(f"❌ Virtual Try-On error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Virtual Try-On failed: {str(e)}"}), 500

@app.route("/health", methods=["GET"])
def health_check():
    status = {
        "status": "healthy",
        "message": "Flask server is running",
        "models": {
            "skin_tone": "loaded",
            "virtual_tryon": "loaded" if viton_model else "not loaded"
        }
    }
    return jsonify(status), 200

@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        return response

if __name__ == "__main__":
    print("=" * 50)
    print("Flask server starting on port 5001...")
    print("Accepting requests from: http://localhost:5173")
    print("Endpoints:")
    print("   - POST  /predict-skin-tone (upload image for skin tone)")
    print("   - GET   /predict-skin-tone (info)")
    print("   - POST  /virtual-tryon (upload person and dress images)")
    print("   - GET   /health (server status)")
    print("=" * 50)
    app.run(port=5001, debug=True)