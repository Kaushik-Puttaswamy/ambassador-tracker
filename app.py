# app.py

from flask import Flask, render_template, request, send_file, redirect, jsonify
from flask_socketio import SocketIO, emit
import os
import json
import pandas as pd
from io import BytesIO

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

DATA_FILE = 'saved_data.json'


def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {"data": {}, "weeks": []}


def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)


store = load_data()


@app.route('/')
def index():
    return render_template('index.html', data=store['data'], weeks=store['weeks'])


@app.route('/download')
def download():
    rows = []
    for name, weeks in store['data'].items():
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
        weeks_set = set()
        for _, row in df.iterrows():
            name = row['Ambassador']
            week = row['Week']
            opts = [int(row.get(f'Opt{i+1}', 0)) for i in range(5)]
            if name not in new_data:
                new_data[name] = {}
            new_data[name][week] = opts
            weeks_set.add(week)
        store['data'] = new_data
        store['weeks'] = list(weeks_set)
        save_data(store)
    return redirect('/')


@app.route('/save', methods=['POST'])
def manual_save():
    save_data(store)
    return jsonify({'status': 'saved'})


@socketio.on('update_click')
def update_click(payload):
    name = payload['ambassador']
    week = payload['week']
    option = payload['option'] - 1
    count = payload['count']

    if name not in store['data']:
        store['data'][name] = {}
    if week not in store['data'][name]:
        store['data'][name][week] = [0] * 5

    store['data'][name][week][option] = count
    if week not in store['weeks']:
        store['weeks'].append(week)
    emit('broadcast_update', payload, broadcast=True)


if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port)