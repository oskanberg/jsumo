var ClientStateEnum = {
    "INIT": 1,
    "CLIENT_STATE_LOADING": 2,
    "CLIENT_STATE_LOADED": 3,
    "ROUND_ANIMATING_STARTED": 4,
    "ROUND_ANIMATING_FINISHED": 5,
    "WAITING_FOR_MOVES": 6,
    "WAITING_FOR_PLAYER_MOVE": 7,
    "PLAYER_MOVE_MADE": 8
};

if (Object.freeze) {
    Object.freeze(ClientStateEnum);
}

function ClientStateManager(state) {
    this.clientState = ClientStateEnum.INIT;
    this.setClientState(state);
}

ClientStateManager.prototype.setClientState = function(state) {
    if (this.clientState === state) return;

    for (var name in ClientStateEnum) {
    	if (ClientStateEnum[name] == state) {
    		console.log("New state: " + name);
    	}
    }

    var self = this;
    var changeEvent = new CustomEvent('ClientStateChange', {
        'detail': {
            'from': self.clientState,
            'to': state
        }
    });
    self.clientState = state;
    // console.log(changeEvent);
    document.dispatchEvent(changeEvent);
};
