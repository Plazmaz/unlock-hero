class World {
    player = null;
    entityHBUnlocked = false;
    spawnRocks = false;
    platforms = [];
    entities = [];

    constructor(app, debug) {
        this.groundTex = getSingleTextureFromSpritesheet("tiles.json", "ground_shitty");
        this.ground = new PIXI.Rectangle(-2500, app.renderer.height - 100, 5000, 500);
        this.groundSprite = new PIXI.TilingSprite(this.groundTex, this.ground.width, this.ground.height);
        this.groundSprite.position.x = this.ground.x;
        this.groundSprite.position.y = this.ground.y;
        this.groundSprite.anchor.set(0);

        app.stage.addChild(this.groundSprite);
        this.platforms.push(this.groundSprite);
        this.spawnPlatform(-250, this.ground.top - 50, 500, 200);
        if (debug) {
            this.debugGraphics = new PIXI.Graphics();
            this.debugDraw();
            app.stage.addChild(this.debugGraphics);
        }
        this.app = app;
    }

    spawnPlatform(x, y, width, height) {
        let rect = new PIXI.Rectangle(x, y, width, height);
        let platformSprite = new PIXI.TilingSprite(this.groundTex, rect.width, rect.height);
        platformSprite.position.x = x;
        platformSprite.position.y = y;
        platformSprite.anchor.set(0);
        app.stage.addChild(platformSprite);
        this.platforms.push(platformSprite);
    }

    spawnEnemy(x, y) {
        let hb = new HealthBar(app, new PIXI.Rectangle(0, 0, 500, 80), 0, 0, false);
        if(this.entityHBUnlocked) {
            hb.targetAlpha = 1;
            hb.setAlphaImmediate(1);
        }

        let enemy = new EnemySlime(this.app, hb);
        enemy.setX(x);
        enemy.setY(y);
        this.entities.push(enemy);
    }

    spawnEnemies(count) {
        for (let i = 0; i < count; i++) {
            let x = randRange(this.ground.left, this.ground.right);
            this.spawnEnemy(x, 0)
        }
    }

    spawnRockPickups() {
        for (let i = 0; i < Math.floor(randRange(5, 15)); i++) {
            let x = randRange(this.ground.left, this.ground.right);
            let y = this.ground.top;
            let ammoPickup = new AmmoPickupRock(this.app, this.player);
            ammoPickup.setX(x);
            ammoPickup.setY(y);
            this.entities.push(ammoPickup);
        }
    }

    update(delta) {
        app.stage.position.set(app.screen.width / 2, app.screen.height / 2);
        app.stage.pivot.copy(this.player.sprite.position);
        let noRocks = true;
        this.entities.forEach((entity, idx) => {
            this.entities.forEach((entityB) => {
                if(entity === entityB) {
                    return;
                }
                if(entity.collidesWith(entityB.sprite)) {
                    entity.onCollision(entityB);
                }
            });
            if(entity.dead) {
                entity.destroy();
                this.entities.splice(idx, 1);
                return
            }
            if(entity instanceof AmmoPickupRock) {
                noRocks = false;
            }
            entity.update(delta, world)
        });
        if(this.spawnRocks && noRocks) {
            this.spawnRockPickups();
        }
    }

    worldToScreen(vector) {
        let relX = (this.app.screen.width / 2) - vector.x;
        let relY = (this.app.screen.height / 2) - vector.y;
        vector.x = this.app.stage.pivot.x + relX;
        vector.y = this.app.stage.pivot.y + relY;
        return vector;
    }

    debugDraw() {
        this.debugGraphics.lineStyle(2, 0x32cd32);
        this.debugGraphics.drawRect(this.ground.x, this.ground.y, this.ground.width, this.ground.height);
    }
}