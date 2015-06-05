DragArrow = function() {
    this.graphics = new PIXI.Graphics();
    this.dragging = false;
    this.startPoint = null;
    this.dragTarget = null;
    this.vectorRepresentation = null;
};

DragArrow.prototype.graphics = null;

DragArrow.prototype.drawToPointer = function(ev) {
    var newPosition = ev.data.getLocalPosition(this.graphics.parent);
    this.graphics.clear();
    this.graphics.lineStyle(3, 0xFF0000);
    this.graphics.moveTo(this.startPoint.x, this.startPoint.y);
    this.graphics.lineTo(newPosition.x, newPosition.y);
    this.vectorRepresentation = {
        x: newPosition.x - this.startPoint.x,
        y: newPosition.y - this.startPoint.y,
    }
};

DragArrow.prototype.startDrag = function(ev) {
    this.dragging = true;
    var newPosition = ev.data.getLocalPosition(this.graphics);
    // this.startPoint = {
    //     x: newPosition.x,
    //     y: newPosition.y
    // }
    this.startPoint = ev.target.position;
    this.dragTarget = ev.target._parentReference;
};

DragArrow.prototype.dragMove = function(ev) {
    if (this.dragging === true) {
        this.drawToPointer(ev);
    }
};

DragArrow.prototype.exertForce = function() {
    window.forces.push({
        target: this.dragTarget,
        force: {
            x: this.vectorRepresentation.x * -200,
            y: this.vectorRepresentation.y * -200
        }
    });
};

DragArrow.prototype.dragEnd = function(ev) {
    this.exertForce();
    window.makeMove({
            X: this.vectorRepresentation.x * -200,
            Y: this.vectorRepresentation.y * -200
    });
    this.dragging = false;
    this.graphics.clear();
};
