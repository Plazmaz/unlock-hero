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

    spawnEnemy() {
        let hb = new HealthBar(app, new PIXI.Rectangle(0, 0, 500, 80), 0, 0, false);
        this.entities.push(new Enemy(this.app, this.app.stage, hb, 0));
    }

    spawnEnemies(count) {

    }

    update(delta) {
        app.stage.position.set(app.screen.width / 2, app.screen.height / 2);
        app.stage.pivot.copy(this.player.sprite.position);
        this.entities.forEach((entity, idx) => {
            if(entity instanceof Living && entity.dead) {
                entity.destroy();
                this.entities.splice(idx, 1);
            }
            entity.update(delta, world)
        })
    }

    debugDraw() {
        this.debugGraphics.lineStyle(2, 0x32cd32);
        this.debugGraphics.drawRect(this.ground.x, this.ground.y, this.ground.width, this.ground.height);
    }

}