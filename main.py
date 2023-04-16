from flask import Flask, flash, render_template, Response, request, redirect, url_for
import numpy as np
import cv2
import imutils
from werkzeug.utils import secure_filename
import os

UPLOAD_DIR = 'static/uploads/'

app = Flask(__name__)
app.config['UPLOAD_DIR'] = UPLOAD_DIR
app.secret_key = 'secret key'


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/video', methods=['GET', 'POST'])
def video():
    t = request.form['video_type']
    if t == 'STREAM':
        return render_template('stream.html')
    if t == 'UPLOAD':
        return render_template('upload.html')


@app.route('/stream', methods=['POST'])
def stream():
    data = request.get_json()
    return render_template('stream.html', coords=data['fps'])


@app.route('/upload', methods=['POST'])
def upload():
    if 'file' not in request.files:
        flash('No file')
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        flash('No video selected')
        return redirect(request.url)
    else:
        filename = secure_filename(file.filename)
        file.save(os.path.join(app.config['UPLOAD_DIR'], filename))
        flash('Video successfully uploaded and displayed below')
        return render_template('upload.html', filename=filename)


@app.route('/display/<filename>')
def display_video(filename):
    return redirect(url_for('static', filename='uploads/' + filename), code=301)


# @app.route('/process_video', methods=['POST'])
# def process_video():
#     video = request.files['video']
#     video_arr = np.frombuffer(video.read(), np.uint8)
#     cap = cv2.VideoCapture(video_arr)
#     print('PV')
#     return Response(generate(),
#                     mimetype='multipart/x-mixed-replace; boundary=frame')
#
#
# @app.route('/video_feed')
# def video_feed():
#     return Response(generate(),
#                     mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == '__main__':
    app.run(debug=True,
            port=5000,
            )
