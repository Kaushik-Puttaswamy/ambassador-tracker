from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import sqlite3

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app)

# Initialize database
def init_db():
    with sqlite3.connect('tracker.db') as conn:
        cur = conn.cursor()
        cur.execute('''CREATE TABLE IF NOT EXISTS clicks (
            ambassador TEXT,
            week INTEGER,
            option INTEGER,
            count INTEGER
        )''')
        conn.commit()

@app.route('/')
def index():
    init_db()
    return render_template('index.html')

@socketio.on('update_click')
def handle_update(data):
    amb = data['ambassador']
    week = data['week']
    opt = data['option']
    count = data['count']

    with sqlite3.connect('tracker.db') as conn:
        cur = conn.cursor()
        cur.execute('''INSERT OR REPLACE INTO clicks (ambassador, week, option, count)
                       VALUES (?, ?, ?, ?)''', (amb, week, opt, count))
        conn.commit()
    
    emit('broadcast_update', data, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, debug=True)