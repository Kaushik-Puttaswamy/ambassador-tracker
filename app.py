from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import os
import json

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

DATA_FILE = 'saved_data.json'

# Load saved data or initialize new structure
def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

data = load_data()

@app.route('/')
def index():
    return render_template('index.html', data=data)

@socketio.on('update_click')
def update_click(payload):
    name = payload['ambassador']
    week = f"Week {payload['week']}"
    option = payload['option'] - 1
    count = payload['count']

    if name not in data:
        data[name] = {}
    if week not in data[name]:
        data[name][week] = [0] * 5

    data[name][week][option] = count
    save_data(data)

    emit('broadcast_update', payload, broadcast=True)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port)