import React, { useRef } from 'react';

interface PaintProps {
    width: number, height: number, lineWidth: number, smoothness: number
}

interface Coord {
    x: number, y: number
}

function drawLine(context: CanvasRenderingContext2D,
                  start: Coord, end: Coord,
                  lineWidth: number) {
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = lineWidth;
    context.moveTo(start.x, start.y);
    context.lineTo(end.x, end.y);
    context.stroke();
    context.closePath();
}

function drawLineFromCoordPath(context: CanvasRenderingContext2D,
                           coordPath: [Coord[], number]) {
    context.beginPath();
    // context.lineWidth = coordPath[1];
    context.moveTo(coordPath[0][0].x, coordPath[0][0].y);
    coordPath[0].forEach(coord => {
        context.lineTo(coord.x, coord.y);
        context.stroke();
        context.moveTo(coord.x, coord.y);
    });
    context.closePath();
}

function drawCurveFromCoordPath(context: CanvasRenderingContext2D,
                                coordPath: [Coord[], number],
                                smoothness: number) {
    context.beginPath();
    context.strokeStyle = 'black';
    context.lineWidth = coordPath[1];
    // context.moveTo(coordPath[0][0].x, coordPath[0][0].y);
    let i;
    const num_coords = coordPath[0].length;
    for (i = 0; i < num_coords; i += smoothness) {
        const coord = coordPath[0][i],
              nextCoord = coordPath[0][Math.min(i + smoothness, num_coords - 1)];
        let x_next_avg = (coord.x + nextCoord.x) / 2,
            y_next_avg = (coord.y + nextCoord.y) / 2;
        context.quadraticCurveTo(coord.x, coord.y, x_next_avg, y_next_avg);
        context.stroke();
    }
    context.closePath();
}

function undrawFromCoordPath(context: CanvasRenderingContext2D,
                             coordPath: [Coord[], number]) {
    // coordPath[1]++;
    context.save();
    context.globalCompositeOperation = "destination-out";
    context.lineWidth = coordPath[1] + 1;
    console.log(context);
    drawLineFromCoordPath(context, coordPath);
    context.restore();
    console.log(context);
    // coordPath[1]--;
}

function undo(context: CanvasRenderingContext2D,
              coordPathStack: [Coord[], number][]) {
    undrawFromCoordPath(context, coordPathStack.pop());
}

function Paint(props: PaintProps) {
    const canvasRef = useRef(null);
    const isDrawing = useRef(false);

    const mousePos: React.MutableRefObject<Coord> = useRef({ x: 0, y:0 });

    // A list of mouse positions, which are stored as a two-element list.
    const currentCoordPath:
        React.MutableRefObject<[Coord[], number]> = useRef([[], props.lineWidth]);
    // A stack of mouse position lists, which track the path taken by the mouse
    const coordPathStack:
        React.MutableRefObject<[Coord[], number][]> = useRef([]);

    // TODO: Move <canvas> event handlers into separate functions. All those
    //       .currents are ugly :'(
    return (
        <canvas
            width={props.width}
            height={props.height}
            ref={canvasRef}
            style={{border: '1px solid black'}}
            onMouseDown = {e => {
                // If the left mouse button was not clicked, do nothing
                if (e.button != 0) return;

                const canvas = canvasRef.current;
                const bounds = canvas.getBoundingClientRect();

                mousePos.current = { x: e.clientX - bounds.left, 
                                     y: e.clientY - bounds.top };
                isDrawing.current = true;
                currentCoordPath.current[0] = [ mousePos.current ];
            }}
            onMouseUp = {e => {
                if (e.button != 0) return;

                mousePos.current = { x: 0, y: 0 };
                isDrawing.current = false;

                if (currentCoordPath.current[0].length == 0) return;

                const context: CanvasRenderingContext2D = canvasRef.current.getContext('2d');
                undrawFromCoordPath(context, currentCoordPath.current);
                drawCurveFromCoordPath(context, currentCoordPath.current, props.smoothness);

                // Weird quirk: this doesn't work:
                // coordPathStack.current.push(currentCoordPath.current);
                // But this does:
                coordPathStack.current.push([currentCoordPath.current[0], currentCoordPath.current[1]]);
                currentCoordPath.current[0] = []
                console.log(coordPathStack);
            }}
            onMouseMove = {e => {
                if (e.button != 0) return;

                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');
                const bounds = canvas.getBoundingClientRect();

                if (isDrawing.current) {
                    const end: Coord = { x: e.clientX - bounds.left,
                                         y: e.clientY - bounds.top };
                    drawLine(context, mousePos.current, end, props.lineWidth);

                    currentCoordPath.current[0].push(mousePos.current);
                    mousePos.current = end;
                }
            }}
            >
        </canvas>
    )
}

export default Paint;
