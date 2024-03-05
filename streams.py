from flask import Flask, render_template, Response
from jinja2 import Environment, FileSystemLoader
import requests
import json
from waitress import serve
from config import TAUTULLI_SERVERS

app = Flask(__name__)

def get_current_streams(url, api_key):
    endpoint = f"{url}/api/v2?apikey={api_key}&cmd=get_activity"
    response = requests.get(endpoint)
    if response.status_code == 200:
        return response.json()
    else:
        return None

def generate_stream_updates():
    while True:
        data = {}  # Create an empty dictionary to hold the stream data
        for server in TAUTULLI_SERVERS:
            url, api_key, name = server['url'], server['api_key'], server['name']
            streams = get_current_streams(url, api_key)
            if streams and streams['response']['result'] == 'success':
                sessions = streams['response']['data']['sessions']
                data[name] = []  # Initialize an empty list for the server
                for session in sessions:
                    stream_info = {
                        'user': session.get('user', 'Unknown User'),
                        'title': session.get('full_title', 'Unknown Title'),
                        'state': session.get('state', 'Unknown State'),
                        'transcode_decision': session.get('transcode_decision', 'Unknown Transcode Decision'),
                        'progress_percent': session.get('progress_percent', 0)
                    }
                    data[name].append(stream_info)  # Append the stream to the server's list

        # Using Jinja2 because we do not care about flask context
        template_env = Environment(loader=FileSystemLoader('templates'))
        template = template_env.get_template('streams_status.html')
        output = template.render(data=data).replace('\n', '')
        yield f"data: {output}\n\n"

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/stream_updates')
def stream_updates():
    return Response(generate_stream_updates(), content_type='text/event-stream')

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)
