class World {
    player = null;
    entityHBUnlocked = false;
    slimesAreColored = false;
    spawnRocks = false;
    platforms = [];
    entities = [];
    slimeBaseHealthMod = 0;

    constructor(app, stage, debug) {
        this.stage = stage;
        // this.groundTex = getSingleTextureFromSpritesheet("tiles.json", "ground_dirt");
        // this.grassTex = getSingleTextureFromSpritesheet("tiles.json", "ground_center");

        this.groundTex = getSingleTextureFromSpritesheet("tiles.json", "ground_shitty");
        this.grassTex = getSingleTextureFromSpritesheet("tiles.json", "ground_shitty");
        // 160 * 32 = 5120.
        this.spawnGround(-2560, app.renderer.height - 100, 160, 60);

        // this.spawnPlatform(-250, this.ground.top - 50, 500, 200);
        if (debug) {
            this.debugGraphics = new PIXI.Graphics();
            this.debugDraw();
            this.stage.addChild(this.debugGraphics);
        }
        this.app = app;
    }

    beautifyGround() {
        this.groundTex = getSingleTextureFromSpritesheet("tiles.json", "ground_dirt");
        this.grassTex = getSingleTextureFromSpritesheet("tiles.json", "ground_center");
        this.groundSprite.texture = this.groundTex;
        this.grassSprite.texture = this.grassTex;
    }

    spawnGround(x, y, width, height) {
        this.ground = new PIXI.Rectangle(x, y + 32, width * 32, height * 32);

        this.groundSprite = new PIXI.TilingSprite(this.groundTex, this.ground.width, this.ground.height);
        this.grassSprite = new PIXI.TilingSprite(this.grassTex, this.ground.width, 32);
        this.grassSprite.position.x = x;
        this.grassSprite.position.y = y;
        this.grassSprite.anchor.set(0);

        this.groundSprite.position.x = this.ground.x;
        this.groundSprite.position.y = this.ground.y;
        this.groundSprite.anchor.set(0);
        this.stage.addChild(this.groundSprite);
        this.platforms.push(this.groundSprite);
        this.stage.addChild(this.grassSprite);
        this.platforms.push(this.grassSprite);

    }

    spawnPlatform(x, y, width) {
        let platformSprite;
        switch(width) {
            case 3:
                platformSprite = getSingleFromSpritesheet("platforms.json", "platform_3w");
                break;
            case 4:
                platformSprite = getSingleFromSpritesheet("platforms.json", "platform_4w");
                break;
            case 5:
                platformSprite = getSingleFromSpritesheet("platforms.json", "platform_5w");
                break;
            default:
                platformSprite = this.groundSprite;
                break;
        }
        platformSprite.position.x = x;
        platformSprite.position.y = y;
        platformSprite.anchor.set(0);
        this.stage.addChild(platformSprite);
        this.platforms.push(platformSprite);
    }
    spawnPlatforms() {
        let height = 32;
        let yMax = this.ground.top - (height * 5);
        let widthMin = 3;
        let widthMax = 5;
        let lastWidth = 0;
        let layers = 8;
        for (let y = 0; y < layers; y++) {
            for (let x = this.ground.left + 192; x < this.ground.right - 192; x += lastWidth * 32) {
                lastWidth = Math.floor(randRange(widthMin, widthMax));
                if(Math.random() * 100 <= 10) {
                    let rY = Math.floor(Math.random() * 4);
                    rY = rY * y;
                    rY = yMax - (rY * height);
                    this.spawnPlatform(x, rY, lastWidth, 1);
                }
            }
        }
    }
    spawnSlime(x, y) {
        let hb = new HealthBar(app, new PIXI.Rectangle(0, 0, 500, 80), 0, 0, false);
        if(this.entityHBUnlocked) {
            hb.targetAlpha = 1;
            hb.setAlphaImmediate(1);
        }
        let enemy;
        if(this.slimesAreColored) {
            enemy = new EnemyColoredSlime(this.app, this, hb);
        } else {
            enemy = new EnemySlime(this.app, this, hb);
        }
        enemy.maxHealth += this.slimeBaseHealthMod;
        enemy.health += this.slimeBaseHealthMod;
        enemy.healthBar.setHealth(enemy.health, enemy.maxHealth);
        enemy.setX(x);
        enemy.setY(y);
        this.entities.push(enemy);
    }

    spawnBat(x, y) {
        let hb = new HealthBar(app, new PIXI.Rectangle(0, 0, 500, 80), 0, 0, false);
        if(this.entityHBUnlocked) {
            hb.targetAlpha = 1;
            hb.setAlphaImmediate(1);
        }

        let enemy = new EnemyBat(this.app, this, hb);
        enemy.setX(x);
        enemy.setY(y);
        this.entities.push(enemy);
    }

    spawnEnemies(count, type) {
        for (let i = 0; i < count; i++) {
            let x = randRange(this.ground.left, this.ground.right);
            switch(type) {
                case "bat":
                    this.spawnBat(x, 0);
                    break;
                case "slime":
                    this.spawnSlime(x, 0);
                    break;
            }
        }
    }

    spawnRockPickups() {
        for (let i = 0; i < Math.floor(randRange(5, 15)); i++) {
            let x = randRange(this.ground.left, this.ground.right);
            let y = this.ground.top;
            let ammoPickup = new AmmoPickupRock(this.app, this, this.player);
            ammoPickup.setX(x);
            ammoPickup.setY(y);
            this.entities.push(ammoPickup);
        }
    }

    update(delta) {
        this.app.stage.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
        this.app.stage.pivot.copy(this.player.sprite.position);
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