class World {
    player = null;
    entities = [];

    constructor(app, debug) {
        this.ground = new PIXI.Rectangle(-2500, app.renderer.height - 100, 5000, 100);
        if (debug) {
            this.debugGraphics = new PIXI.Graphics();
            this.debugDraw();
            app.stage.addChild(this.debugGraphics);
        }
        this.app = app;
    }

    update(delta) {
        app.stage.position.set(app.screen.width / 2, app.screen.height / 2);
        app.stage.pivot.copy(this.player.sprite.position);
        this.entities.forEach((entity, idx) => {
            entity.update(delta, world)
        })
    }

    debugDraw() {
        this.debugGraphics.lineStyle(2, 0x32cd32);
        this.debugGraphics.drawRect(this.ground.x, this.ground.y, this.ground.width, this.ground.height);
    }

}