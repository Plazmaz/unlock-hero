class Weapon {
    constructor(app, name, isProjectile, damage, range, attackAnim, knockback) {
        this.app = app;
        this.name = name;
        this.isProjectile = isProjectile;
        this.damage = damage;
        this.range = range;
        this.consumable = false;
        this.ammo = 0;
        this.attackAnim = attackAnim;
        this.knockback = knockback;
        this.sound = null;
    }
    useWeapon(living, world) {
        if(this.consumable) {
            if(this.ammo <= 0) {
                noAmmoSound.play();
                return;
            }
            this.ammo -= 1;
        }
        if(!this.isProjectile) {
            if(living.sprite.animState && living.sprite.animState.playing) {
                living.sprite.animState.stop()
            }
            living.playAnimation(this.attackAnim, 0.2);
            living.sprite.animState.loop = false;
            living.sprite.animState.gotoAndPlay(0);
            let enemiesToAttack = [];
            living.getNearbyEntities(living.TYPE_ENEMY, this.range).forEach(enemy => {
                if(Math.abs(enemy.getY() - living.getY()) > this.range) {
                    return;
                }
                if(living.rightFacing && enemy.getX() >= living.getX()) {
                    enemiesToAttack.push(enemy);
                } else if(!living.rightFacing && enemy.getX() < living.getX()) {
                    enemiesToAttack.push(enemy);
                }
            });
            let success = living.attack(enemiesToAttack, this.damage, this.knockback);
            if(success && this.sound) {
                this.sound.play();
            }

        }
    }
}
class Stick extends Weapon {
    constructor(app) {
        super(app, "Stick", false, 2, 160, "player_shitty_melee", 120);
        this.sound = PIXI.loader.resources['assets/sound/sword-hit.wav'].sound;
    }
}
class Fist extends Weapon {
    constructor(app) {
        super(app, "First", false, 1, 150, "player_shitty_punch", 100);
        this.sound = PIXI.loader.resources['assets/sound/punch.wav'].sound;
    }
}
class Rock extends Weapon {
    constructor(app) {
        super(app, "Rock", true, 2, 200, "player_shitty_melee", 20);
        this.consumable = true;
        this.sound = PIXI.loader.resources['assets/sound/rock.wav'].sound;
        this.despawnAfterHits = 0;
    }
    launch(living, world) {
        let worldPos = {x: living.getX(), y: living.getY()};
        worldPos = world.worldToScreen(worldPos);

        let deltaVector = {x: Mouse.X - worldPos.x, y: Mouse.Y - worldPos.y};
        deltaVector = normalize(deltaVector);
        let entity = new ProjectileRock(this.app, this, living, deltaVector, 20);
        entity.launcher = living;
        entity.setX(living.getX());
        entity.setY(living.getY());
        world.entities.push(entity);
    }
    useWeapon(living, world) {
        if(this.ammo > 0) {
            this.launch(living, world)
        }
        super.useWeapon(living, world);
    }
}