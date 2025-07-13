import subprocess
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/optimize', methods=['POST'])
def optimize_route():
    data = request.get_json()
    points = data.get("points", [])
    if not points or len(points) < 2:
        return jsonify({"error": "At least two points required."}), 400

    # Prepare input for C++ program: n, then each x y on newline
    input_lines = [str(len(points))]
    for pt in points:
        input_lines.append(f"{pt['x']} {pt['y']}")
    input_str = "\n".join(input_lines) + "\n"

    try:
        result = subprocess.run(
            ['files/mst.exe'],  # Make sure mst is compiled and in the same directory
            input=input_str.encode(),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            timeout=10
        )
        if result.returncode != 0:
            return jsonify({"error": result.stderr.decode()}), 500

        output = result.stdout.decode().strip().split('\n')
        if len(output) < 2:
            return jsonify({"error": "Invalid MST output."}), 500
        optimizedOrder = [int(idx) for idx in output[0].split()]
        totalLength = float(output[1])
        # Get points in optimized order
        orderedPoints = [points[i] for i in optimizedOrder]
        return jsonify({
            "optimizedOrder": optimizedOrder,
            "totalLength": totalLength,
            "orderedPoints": orderedPoints
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)