
from flask import Flask, request, jsonify
import pandas as pd
from optimize_route import optimize_route

app = Flask(__name__)

@app.route('/')
def root():
    print("DEBUG: Root endpoint was called")
    return "Root OK"

@app.route('/api/driver/route/today')
def get_driver_route():
    print("DEBUG: Endpoint /api/driver/route/today was called")
    driver_id = request.args.get('driver_id')
    try:
        result = optimize_route('dummy_orders.xlsx')
        return jsonify(result)
    except Exception as e:
        print("DEBUG: Exception occurred:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    print("DEBUG: Flask server is starting")
    app.run(debug=True, host='localhost', port=8000)
