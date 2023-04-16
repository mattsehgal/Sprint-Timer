import cv2
import imutils

start_point = ()
end_point = ()


def draw_rectangle(event, x, y, flags, param):
    global start_point, end_point
    if event == cv2.EVENT_LBUTTONDOWN:
        start_point = (x, y)
    elif event == cv2.EVENT_LBUTTONUP:
        end_point = (x, y)


def set_points(event, x, y, flags, params):
    global start_point, end_point
    if start_point == ():
        if event == cv2.EVENT_LBUTTONUP:
            start_point = (x, y)
    elif end_point == ():
        if event == cv2.EVENT_LBUTTONUP:
            end_point = (x, y)


cap = cv2.VideoCapture('testvid2.MOV')
ret, frame = cap.read()

cv2.namedWindow("video", cv2.WINDOW_NORMAL)
cv2.setMouseCallback("video", set_points)

cv2.imshow("video", frame)
cv2.waitKey(0)

while start_point == ():
    cv2.imshow("video", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

ret, frame = cap.read()
direction = start_point[0] < end_point[0]  # True=L->R, False=R->L
if direction:
    add = (end_point[0] - start_point[0]) / 5
    x1 = start_point[0] + (add / 2)
    x2 = end_point[0] + (add / 2)
else:
    add = (start_point[0] - end_point[0]) / 5
    x1 = start_point[0] - (add / 2)
    x2 = end_point[0] - (add / 2)
y1 = start_point[1] - add
y2 = end_point[1] - add
start_end_point = int(x1), int(y1)
end_end_point = int(x2), int(y2)
cv2.rectangle(frame, start_point, start_end_point, (0, 255, 0), 10)
cv2.rectangle(frame, end_point, end_end_point, (0, 0, 255), 10)
cv2.imshow("video", frame)

frame1 = None
frame2 = None
sflag = False
eflag = False
fps = cap.get(5)
frame_counter = 0
while True:
    ret, frame = cap.read()
    if not ret:
        break
    if direction:  # L->R
        crop1 = frame.copy()[start_end_point[1]:start_point[1], start_point[0]:start_end_point[0]]
        crop2 = frame.copy()[end_end_point[1]:end_point[1], end_point[0]:end_end_point[0]]
    else:  # R->L (L<-R)
        crop1 = frame.copy()[start_end_point[1]:start_point[1], start_end_point[0]:start_point[0]]
        crop2 = frame.copy()[end_end_point[1]:end_point[1], end_end_point[0]:end_point[0]]
    gray1 = cv2.cvtColor(crop1, cv2.COLOR_BGR2GRAY)
    gray1 = cv2.GaussianBlur(gray1, (21, 21), 0)
    gray2 = cv2.cvtColor(crop2, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.GaussianBlur(gray2, (21, 21), 0)
    if frame1 is None:
        frame1 = gray1
    if frame2 is None:
        frame2 = gray2
    frame_delta1 = cv2.absdiff(frame1, gray1)
    thresh1 = cv2.threshold(frame_delta1, 25, 255, cv2.THRESH_BINARY)[1]
    thresh1 = cv2.dilate(thresh1, None, iterations=3)
    cnts1 = cv2.findContours(thresh1.copy(),
                            cv2.RETR_EXTERNAL,
                            cv2.CHAIN_APPROX_SIMPLE)
    cnts1 = imutils.grab_contours(cnts1)
    frame_delta2 = cv2.absdiff(frame2, gray2)
    thresh2 = cv2.threshold(frame_delta2, 25, 255, cv2.THRESH_BINARY)[1]
    thresh2 = cv2.dilate(thresh2, None, iterations=3)
    cnts2 = cv2.findContours(thresh2.copy(),
                             cv2.RETR_EXTERNAL,
                             cv2.CHAIN_APPROX_SIMPLE)
    cnts2 = imutils.grab_contours(cnts2)
    for c1 in cnts1:
        # if the contour is too small, ignore it
        if cv2.contourArea(c1) < 500:
            continue
        else:
            sflag = True
    for c2 in cnts2:
        # if the contour is too small, ignore it
        if cv2.contourArea(c2) < 500:
            continue
        else:
            eflag = True
    # if end box hit, end
    if eflag:
        break
    # if start box hit, count the frame
    if sflag:
        frame_counter += 1
    cv2.rectangle(frame, start_point, start_end_point, (0, 255, 0), 10)
    cv2.rectangle(frame, end_point, end_end_point, (0, 0, 255), 10)
    cv2.imshow("video", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

time = frame_counter / fps
print(time)

cap.release()
cv2.destroyAllWindows()
