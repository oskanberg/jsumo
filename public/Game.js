function Game(renderer, world, playerId) {
    this.forces = [];
    this.balls = {};
    this.currentRound = -1;
    this.currentId = "";
    this.playerId = playerId;

    this.renderInterval = null;
    this.logicInterval = null;
    this.stopCheckInterval = null;

    this.moving = false;
    this.hasMoved = false;

    this.renderer = renderer;
    this.world = world;
    this.world.on("postStep", this._applyForces.bind(this));

    // create container
    this.container = new PIXI.Container();
    // origin in centre of renderer
    this.container.position.x = renderer.width / 2;
    this.container.position.y = renderer.height / 2;

    this.dragArrow = new DragArrow(this._addForce.bind(this), this._makeMove.bind(this));
    this.container.addChild(this.dragArrow.graphics);

    document.addEventListener('ClientStateChange', this._startShowRound.bind(this));
    document.addEventListener('ClientStateChange', this._stopShowRound.bind(this));
    document.addEventListener('ClientStateChange', this._waitForMoves.bind(this));
    document.addEventListener('ClientStateChange', this._waitForPlayerMove.bind(this));
    document.addEventListener('ClientStateChange', this._playerMoveMade.bind(this));
}

Game.prototype.joinGame = function(id, round) {
    this.currentId = id;
    this.currentRound = round;

    clientStateManager.setClientState(ClientStateEnum.CLIENT_STATE_LOADING);
    // set up latest round from game
    var self = this;
    this._buildRound(id, round).then(function(data) {

            if (self.currentRound === -1) {
                self.currentRound = data.Round;
            }

            // if current player has moved
            if (data.Moves[self.playerId]) {
                // and if all other players have moved
                if (Object.keys(data.Moves).length === Object.keys(data.Balls).length) {
                    // add all forces
                    for (var player in data.Moves) {
                        var move = {
                            target: self.balls[player],
                            force: {
                                x: parseFloat(data.Moves[player].X),
                                y: parseFloat(data.Moves[player].Y),
                            },
                        };
                        self.forces.push(move);
                    }
                    clientStateManager.setClientState(ClientStateEnum.CLIENT_STATE_LOADED);
                } else {
                    // still waiting on moves
                    clientStateManager.setClientState(ClientStateEnum.WAITING_FOR_MOVES);
                }
            } else {
                // waiting for player move
                clientStateManager.setClientState(ClientStateEnum.WAITING_FOR_PLAYER_MOVE);
            }

        },
        function(error) {
            console.error(error);
        });
};

Game.prototype._waitForPlayerMove = function() {
    if (!(event.detail.from == ClientStateEnum.CLIENT_STATE_LOADING && event.detail.to == ClientStateEnum.WAITING_FOR_PLAYER_MOVE)) {
        return;
    }

    // make player ball interactive
    this.balls[this.playerId].startInteraction();

    // start render
    this.renderInterval = setInterval(this._render.bind(this), 1000 / 60.0);
};


Game.prototype._playerMoveMade = function() {
    if (!(event.detail.from == ClientStateEnum.WAITING_FOR_PLAYER_MOVE && event.detail.to == ClientStateEnum.PLAYER_MOVE_MADE)) {
        return;
    }

    clearInterval(this.renderInterval);
    // stop player ball interaction
    this.balls[this.playerId].stopInteraction();
    this.joinGame(this.currentId, this.currentRound);
};

Game.prototype._waitForMoves = function() {
    if (!(event.detail.from == ClientStateEnum.CLIENT_STATE_LOADING && event.detail.to == ClientStateEnum.WAITING_FOR_MOVES)) {
        return;
    }

    var self = this;
    var interval;
    interval = setInterval(function() {
        getJSON('/api/v1/GameState?id=' + self.currentId + '&round=' + self.currentRound).then(function(data) {
            // if all players have moved
            if (Object.keys(data.Moves).length == Object.keys(data.Balls).length) {
                clearInterval(interval);
                // self._createScene(data);
                // perform all moves
                for (var player in data.Moves) {
                    var move = {
                        target: self.balls[player],
                        force: {
                            x: parseFloat(data.Moves[player].X),
                            y: parseFloat(data.Moves[player].Y),
                        },
                    };
                    self.forces.push(move);
                }
            }
        });
    }, 2000);
};

