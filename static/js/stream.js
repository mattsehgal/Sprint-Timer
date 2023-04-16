let video = document.getElementById('video');
let canvas = document.getElementById('canvas');
let context = canvas.getContext('2d', { willReadFrequently: true } );
let cap = new cv.VideoCapture(video);

let height = null;
let width = null;
let fps;
let startPoint = null;
let endPoint = null;
let startBox = null;
let endBox = null;
let boxWidth = null;
let boxHeight = null;
let direction = true;

let distForm = document.getElementById('distForm');
let pointsBtn = document.getElementById('pointsBtn');
let timeBtn = document.getElementById('timeBtn');
let resetBtn = document.getElementById('resetBtn');

navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => {
        video.srcObject = stream;
        video.play();
        fps = stream.getVideoTracks()[0].getSettings().frameRate;
    })
    .catch(error => {
        console.error('Error accessing camera:', error);
    });

video.addEventListener('loadedmetadata', () => {
    height = video.videoHeight;
    width = video.videoWidth;
    video.height = height;
    video.width = width;
    cap.video.videoHeight = height;
    cap.video.videoWidth = width;
    let src = new cv.Mat(height, width, cv.CV_8UC4);
    function getFrame() {
        context.drawImage(video, 0, 0, width, height);
        if (startPoint != null && endPoint != null) {
            startBox = { ...startPoint };
            endBox = { ...endPoint };
            boxHeight = 100;
            boxWidth = 100;
            direction = startPoint.x < endPoint.x;
            if (direction) {
                boxHeight = (endPoint.x - startPoint.x) / (distance / 2);
                boxWidth = boxHeight / 2;
            } else {
                boxHeight = (startPoint.x - endPoint.x) / (distance / 2);
                boxWidth = boxHeight / 2;
                startBox.x = Math.round(startBox.x - boxWidth);
            }
            startBox.y = Math.round(startBox.y - boxHeight);
            endBox.y = Math.round(endBox.y - boxHeight);
            startBox.x = Math.round(startBox.x);
            endBox.x = Math.round(endBox.x);
            context.strokeStyle = "#00FF00";
            context.strokeRect(startBox.x, startBox.y, boxWidth, boxHeight);
            context.strokeStyle = "#FF0000";
            context.strokeRect(endBox.x, endBox.y, boxWidth, boxHeight);
        }
        src.data.set(context.getImageData(0, 0, width, height).data);
        cv.imshow('canvas', src);
        window.requestAnimationFrame(getFrame);

    }
    window.requestAnimationFrame(getFrame);

});

let distance = 10;
distForm.addEventListener('submit', function (event) {
    event.preventDefault();
    distance = distForm.dist.value;
    pointsBtn.disabled = false;
    console.log(distance);
});

pointsBtn.addEventListener('click', function (event) {
    event.preventDefault();
    canvas.addEventListener('click', setPoint);
});

function setPoint(event) {
    if (startPoint == null) {
        startPoint = { x: event.offsetX, y: event.offsetY };
        console.log(startPoint);
    } else if (endPoint == null) {
        endPoint = { x: event.offsetX, y: event.offsetY };
        console.log(endPoint);
        canvas.removeEventListener('click', setPoint);
        pointsBtn.disabled = true;
        timeBtn.disabled = false;
        resetBtn.disabled = false;
    }
}

timeBtn.addEventListener('click', function (event) {
    getTime();
});

function getTime() {
    let prevFrame = null;
    let gray = new cv.Mat();
    let diff = new cv.Mat();
    let startFlag = false;
    let endFlag = false;
    let frameCount = 0;

    function processFrame() {
        const frame = new cv.matFromImageData(context.getImageData(0, 0, width, height));
        if (!frame.data) {
            return;
        }

        cv.GaussianBlur(frame, frame, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
        if (prevFrame !== null) {
            cv.absdiff(frame, prevFrame, diff);
            cv.cvtColor(diff, gray, cv.COLOR_BGR2GRAY);
            cv.adaptiveThreshold(gray, gray, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY, 11, 2);
            if (cv.countNonZero(gray) === 0) {
                return requestAnimationFrame(processFrame);

            }
        }
        prevFrame = frame;
        const contours = new cv.MatVector();
        const hier = new cv.Mat();
        cv.findContours(gray, contours, hier, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
        for (let i = 0; i < contours.size(); ++i) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            if (area <= 10000) {
                const boundingRect = cv.boundingRect(contour);
                if (isInBoundingBox(boundingRect, startBox, boxWidth, boxHeight) && !startFlag) {
                    startFlag = true;
                } else if (startFlag && !endFlag && isInBoundingBox(boundingRect, endBox, boxWidth, boxHeight)) {
                    endFlag = true;
                    break;
                }
            }
        }
        hier.delete();
        contours.delete();
        if (startFlag && !endFlag) {
            frameCount++;
            requestAnimationFrame(processFrame);
        } else if (endFlag) {
            const time = frameCount / fps;
            alert('Time elapsed: '+time);
        } else {
            requestAnimationFrame(processFrame);
        }
    }

    function isInBoundingBox(rect, box, boxWidth, boxHeight) {
        return rect.x < box.x + boxWidth &&
        rect.x + rect.width > box.x &&
        rect.y < box.y + boxHeight &&
        rect.y + rect.height > box.y;
    }

    requestAnimationFrame(processFrame);
}
//
//function getTime() {
//    let prevFrame = null;
//    let startFlag = false;
//    let endFlag = false;
//    let frameCount = 0;
//    let startTime = 0;
//    let endTime = 0;
//
//    function processFrame() {
//        const frame = new cv.matFromImageData(context.getImageData(0, 0, width, height));
//        if (!frame.data) {
//            return;
//        }
//
//        if (prevFrame !== null) {
//            // convert frames to grayscale
//            const gray1 = new cv.Mat();
//            const gray2 = new cv.Mat();
//            cv.cvtColor(prevFrame, gray1, cv.COLOR_BGR2GRAY);
//            cv.cvtColor(frame, gray2, cv.COLOR_BGR2GRAY);
//
//            // calculate optical flow
//            const flow = new cv.Mat();
//            const pyrScale = 0.5;
//            const levels = 3;
//            const winsize = 15;
//            const iterations = 3;
//            const polyN = 5;
//            const polySigma = 1.2;
//            const flags = cv.OPTFLOW_FARNEBACK_GAUSSIAN;
//            cv.calcOpticalFlowFarneback(gray1, gray2, flow, pyrScale, levels, winsize, iterations, polyN, polySigma, flags);
//
//            // calculate magnitude of optical flow within the bounding boxes
//            const startFlow = cv.mean(flow.roi(startBox))[0];
//            const endFlow = cv.mean(flow.roi(endBox))[0];
//
//            // check if motion is detected at start
//            if (startFlow > 0 && !startFlag) {
//                startFlag = true;
//                startTime = frameCount;
//            }
//
//            // check if motion is detected at end
//            if (startFlag && endFlow > 0 && !endFlag) {
//                endFlag = true;
//                endTime = frameCount;
//                const time = (endTime - startTime) / fps;
//                alert('Time elapsed: '+time);
//            }
//
//            flow.delete();
//            gray1.delete();
//            gray2.delete();
//        }
//
//        prevFrame = frame;
//        frameCount++;
//        requestAnimationFrame(processFrame);
//    }
//
//    requestAnimationFrame(processFrame);
//}
