function getSprite(name) {
    name = "assets/images/" + name;
    let sprite = new PIXI.heaven.Sprite(PIXI.loader.resources[name].texture);
    sprite.anchor.set(0.5);
    return sprite;
}
function getSingleFromSpritesheet(name, region) {
    name = "assets/images/sprites/" + name;
    let sheet = PIXI.loader.resources[name].spritesheet;
    let sprite = new PIXI.heaven.Sprite(sheet.textures[region]);
    sprite.anchor.set(0.5);
    return sprite;
}

class Entity {
    constructor(app, stage, sprite, spritesheet, id) {
        this.app = app;
        this.stage = stage;
        this.sprite = sprite;
        this.id = id;
        this.velX = 0;
        this.velY = 0;
        this.speedX = 3;
        this.speedY = 4;
        this.maxVelX = 5;
        this.maxVelY = 8;
        this.playingAnimation = null;
        this.animationState = null;
        this.onGround = true;
        this.spritesheet = spritesheet;
        stage.addChild(this.sprite);
    }

    setAnimation(name, region, speed) {
        name = "assets/images/sprites/" + name;
        let sheet = PIXI.loader.resources[name].spritesheet;
        if(!this.animationState) {
            this.animationState = new PIXI.heaven.AnimationState(sheet.animations[region]);
            this.animationState.animationSpeed = speed;
            this.animationState.bind(this.sprite)
        } else {
            this.animationState.textures = sheet.animations[region]
        }
    }

    collidesWith(boxB) {
        return bump.hitTestRectangle(this.sprite, boxB)
    }
    update(delta, world) {
        this.velX = clamp(this.velX, -this.maxVelX, this.maxVelX);
        this.velX = stepTowards(this.velX, 0, drag * delta);
        this.velY = clamp(this.velY, -this.maxVelY, this.maxVelY);

        // ground logic
        this.onGround = false;
        if(this.collidesWith(world.ground)) {
            this.velY = clamp(this.velY, -this.maxVelY, 0);
            this.onGround = true;
            this.setY(world.ground.y - (this.sprite.height / 2))
        }

        this.velY += gravity * delta;
        if(Math.abs(this.velX) > drag && this.onGround) {
            if(this.velX < 0){
                this.setSpriteDirection(false);
            } else {
                this.setSpriteDirection(true);
            }
            this.playAnimation("walk", 0.4);
            if(!this.sprite.animState.playing) {
                this.sprite.animState.play()
            }
        } else {
            if(this.sprite.animState != null && this.sprite.animState.playing) {
                this.sprite.animState.stop()
            }
        }
        if(this.getX() + this.velX >= world.ground.right) {
            this.velX = world.ground.right - this.getX();
        } else if (this.getX() + this.velX <= world.ground.left) {
            this.velX = -(this.getX() - world.ground.left);
        }
        this.setX(this.getX() + this.velX);
        this.setY(this.getY() + this.velY);
    }

    jump(delta) {
        if(this.onGround) {
            this.velY -= this.speedY * delta;
        }
    }
    walkTowards(x, y, stopDist, canJump, delta) {
        if(this.getX() <= x - stopDist) {
            this.velX += this.speedX;
        } else if(this.getX() >= x + stopDist) {
            this.velX -= this.speedX;
        }
        // As we get closer, we jump if we can and we're below our target
        let jumpDist = stopDist * 1.5;
        if(canJump && this.getY() - y > 30
            && Math.abs(this.getX() - x) <= jumpDist) {
            this.jump(delta);
        }
    }
    getX() {
        return this.sprite.position.x;
    }

    getY() {
        return this.sprite.position.y;
    }

    setX(x) {
        this.sprite.position.x = x;
    }

    setY(y) {
        this.sprite.position.y = y;
    }
    setSpriteDirection(rightFacing) {
        if(rightFacing) {
            this.sprite.scale.x = 1;
        } else {
            this.sprite.scale.x = -1;
            // this.setX(this.sprite.centerX - (this.sprite.width / 2))
        }
    }
    playAnimation(name, speed) {
        if(this.playingAnimation !== name) {
            this.setAnimation(this.spritesheet, name, speed);
            this.playingAnimation = name;
        }
    }
}


const drag = 0.18;
const gravity = 0.198;
class Player extends Entity {
    constructor(app, stage, id) {
        super(app, stage, getSingleFromSpritesheet("p1_walk.json", "char_10000"), "p1_walk.json", id);
        this.keyLeft = keyboard("a");
        this.keyRight = keyboard("d");
        this.keyJump = keyboard("w");
        this.keyAltJump = keyboard(" ");
    }
    update(delta, world) {
        if(this.keyRight.isDown) {
            this.velX += this.speedX * delta
        }
        if(this.keyLeft.isDown) {
            this.velX -= this.speedX * delta
        }
        if(this.keyJump.isDown || this.keyAltJump.isDown) {
            this.jump(delta);
        }
        super.update(delta, world);
    }
}

class Enemy extends Entity {
    constructor(app, stage, id) {
        super(app, stage, getSingleFromSpritesheet("p2_walk.json", "char_10000"), "p2_walk.json", id);
        super.speedX = 0.4;
        super.maxVelX = 3;
        super.maxVelY = 6;
        super.speedY = 2;
    }
    update(delta, world) {
        this.walkTowards(world.player.getX(), world.player.getY(), 100, true, delta);

        super.update(delta, world);
    }
}