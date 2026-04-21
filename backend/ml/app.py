# pylint: disable=no-member, import-error
from flask import Flask, request, jsonify
from flask_cors import CORS
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import io
import base64
import os
import time

app = Flask(__name__)

CORS(app, resources={
    r"/*": {
        "origins": ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000"],
        "methods": ["POST", "OPTIONS", "GET"],
        "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"]
    }
})

# Load skin tone model 
try:
    skin_tone_model = tf.keras.models.load_model("skin_tone_model.h5")
    print(" Skin tone model loaded successfully")
except Exception as e:
    skin_tone_model = None
    print(f" Skin tone model not found: {e}")

try:
    viton_model = tf.keras.models.load_model("viton_cnn_model.h5")
    print(" Virtual Try-On model loaded successfully")
except Exception as e:
    viton_model = None
    print(f" Virtual Try-On model not found: {e}")

IMG_SIZE = 64
tone_map = {0: "Light", 1: "Medium", 2: "Dark"}
VITON_IMG_SIZE = 128


def preprocess_image(image_bytes):
    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    image = np.array(image)
    image = cv2.resize(image, (IMG_SIZE, IMG_SIZE))
    image = image / 255.0
    image = np.expand_dims(image, axis=0)
    return image


def remove_background(dress_img, threshold_override=None):
    """
    Remove background from dress image.
    Returns (RGB image, mask) where mask is True for dress pixels.
    """
    if dress_img.shape[2] == 4:
        alpha = dress_img[:, :, 3]
        mask = alpha > 10
        rgb = dress_img[:, :, :3]
        print("Using alpha channel for background removal")
        return rgb, mask

    h, w = dress_img.shape[:2]
    corners = [
        dress_img[0, 0],
        dress_img[0, w-1],
        dress_img[h-1, 0],
        dress_img[h-1, w-1]
    ]
    bg_color = np.mean(corners, axis=0).astype(np.uint8)
    diff = np.sqrt(np.sum((dress_img - bg_color) ** 2, axis=2))

    if threshold_override is not None:
        thresh = threshold_override
    else:
        thresh = 30

    mask = diff > thresh
    print(f"Background color: {bg_color}, threshold: {thresh}, mask pixels: {np.sum(mask)}")
    return dress_img, mask


def overlay_dress_with_mask(person_img, dress_img, offset_percent=30, threshold=None, scale=1.2, horizontal_offset=50):
    """
    Overlay dress on person, using mask to remove background.
    scale: width multiplier relative to person width (default 1.2 = 120% of person width)
    horizontal_offset: 0-100; 0=left edge, 50=centered, 100=right edge.
    """
    person_h, person_w = person_img.shape[:2]

    dress_rgb, mask = remove_background(dress_img, threshold)

    # Compute target width scaled by person width
    target_width = int(person_w * scale)
    dress_h, dress_w = dress_rgb.shape[:2]
    target_height = int(target_width * dress_h / dress_w)

    dress_resized = cv2.resize(dress_rgb, (target_width, target_height))
    mask_resized = cv2.resize(mask.astype(np.uint8), (target_width, target_height))

    # Horizontal position based on percentage
    h_pos = max(0, min(100, horizontal_offset))
    start_x = int((person_w - target_width) * h_pos / 100)

    # Vertical position
    start_y = int(person_h * offset_percent / 100)

    # Ensure within bounds
    if start_x < 0:
        start_x = 0
    if start_x + target_width > person_w:
        start_x = person_w - target_width
    if start_y + target_height > person_h:
        start_y = person_h - target_height
    if start_y < 0:
        start_y = 0

    result = person_img.copy()
    copied = 0

    for i in range(target_height):
        for j in range(target_width):
            if mask_resized[i, j] > 0:
                py = start_y + i
                px = start_x + j
                if py < person_h and px < person_w:
                    result[py, px] = dress_resized[i, j]
                    copied += 1

    print(f"Copied {copied} dress pixels, scale={scale}, horizontal offset={h_pos}%")
    return result, (start_x, start_y, target_width, target_height)


@app.route("/predict-skin-tone", methods=["POST", "OPTIONS", "GET"])
def predict_skin_tone():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"}), 200
    if request.method == "GET":
        return jsonify({
            "message": "Send a POST request with an image file",
            "usage": "POST with multipart/form-data containing 'image' field"
        }), 200
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    if skin_tone_model is None:
        return jsonify({"error": "Skin tone model not loaded"}), 503
        
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


@app.route("/detect-face-position", methods=["POST", "OPTIONS"])
def detect_face_position():
    """Detect face and return neck/shoulder position for dress placement"""
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"}), 200
    
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400
    
    image_file = request.files["image"]
    
    try:
        # Read image
        image_bytes = image_file.read()
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            return jsonify({"error": "Could not read image"}), 400
            
        height, width = img.shape[:2]
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Load face cascade
        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        )
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) == 0:
            return jsonify({
                "face_detected": False,
                "message": "No face detected in the image"
            }), 200
        
        # Get the largest face
        (x, y, w, h) = max(faces, key=lambda f: f[2] * f[3])
        
        # Calculate neck position (below face)
        neck_y = y + h + (h * 0.15)  # 15% below face
        neck_x = x + (w / 2)  # Center of face horizontally
        
        # Shoulder width approximation (1.5x face width)
        shoulder_width = w * 1.5
        
        # Convert to percentages (0-100)
        neck_y_percent = (neck_y / height) * 100
        neck_x_percent = (neck_x / width) * 100
        shoulder_width_percent = (shoulder_width / width) * 100
        
        # Clamp values to valid ranges
        neck_y_percent = max(10, min(60, neck_y_percent))
        neck_x_percent = max(20, min(80, neck_x_percent))
        shoulder_width_percent = max(60, min(150, shoulder_width_percent))
        
        print(f"Face detected at: x={x}, y={y}, w={w}, h={h}")
        print(f"Dress position: y={neck_y_percent}%, x={neck_x_percent}%, width={shoulder_width_percent}%")
        
        return jsonify({
            "face_detected": True,
            "face_rect": {"x": int(x), "y": int(y), "width": int(w), "height": int(h)},
            "neck_y_percent": round(neck_y_percent, 1),
            "neck_x_percent": round(neck_x_percent, 1),
            "shoulder_width_percent": round(shoulder_width_percent, 1),
            "image_width": width,
            "image_height": height
        })
        
    except Exception as e:
        print(f"Face detection error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Face detection failed: {str(e)}"}), 500


