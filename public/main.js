var WIDTH = 1920;
var HEIGHT = 1080;

var renderer, container, world, game, clientStateManager;

function init() {
    // Init p2.js
    world = new p2.World({
        gravity: [0, 0]
    });

    // Initialize the stage
    renderer = PIXI.autoDetectRenderer(WIDTH, HEIGHT, {
        backgroundColor: 0x1099bb
    }, false, true);

    // renderer.view.style.height = '100%';
    renderer.view.style.width = '100%';

    document.body.appendChild(renderer.view);

    clientStateManager = new ClientStateManager(ClientStateEnum.LOADING);
    game = new Game(renderer, world, "johnson");
}