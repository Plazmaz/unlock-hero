ENTITY_ID = 0;
class Entity {
    drag = 0.28;
    gravity = 0.198;
    TYPE_PLAYER = 0;
    TYPE_ENEMY = 1;
    constructor(app, world, sprite, spritesheet) {
        this.app = app;
        this.stage = world.stage;
        this.sprite = sprite;
        this.id = ENTITY_ID++;
        this.velX = 0;
        this.velY = 0;
        this.speedX = 3;
        this.speedY = 4;

        this.maxVelX = 8;
        this.maxVelY = 8;
        this.playingAnimation = null;
        this.animationState = null;
        this.onGround = true;
        this.spritesheet = spritesheet;
        this.type = -1;
        this.rightFacing = true;
        this.dead = false;
        world.stage.addChild(this.sprite);
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
    doCollideWith(boxB) {
        return bump.rectangleCollision(this.sprite, boxB, true);
    }
    update(delta, world) {
        this.velX = clamp(this.velX, -this.maxVelX, this.maxVelX);
        this.velY = clamp(this.velY, -this.maxVelY, this.maxVelY);

        // ground logic
        this.onGround = false;
        world.platforms.forEach((platform) => {
            if(this.collidesWith(platform)) {
                let collision = this.doCollideWith(platform);
                if(collision === "bottom") {
                    this.onGround = true;
                    this.velY = clamp(this.velY, -this.maxVelY, 0);
                }
            }

        });
        if(this.onGround) {
            this.velX = stepTowards(this.velX, 0, this.drag * delta);
        }

        this.velY += this.gravity * delta;

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
    playAnimForCondition(walkAnimName, speed, condition) {
        if(condition) {
            this.playAnimation(walkAnimName, speed);
            if(!this.sprite.animState.playing) {
                this.sprite.animState.play();
            }
        } else {
            if(this.playingAnimation === walkAnimName && this.sprite.animState != null && this.sprite.animState.playing) {
                this.sprite.animState.stop();
            }
        }
        return condition;
    }
    walkTowards(x, y, stopDist, canJump, delta) {
        let closeEnough = true;
        if(this.getX() <= x - stopDist) {
            this.setSpriteDirection(true);
            this.velX += this.speedX * delta;
            closeEnough = false;
        } else if(this.getX() > x + stopDist) {
            this.setSpriteDirection(false);
            this.velX -= this.speedX * delta;
            closeEnough = false;
        }
        // As we get closer, we jump if we can and we're below our target
        let jumpDist = stopDist * 1.5;
        if(canJump && this.getY() - y > 30
            && Math.abs(this.getX() - x) <= jumpDist) {
            this.jump(delta);
            closeEnough = false;
        }
        return closeEnough && Math.abs(this.getY() - y) < stopDist;
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
            this.sprite.animState.loop = true;
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
    applyForce(xDist, yDist, amount) {
        let point = {x: xDist, y: yDist};
        normalize(point);

        let forceX = point.x * amount;
        let forceY = point.y * amount;
        this.velX += forceX;
        this.velY += forceY;
    }
    onCollision(withEntity) {}
    kill() {
        this.dead = true;
    }
    destroy() {
        this.stage.removeChild(this.sprite);
    }
}


class Living extends Entity {
    constructor(app, world, healthBar, sprite, spritesheet, maxHealth, damageDealt) {
        super(app, world, sprite, spritesheet);
        this.maxHealth = maxHealth;
        this.health = maxHealth;
        if(healthBar) {
            healthBar.setHealth(this.health, this.maxHealth);
        }
        this.healthBar = healthBar;
        this.damageDealt = damageDealt;

        this.killCount = 0;

        // Cooldown for attacking others
        this.attackCooldownSec = 0.3;
        this.lastAttack = 0;

        // Cooldown for getting attacked
        this.lastDamaged = 0;
        this.damageCooldownSec = 0.3;
        this.regenDelay = -1;
        this.lastRegen = 0;
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
            this.kill()
        }
    }

    attack(entities, damage, knockbackAmount, ignoreCooldown) {
        if(!Array.isArray(entities)) {
            entities = [entities];
        }
        let curAttackTime = performance.now();
        if(!ignoreCooldown) {
            if ((curAttackTime - this.lastAttack) / 1000 < this.attackCooldownSec) {
                return false;
            }
        }
        entities.forEach(entity => {
            entity.takeDamage(this.damageDealt);
            if(entity.health <= 0) {
                this.killCount++;
                this.onKill(entity)
            }
            // Apply knockback
            entity.applyForce(entity.getX() - this.getX(), -2, knockbackAmount || 20);
        });

        this.lastAttack = curAttackTime;
        return entities.length > 0;
    }

    onKill(entityKilled) {}

    update(delta, world) {
        super.update(delta, world);
        this.healthBar.update(delta);
        if(this.regenDelay !== -1 && this.health !== this.maxHealth) {
            let now = performance.now();
            if(now - this.lastRegen >= this.regenDelay && now - this.lastDamaged >= this.regenDelay) {
                this.health += 1;
                if(this.healthBar) {
                    this.healthBar.setHealth(this.health, this.maxHealth);
                }
                this.lastRegen = now;
            }
        }
    }
    destroy() {
        super.destroy();
        this.healthBar.destroy();
    }

}



class Player extends Living {
    walkAnim = "player_shitty_walk";
    meleeAnim = "player_shitty_melee";
    throwAnim = "player_shitty_ranged";
    idleAnim = "player_shitty_idle";
    constructor(app, world, healthBar) {
        super(app, world, healthBar, getSingleFromSpritesheet("entities.json", "player_shitty_walk_0"), "entities.json", 20, 2);
        this.keyLeft = keyboard("a");
        this.keyRight = keyboard("d");
        this.keyJump = keyboard("w");
        this.keyAltJump = keyboard(" ");
        this.mouseLastDown = 0;
        this.type = this.TYPE_PLAYER;
        this.weaponMelee = new Fist(app, this.world);
        this.weaponRanged = new Rock(app, this.world);
        this.maxVelY = 10;
        this.speedY = 6;
    }
    onKill(entityKilled) {
        let event = new CustomEvent('playerkill');
        event.player = this;
        event.totalKills = this.killCount;
        window.dispatchEvent(event);
    }

    setAnimationNames(walkAnim, idleAnim, meleeAnim, throwAnim) {
        this.walkAnim = walkAnim;
        this.idleAnim = idleAnim;
        this.meleeAnim = meleeAnim;
        this.throwAnim = throwAnim;
        this.weaponMelee.attackAnim = meleeAnim;
        this.weaponRanged.attackAnim = throwAnim;
    }

    update(delta, world) {
        let lrAnim = false;
        if(this.keyRight.isDown) {
            this.setSpriteDirection(true);
            this.velX += this.speedX * delta;
            lrAnim = true;
        }
        if(this.keyLeft.isDown) {
            this.setSpriteDirection(false);
            this.velX -= this.speedX * delta;
            lrAnim = true;
        }
        if(this.keyJump.isDown || this.keyAltJump.isDown) {
            this.jump(delta);
        }

        let now = performance.now();
        let pastCooldown = (now - this.mouseLastDown) / 1000 > this.attackCooldownSec;
        if(Mouse.LeftDown && pastCooldown) {
            this.weaponMelee.useWeapon(this, world);
            this.mouseLastDown = now;
        } else if(Mouse.RightDown && pastCooldown) {
            this.weaponRanged.useWeapon(this, world);
            this.mouseLastDown = now;
        }

        // Skip walk anim if we're attacking.
        if(this.sprite.animState && this.sprite.animState.playing
            && (this.playingAnimation === this.weaponMelee.attackAnim || this.playingAnimation === this.weaponRanged.attackAnim)) {
            super.update(delta, world);
            return;
        }
        let walking = this.playAnimForCondition(this.walkAnim, 0.2, Math.abs(this.velX) > this.drag && this.onGround);
        this.playAnimForCondition(this.idleAnim, 0.05, !walking);
        super.update(delta, world);
    }
}

class Enemy extends Living {
    walkAnim = "slime_shitty_walk";
    constructor(app, world, hb, sprite, maxHealth, damageDealt) {
        super(app, world, hb, sprite, "entities.json", maxHealth, damageDealt);
        super.speedX = 0.5;
        super.maxVelX = 5;
        super.maxVelY = 6;
        super.speedY = 2;
        this.type = this.TYPE_ENEMY;
    }
    update(delta, world) {
        super.update(delta, world);
        this.healthBar.bounds.x = this.sprite.position.x - (this.sprite.width / 2);
        this.healthBar.bounds.y = this.sprite.position.y - this.sprite.height - 20;
    }
}

class EnemySlime extends Enemy {
    walkAnim = "slime_shitty_walk";
    constructor(app, world, hb) {
        super(app,world, hb, getSingleFromSpritesheet("entities.json", "slime_shitty_idle_0"), 4, 1);
        super.speedX = 0.2;
        super.speedY = 5;
        this.idleAnim = "slime_shitty_idle";
    }
    update(delta, world) {
        if(Math.random() * 100 <= 30) {
            this.jump(delta)
        }
        if(this.onGround) {
            this.velX = 0;
        }
        let done = this.walkTowards(world.player.getX(), world.player.getY(), 20, true, delta);
        if(done) {
            this.attack(world.player, this.damageDealt);
        }
        let walking = this.playAnimForCondition(this.walkAnim, 0.2, Math.abs(this.velX) > this.drag || !this.onGround);
        this.playAnimForCondition(this.idleAnim, 0.05, !walking);
        super.update(delta, world);
    }
}

class EnemyBat extends Enemy {
    walkAnim = "bat_fly";
    constructor(app, world, hb) {
        super(app, world, hb, getSingleFromSpritesheet("entities.json", "bat_fly_0"), 4, 1);
        super.speedX = 4;
        super.speedY = 4;
        this.gravity = 0;
        this.idleAnim = "bat_fly";
        this.lastBehaviorStateChange = 0;
        this.targetPlayer = true;
    }
    walkTowards(x, y, stopDist, canJump, delta) {
        let closeEnough = true;
        if(this.getX() <= x - stopDist) {
            this.setSpriteDirection(true);
            this.velX += this.speedX * delta;
            closeEnough = false;
        } else if(this.getX() > x + stopDist) {
            this.setSpriteDirection(false);
            this.velX -= this.speedX * delta;
            closeEnough = false;
        }

        let targY = y - 30;
        if(this.getY() <= targY - 20) {
            this.velY += this.speedY * delta;
            closeEnough = false;
        } else if(this.getY() > targY + 20) {;
            this.velY -= this.speedY  * delta;
            closeEnough = false;
        }
        return closeEnough;
    }
    update(delta, world) {
        // let now = performance.now();
        // if(now - lastBehaviorStateChange >= 10 * 1000 && Math.random() * 100 <= 30) {
        //     this.lastBehaviorStateChange = now;
        //     this.targetPlayer = !this.targetPlayer;
        // }
        let stopDist;
        if(this.targetPlayer) {
            this.targetX = world.player.getX();
            this.targetY = world.player.getY();
            this.speedX = 4;
            this.speedY = 4;
            this.maxVelX = 8;
            this.maxVelY = 8;
            stopDist = 200;
        } else {

            this.targetX = randRange(80, app.screen.width - 80);
            this.targetY = 400;
            this.speedX = 10;
            this.speedY = 10;
            this.maxVelX = 10;
            this.maxVelY = 10;
            stopDist = 20;
        }

        let done = this.walkTowards(this.targetX, this.targetY, stopDist, true, delta);
        if(done) {
            this.targetPlayer = !this.targetPlayer;
            if(this.targetPlayer) {
                this.attack(world.player, this.damageDealt);
            }
        }
        let walking = this.playAnimForCondition(this.walkAnim, 0.1, true);
        // this.playAnimForCondition(this.idleAnim, 0.05, !walking);
        super.update(delta, world);
    }
}

class PickupItem extends Entity {
    pickupSound;
    constructor(app, world, sprite, spritesheet, player) {
        super(app, world, sprite, spritesheet);
        this.player = player;
        if(!this.pickupSound) {
            this.pickupSound = PIXI.loader.resources['assets/sound/pickup.wav'].sound;
        }
    }
    onCollision(withEntity) {
        if(withEntity.id !== this.player.id) {
            return;
        }
        this.onPickup(withEntity);
        super.onCollision(withEntity);
    }
    onPickup(player) {
        this.pickupSound.play()
    }
}
class AmmoPickup extends PickupItem {
    constructor(app, world, sprite, spritesheet, player, forWeaponType) {
        super(app, world, sprite, spritesheet, player);
        this.forWeaponType = forWeaponType;
    }
    onPickup(player) {
        super.onPickup(player);
        if(player.weaponRanged instanceof this.forWeaponType) {
            player.weaponRanged.ammo += 1;
            this.kill();
        }
        if(player.weaponMelee instanceof this.forWeaponType) {
            player.weaponMelee.ammo += 1;
            this.kill();
        }
    }
}

class AmmoPickupRock extends AmmoPickup {
    constructor(app, world, player) {
        super(app, world, getSingleFromSpritesheet("tiles.json", "rock_shitty"), "tiles.json", player, Rock);
    }
}

class Projectile extends Entity {
    constructor(app, world, sprite, spritesheet, dirVector, speed) {
        super(app, world, sprite, spritesheet);
        // Basically no cap here.
        super.maxVelX = 1000;
        super.maxVelY = 1000;
        super.drag = 0;
        super.velX = dirVector.x * speed;
        super.velY = dirVector.y * speed;
    }

}
class ProjectileRock extends Projectile {
    constructor(app, world, weaponRock, launcher, dirVector, speed) {
        super(app, world, getSingleFromSpritesheet("projectiles.json", "projectile_rock"), "projectiles.json", dirVector, speed);
        this.weaponRock = weaponRock;
        this.launcher = launcher;
        this.hits = 0;
    }
    update(delta, world) {
        super.update(delta, world);
        if(this.onGround) {
            this.kill();
        }
    }

    onCollision(withEntity) {
        super.onCollision(withEntity);
        if(withEntity.id === this.launcher.id) {
            return;
        }
        if(withEntity instanceof Living) {
            this.weaponRock.sound.play();
            let success = this.launcher.attack(withEntity, this.weaponRock.damageDealt, this.weaponRock.knockback, true);
            // withEntity.takeDamage(this.weaponRock.damage);
            if(success) {
                this.hits += 1;
                if (this.hits >= this.weaponRock.despawnAfterHits) {
                    this.kill();
                }
            }
        }
    }
}
