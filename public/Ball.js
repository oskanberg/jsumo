Ball = function(x, y, r, dragArrow) {
    var shape = new p2.Circle(r);
    this.body = new p2.Body({
        mass: 1,
        position: [x, y],
        damping: 0.8,
    });
    this.body.addShape(shape);

    var texture = new PIXI.Graphics();
    texture.beginFill(0xff0000);
    texture.drawCircle(0, 0, r);
    this.graphics = new PIXI.Sprite(texture.generateTexture(false));
    this.graphics.anchor = new PIXI.Point(0.5, 0.5);
    // don't use rect hit area
    this.graphics.hitArea = new PIXI.Circle(0, 0, r);

    // TODO: hacky?
    this.graphics._parentReference = this;

    this.graphics.on('mousedown', dragArrow.startDrag.bind(dragArrow));
    this.graphics.on('mousemove', dragArrow.dragMove.bind(dragArrow));
    this.graphics.on('mouseup', dragArrow.dragEnd.bind(dragArrow));
    this.graphics.on('mouseupoutside', dragArrow.dragEnd.bind(dragArrow));
};

Ball.prototype.body = null;
Ball.prototype.graphics = null;

Ball.prototype.setLocation = function(x, y) {
    this.graphics.position.x = this.body.position[0] = x;
    this.graphics.position.y = this.body.position[1] = x;
}

Ball.prototype.updateLocation = function() {
    this.graphics.position.x = this.body.position[0];
    this.graphics.position.y = this.body.position[1];
    this.graphics.rotation = this.body.angle;
};

Ball.prototype.startInteraction = function() {
    this.graphics.interactive = true;
};

Ball.prototype.stopInteraction = function() {
    this.graphics.interactive = false;
};