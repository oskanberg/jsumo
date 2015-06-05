var WIDTH = 1920;
var HEIGHT = 1080;
var GAME_ID = 'first';
var TURN = 0;

var renderer, container, world;

var balls = {};
var dragArrow;
window.forces = [];

function initialise() {
    init();
    animate();
    // make physics speed independent from render speed
    setInterval(logic, 1000 / 60.0);
}

function init() {
    // Init p2.js
    world = new p2.World({
        gravity: [0, 0]
    });

    // apply any forces
    world.on("postStep", window.applyForces);

    // Initialize the stage
    renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT, {
        backgroundColor: 0x1099bb
    }, false, true);

    // renderer.view.style.width = '80%';
    renderer.view.style.height = '100%';

    // Add the canvas to the DOM
    document.body.appendChild(renderer.view);

    container = new PIXI.Container();
    // origin in centre of renderer
    container.position.x = renderer.width / 2;
    container.position.y = renderer.height / 2;

    dragArrow = new DragArrow();
    container.addChild(dragArrow.graphics);

    buildGameState(GAME_ID, TURN);
}


function animate() {
    requestAnimationFrame(animate);
    // Render scene
    renderer.render(container);
}

function logic() {
    // Move physics bodies forward in time
    world.step(1 / 60.0);
    // Transfer positions of the physics objects to Pixi.js
    for (var name in balls) {
        balls[name].updateLocation();
    }
}

function buildGameState(gameId, turn) {
    getJSON('/api/v1/GameState?id=' + gameId + '&round=' + turn).then(function(data) {
        var currBall, newBall;
        for (var name in data.Balls) {
            currBall = data.Balls[name];
            newBall = new Ball(currBall.Location.X, currBall.Location.Y, currBall.Radius);
            // Add ball to physics
            world.addBody(newBall.body);
            // Add the ball graphics
            container.addChild(newBall.graphics);

            newBall.graphics.interactive = true;
            newBall.graphics.on('mousedown', dragArrow.startDrag.bind(dragArrow));
            newBall.graphics.on('mousemove', dragArrow.dragMove.bind(dragArrow));
            newBall.graphics.on('mouseup', dragArrow.dragEnd.bind(dragArrow));
            newBall.graphics.on('mouseupoutside', dragArrow.dragEnd.bind(dragArrow));

            balls[name] = newBall;
        }
        
        // if not all players have moved
        if (Object.keys(data.Moves).length != Object.keys(data.Balls).length) {
            return;
        }

        for (var player in data.Moves) {
            var move = {
                target: balls[player],
                force: {
                    x: parseFloat(data.Moves[player].X),
                    y: parseFloat(data.Moves[player].Y),
                },
            };
            window.forces.push(move);
        }

    }, function(error) {
        console.error(error);
    });
}

window.applyForces = function() {
    if (window.forces.length === 0) return;
    var force;
    while (force = window.forces.pop()) {
        console.log("Applying force:");
        console.log(force);
        force.target.body.force[0] = force.force.x;
        force.target.body.force[1] = force.force.y;
    }
};

window.makeMove = function(move) {
    postJSON('/api/v1/GameState?id=first', {
        Player: 'johnson',
        Move: move
    }).then(function(data) {
        console.log(data);
    }, function(error) {
        console.log(error);
    });
}
