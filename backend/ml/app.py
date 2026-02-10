# pylint: disable=no-member, import-error
from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
import cv2
from PIL import Image
import io

app = Flask(__name__)

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

@app.route("/predict-skin-tone", methods=["POST"])
def predict_skin_tone():
    if "image" not in request.files:
        return jsonify({"error": "No image provided"}), 400

    image_file = request.files["image"]
    image = preprocess_image(image_file.read())

    prediction = model.predict(image)
    tone_index = int(np.argmax(prediction))

    return jsonify({
        "skin_tone": tone_map[tone_index],
        "confidence": float(np.max(prediction))
    })

if __name__ == "__main__":
    app.run(port=5001, debug=True)
