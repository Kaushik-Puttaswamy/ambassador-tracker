from flask import Flask, render_template, request, jsonify
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

# In-memory database substitute (you can replace with real DB)
data = {
    'John': {f'Week {i+1}': [0, 0, 0, 0, 0] for i in range(52)},
    'Alice': {f'Week {i+1}': [0, 0, 0, 0, 0] for i in range(52)}
}

@app.route('/')
def index():
    return render_template('index.html', data=data)

@socketio.on('update_cell')
def handle_update(data_packet):
    name = data_packet['name']
    week = data_packet['week']
    option_index = data_packet['option']
    
    if name in data and week in data[name]:
        if data[name][week][option_index] < 4:
            data[name][week][option_index] += 1
            new_value = data[name][week][option_index]
            emit('cell_updated', {
                'name': name,
                'week': week,
                'option': option_index,
                'value': new_value
            }, broadcast=True)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 10000))
    socketio.run(app, host='0.0.0.0', port=port)