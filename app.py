# app.py
from flask import Flask, render_template, request, send_file, redirect
from flask_socketio import SocketIO, emit
import os
import json
import pandas as pd
from io import BytesIO

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

@app.route('/download')
def download():
    rows = []
    for name, weeks in data.items():
        for week, options in weeks.items():
            row = {'Ambassador': name, 'Week': week}
            for i, val in enumerate(options):
                row[f'Opt{i+1}'] = val
            rows.append(row)

    df = pd.DataFrame(rows)
    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)
    return send_file(output, as_attachment=True, download_name='ambassador_data.xlsx', mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

@app.route('/upload', methods=['POST'])
def upload():
    file = request.files['excel_file']
    if file:
        df = pd.read_excel(file)
        new_data = {}
        for _, row in df.iterrows():
            name = row['Ambassador']
            week = row['Week']
            opts = [int(row[f'Opt{i+1}']) for i in range(5)]
            if name not in new_data:
                new_data[name] = {}
            new_data[name][week] = opts
        global data
        data = new_data
        save_data(data)
    return redirect('/')

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