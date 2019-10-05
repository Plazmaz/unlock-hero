
class Entity {
    TYPE_PLAYER = 0;
    TYPE_ENEMY = 1;
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
        this.type = -1;
        this.rightFacing = true;
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
            this.animationState.textures = sheet.animations[region];
            this.animationState.animationSpeed = speed;
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
        let closeEnough = true;
        if(this.getX() <= x - stopDist) {
            this.velX += this.speedX;
            closeEnough = false;
        } else if(this.getX() >= x + stopDist) {
            this.velX -= this.speedX;
            closeEnough = false;
        }
        // As we get closer, we jump if we can and we're below our target
        let jumpDist = stopDist * 1.5;
        if(canJump && this.getY() - y > 30
            && Math.abs(this.getX() - x) <= jumpDist) {
            this.jump(delta);
            closeEnough = false;
        }
        return closeEnough;
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
            this.rightFacing = true;
        } else {
            this.sprite.scale.x = -1;
            this.rightFacing = false;
            // this.setX(this.sprite.centerX - (this.sprite.width / 2))
        }
    }
    playAnimation(name, speed) {
        if(this.playingAnimation !== name) {
            this.setAnimation(this.spritesheet, name, speed);
            this.playingAnimation = name;
        }
    }
    getNearbyEntities(type, radius) {
        let rSquared = radius * radius;
        let found = [];
        world.entities.forEach((entity) => {
            if(entity.type === type) {
                let dX = entity.getX() - this.getX();
                let dY = entity.getY() - this.getY();
                let dSquared = (dX * dX) + (dY + dY);
                if(dSquared <= rSquared) {
                    found.push(entity);
                }
            }
        });
        return found;
    }
    destroy() {
        this.stage.removeChild(this.sprite);
    }
}


class Living extends Entity {
    constructor(app, stage, healthBar, sprite, spritesheet, id, maxHealth, damageDealt) {
        super(app, stage, sprite, spritesheet, id);
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        if(healthBar) {
            healthBar.setHealth(this.health, this.maxHealth);
        }
        this.healthBar = healthBar;
        this.damageDealt = damageDealt;
        this.dead = false;
        // Cooldown for attacking others
        this.attackCooldownSec = 0.3;
        this.lastAttack = 0;

        // Cooldown for getting attacked
        this.lastDamaged = 0;
        this.damageCooldownSec = 0.3;
    }

    takeDamage(amount) {
        let curDamageTime = performance.now();
        if((curDamageTime - this.lastDamaged) / 1000 < this.damageCooldownSec) {
            return;
        }

        this.lastDamaged = curDamageTime;
        this.health -= amount;
        if(this.healthBar) {
            this.healthBar.setHealth(this.health, this.maxHealth);
        }
        if(this.health <= 0) {
            this.dead = true;
        }
    }

    //TODO: Support for attacking multiple if needed.
    attack(living) {
        let curAttackTime = performance.now();
        if((curAttackTime - this.lastAttack) / 1000 < this.attackCooldownSec) {
            return;
        }
        living.takeDamage(this.damageDealt);
        this.lastAttack = curAttackTime
    }

    update(delta, world) {
        super.update(delta, world);
        this.healthBar.update(delta);
    }
    destroy() {
        super.destroy();
        this.healthBar.destroy();
    }

}


const drag = 0.18;
const gravity = 0.198;

class Player extends Living {
    MELEE_ANIM = "player_shitty_melee";
    WALK_ANIM = "player_shitty_walk";
    constructor(app, stage, healthBar, id) {
        super(app, stage, healthBar, getSingleFromSpritesheet("32x32.json", "player_shitty_walk_0.png"), "32x32.json", id, 20, 2);
        this.keyLeft = keyboard("a");
        this.keyRight = keyboard("d");
        this.keyJump = keyboard("w");
        this.keyAltJump = keyboard(" ");
        this.mouseLastDown = 0;
        this.type = this.TYPE_PLAYER;
    }
    update(delta, world) {
        let lrAnim = false;
        if(this.keyRight.isDown) {
            this.velX += this.speedX * delta;
            lrAnim = true;
        }
        if(this.keyLeft.isDown) {
            this.velX -= this.speedX * delta;
            lrAnim = true;
        }
        if(this.keyJump.isDown || this.keyAltJump.isDown) {
            this.jump(delta);
        }

        let now = performance.now();
        if(Mouse.Down && (now - this.mouseLastDown) / 1000 > this.attackCooldownSec) {
            if(this.sprite.animState && this.sprite.animState.playing) {
                this.sprite.animState.stop()
            }
            this.playAnimation(this.MELEE_ANIM, 0.2);
            this.sprite.animState.loop = false;
            this.sprite.animState.gotoAndPlay(0);
            this.mouseLastDown = now;
            this.getNearbyEntities(this.TYPE_ENEMY, 200).forEach(enemy => {
                if(this.rightFacing && enemy.getX() >= this.getX()) {
                    this.attack(enemy)
                } else if(!this.rightFacing && enemy.getX() < this.getX()) {
                    this.attack(enemy);
                }
            });
        }

        // Skip walk anim if we're attacking.
        if(this.sprite.animState && this.sprite.animState.playing && this.playingAnimation === this.MELEE_ANIM) {
            super.update(delta, world);
            return;
        }

        if(Math.abs(this.velX) > drag && this.onGround) {
            if(this.velX < 0){
                this.setSpriteDirection(false);
            } else {
                this.setSpriteDirection(true);
            }
            this.playAnimation(this.WALK_ANIM, 0.2);
            if(!this.sprite.animState.playing) {
                this.sprite.animState.play()
            }
        } else {
            if(this.sprite.animState != null && this.sprite.animState.playing) {
                this.sprite.animState.stop()
            }
        }
        super.update(delta, world);
    }
}

class Enemy extends Living {
    constructor(app, stage, hb, id) {
        super(app, stage, hb, getSingleFromSpritesheet("p2_walk.json", "char_10000"), "p2_walk.json", id, 6, 2);
        super.speedX = 0.5;
        super.maxVelX = 2.5;
        super.maxVelY = 6;
        super.speedY = 2;
        super.damageDealt = 1;
        this.type = this.TYPE_ENEMY;
    }
    update(delta, world) {
        let done = this.walkTowards(world.player.getX(), world.player.getY(), 100, true, delta);
        if(done) {
            this.attack(world.player);
        }
        super.update(delta, world);
        this.healthBar.bounds.x = this.sprite.position.x - (this.sprite.width / 2);
        this.healthBar.bounds.y = this.sprite.position.y - this.sprite.height - 20;
    }
}