Game.prototype._startShowRound = function(event) {
    if (!(event.detail.from == ClientStateEnum.CLIENT_STATE_LOADING && event.detail.to == ClientStateEnum.CLIENT_STATE_LOADED)) {
        return;
    }

    clientStateManager.setClientState(ClientStateEnum.ROUND_ANIMATING_STARTED);

    // start render
    this.renderInterval = setInterval(this._render.bind(this), 1000 / 60.0);

    // start physics
    this.logicInterval = setInterval(this._logic.bind(this), 1000 / 60.0);

    // start checking whether sim has stopped
    var self = this;
    this.stopCheckInterval = setInterval(function() {
        if (!self.moving && self.hasMoved) {
            clientStateManager.setClientState(ClientStateEnum.ROUND_ANIMATING_FINISHED);
        }
    }, 1000);
};

Game.prototype._stopShowRound = function(event) {
    if (!(event.detail.from == ClientStateEnum.ROUND_ANIMATING_STARTED && event.detail.to == ClientStateEnum.ROUND_ANIMATING_FINISHED)) {
        return;
    }
    console.log("Stopped!");

    // stop this check
    clearInterval(this.stopCheckInterval);
    // stop simulation
    clearInterval(this.logicInterval);
    // stop renderer
    clearInterval(this.renderInterval);

    var state = {};
    for (var name in this.balls) {
        // console.log(this.balls[name]);
        state[name] = {
            Location: {
                X: this.balls[name].graphics.position.x,
                Y: this.balls[name].graphics.position.y
            },
            // TODO
            Radius: this.balls[name].graphics.hitArea.radius
        };
    }
    console.log(this.currentRound);

    // report result to server
    this._reportState(state, this.currentRound + 1);

};

Game.prototype._render = function() {
    // requestAnimationFrame(this._render);
    this.renderer.render(this.container);
};

Game.prototype._logic = function() {
    // Move physics bodies forward in time
    world.step(1 / 60.0);
    // Transfer positions of the physics objects to Pixi.js

    var moving = false;
    for (var name in this.balls) {
        this.balls[name].updateLocation();
        if (Math.abs(this.balls[name].body.velocity[0]) > 0.1) {
            this.hasMoved = true;
            moving = true;
        }
        if (Math.abs(this.balls[name].body.velocity[1]) > 0.1) {
            this.hasMoved = true;
            moving = true;
        }
    }

    // avoid race condition by doing this afterwards
    this.moving = moving;
};

Game.prototype._addForce = function(force) {
    this.forces.push(force);
};

Game.prototype._applyForces = function() {
    if (this.forces.length === 0) return;

    var force;
    while (force = this.forces.pop()) {
        console.log("Applying force:");
        console.log(force);
        force.target.body.force[0] = force.force.x;
        force.target.body.force[1] = force.force.y;
    }
};

Game.prototype._makeMove = function(move) {
    postJSON('/api/v1/GameState?id=first', {
        Player: 'johnson',
        Move: move
    }).then(function(data) {
        clientStateManager.setClientState(ClientStateEnum.PLAYER_MOVE_MADE);
        // console.log(data);
    }, function(error) {
        console.log(error);
    });
};

Game.prototype._reportState = function(state, round) {
    patchJSON('/api/v1/GameState?id=first&round=' + round, state).then(function(data) {
        // console.log(data);
    }, function(error) {
        console.log(error);
    });
};

Game.prototype._buildRound = function(gameId, round) {
    var self = this;
    return new Promise(function(resolve, reject) {
        getJSON('/api/v1/GameState?id=' + gameId + '&round=' + round).then(function(data) {
            self._createScene(self, data);
            resolve(data);
        }, function(error) {
            console.error(error);
        });
    });
};

Game.prototype._createScene = function(self, data) {
    // this._destroyOldScene(self);

    var currBall, newBall;
    for (var name in data.Balls) {
        currBall = data.Balls[name];

        // reuse
        if (self.balls[name]) {
            self.balls[name].setLocation(currBall.Location.X, currBall.Location.Y);
        } else {

            newBall = new Ball(currBall.Location.X, currBall.Location.Y, currBall.Radius, self.dragArrow);
            // Add ball to physics
            self.world.addBody(newBall.body);
            // Add the ball graphics
            self.container.addChild(newBall.graphics);
            self.balls[name] = newBall;
        }

    }
};

// TOOD: probably a memory leak here
Game.prototype._destroyOldScene = function(self) {
    self.world.clear();
    for (var i = self.container.children.length - 1; i >= 0; i--) {
        self.container.removeChild(self.container.children[i]);
    }
    balls = {};
};