@app.route("/virtual-tryon", methods=["POST", "OPTIONS"])
def virtual_tryon():
    if request.method == "OPTIONS":
        return jsonify({"message": "OK"}), 200

    if "person_image" not in request.files:
        return jsonify({"error": "Person image required"}), 400
    if "dress_image" not in request.files:
        return jsonify({"error": "Dress image required"}), 400

    person_file = request.files["person_image"]
    dress_file = request.files["dress_image"]

    offset_percent = request.form.get("offset_y", 30)
    try:
        offset_percent = float(offset_percent)
    except:
        offset_percent = 30

    threshold = request.form.get("threshold")
    if threshold is not None:
        try:
            threshold = int(threshold)
        except:
            threshold = None

    scale = request.form.get("scale")
    if scale is not None:
        try:
            scale = float(scale)
        except:
            scale = 1.0
    else:
        scale = 1.0

    horizontal_offset = request.form.get("horizontal_offset")
    if horizontal_offset is not None:
        try:
            horizontal_offset = float(horizontal_offset)
        except:
            horizontal_offset = 50
    else:
        horizontal_offset = 50

    person_bytes = person_file.read()
    person_np = np.frombuffer(person_bytes, np.uint8)
    person_img = cv2.imdecode(person_np, cv2.IMREAD_COLOR)
    if person_img is None:
        return jsonify({"error": "Could not read person image"}), 400
    person_img = cv2.cvtColor(person_img, cv2.COLOR_BGR2RGB)

    dress_bytes = dress_file.read()
    dress_np = np.frombuffer(dress_bytes, np.uint8)
    dress_img = cv2.imdecode(dress_np, cv2.IMREAD_UNCHANGED)
    if dress_img is None:
        return jsonify({"error": "Could not read dress image"}), 400
        
    if dress_img.shape[2] == 4:
        dress_img = cv2.cvtColor(dress_img, cv2.COLOR_BGRA2RGBA)
    else:
        dress_img = cv2.cvtColor(dress_img, cv2.COLOR_BGR2RGB)

    print(f"Person shape: {person_img.shape}, Dress shape: {dress_img.shape}")
    print(f"Offset: {offset_percent}%, Threshold: {threshold}, Scale: {scale}, Horizontal offset: {horizontal_offset}%")

    try:
        result_img, rect = overlay_dress_with_mask(
            person_img, dress_img, offset_percent, threshold, scale, horizontal_offset
        )

        timestamp = int(time.time())
        debug_path = os.path.join(os.path.dirname(__file__), f"debug_{timestamp}.jpg")
        cv2.imwrite(debug_path, cv2.cvtColor(result_img, cv2.COLOR_RGB2BGR))
        print(f"Debug image saved to {debug_path}")

        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(result_img, cv2.COLOR_RGB2BGR))
        img_str = base64.b64encode(buffer).decode('utf-8')
        print("Virtual try-on successful")
        return jsonify({
            "message": "Virtual Try-On successful",
            "result_image": img_str,
            "dress_rect": {"x": rect[0], "y": rect[1], "width": rect[2], "height": rect[3]}
        })
    except Exception as e:
        print(f" Virtual Try-On error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": f"Virtual Try-On failed: {str(e)}"}), 500


@app.route("/health", methods=["GET"])
def health_check():
    status = {
        "status": "healthy",
        "message": "Flask server is running",
        "models": {
            "skin_tone": "loaded" if skin_tone_model is not None else "not loaded",
            "virtual_tryon": "active (smart background removal, scaling, horizontal shift)"
        },
        "endpoints": [
            "/predict-skin-tone (POST)",
            "/detect-face-position (POST)",
            "/virtual-tryon (POST)",
            "/health (GET)"
        ]
    }
    return jsonify(status), 200


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Flask ML Server is running",
        "endpoints": {
            "POST /predict-skin-tone": "Upload image to detect skin tone",
            "POST /detect-face-position": "Upload image to detect face and neck position",
            "POST /virtual-tryon": "Upload person and dress images for virtual try-on",
            "GET /health": "Check server health"
        }
    }), 200


@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        return response


if __name__ == "__main__":
    print("=" * 50)
    print("Flask server starting on port 5001...")
    print("Accepting requests from: http://localhost:5173, http://localhost:3000")
    print("Endpoints:")
    print("   - POST  /predict-skin-tone (upload image for skin tone)")
    print("   - GET   /predict-skin-tone (info)")
    print("   - POST  /detect-face-position (upload image for face detection)")
    print("   - POST  /virtual-tryon (upload person and dress images)")
    print("   - GET   /health (server status)")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5001, debug=True)