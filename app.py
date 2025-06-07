from flask import Flask, render_template, request, jsonify, send_file, redirect
from flask_socketio import SocketIO, emit
import pandas as pd
from io import BytesIO
import os, json

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

DATA_FILE = "saved_data.json"

def load_data():
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {"ambassadors": {}, "weeks": []}

def save_data(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f)

def get_color_class(value):
    if value == 1: return "green"
    if value == 2: return "yellow"
    if value == 3: return "orange"
    if value >= 4: return "red"
    return ""

store = load_data()

@app.route('/')
def index():
    return render_template("index.html", ambassadors=store['ambassadors'], weeks=store['weeks'], get_color_class=get_color_class)

@app.route('/save', methods=['POST'])
def manual_save():
    save_data(store)
    return jsonify({"status": "saved"})

@app.route('/download')
def download_excel():
    rows = []
    for name, weeks in store['ambassadors'].items():
        for week, options in weeks.items():
            row = {'Ambassador': name, 'Week': week}
            for i in range(1, 6):
                row[f'Opt{i}'] = options.get(str(i), 0)
            rows.append(row)
    df = pd.DataFrame(rows)
    output = BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)
    return send_file(output, as_attachment=True, download_name="ambassadors.xlsx")

@app.route('/upload', methods=['POST'])
def upload_excel():
    file = request.files['excel_file']
    if file:
        df = pd.read_excel(file)
        new_data = {}
        weeks_set = set()
        for _, row in df.iterrows():
            name = row['Ambassador']
            week = row['Week']
            options = {str(i): int(row.get(f'Opt{i}', 0)) for i in range(1, 6)}
            if name not in new_data:
                new_data[name] = {}
            new_data[name][week] = options
            weeks_set.add(week)
        store['ambassadors'] = new_data
        store['weeks'] = sorted(weeks_set)
        save_data(store)
    return redirect('/')

@app.route('/rename', methods=['POST'])
def rename_item():
    data = request.json
    item_type = data['type']
    old = data['old']
    new = data['new']

    if item_type == 'ambassador':
        if old in store['ambassadors']:
            store['ambassadors'][new] = store['ambassadors'].pop(old)
    elif item_type == 'week':
        if new not in store['weeks']:
            store['weeks'] = [new if w == old else w for w in store['weeks']]
            for amb in store['ambassadors']:
                if old in store['ambassadors'][amb]:
                    store['ambassadors'][amb][new] = store['ambassadors'][amb].pop(old)

    return jsonify({"status": "renamed"})

@app.route('/delete_ambassador', methods=['POST'])
def delete_ambassador():
    name = request.json['name']
    store['ambassadors'].pop(name, None)
    return jsonify({"status": "deleted"})

@app.route('/delete_week', methods=['POST'])
def delete_week():
    week = request.json['week']
    store['weeks'] = [w for w in store['weeks'] if w != week]
    for amb in store['ambassadors']:
        store['ambassadors'][amb].pop(week, None)
    return jsonify({"status": "deleted"})

@socketio.on('update_click')
def handle_update_click(data):
    name = data['ambassador']
    week = data['week']
    option = str(data['option'])
    count = data['count']

    if name not in store['ambassadors']:
        store['ambassadors'][name] = {}
    if week not in store['ambassadors'][name]:
        store['ambassadors'][name][week] = {str(i): 0 for i in range(1, 6)}
    store['ambassadors'][name][week][option] = count

    if week not in store['weeks']:
        store['weeks'].append(week)

    emit("broadcast_update", data, broadcast=True)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host='0.0.0.0', port=port)