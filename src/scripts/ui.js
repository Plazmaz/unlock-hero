class UIElement {
    constructor(app, bounds, sprites, sticky) {
        this.app = app;
        this.set = false;
        this.bounds = bounds;
        this.setSprites(sprites);
        this.sticky = sticky;
        this.targetAlpha = 0;
    }
    setSprites(sprites) {
        if(this.element == null) {
            this.element = new PIXI.Container();
        } else {
            this.element.children.forEach(child => {
                this.element.removeChild(child);
            });
        }
        // Wrap with array if it's not an array.
        if(Array.isArray(sprites)) {
            sprites.forEach((sprite) => {
                this.element.addChild(sprite);
            });
        } else {
            this.element = sprites;
        }

        this.app.stage.addChild(this.element);
        this.set = true;
    }
    update(delta) {
        if(this.element.alpha  !== this.targetAlpha) {
            let alphaVal = this.element.alpha;
            alphaVal = stepTowards(alphaVal, this.targetAlpha, 0.01);
            this.setAlphaImmediate(alphaVal);
        }
        this.element.position.set(this.bounds.x, this.bounds.y);
        if(this.sticky) {
            let relX = (this.app.screen.width / 2) - this.bounds.x;
            let relY = (this.app.screen.height / 2) - this.bounds.y;
            this.element.position.x = this.app.stage.pivot.x - relX;
            this.element.position.y = this.app.stage.pivot.y - relY;
        }
    }
    destroy() {
        this.app.stage.removeChild(this.element)
    }
    setAlphaImmediate(alpha) {
        this.element.alpha = alpha;
    }
    setAlpha(alpha) {
        this.targetAlpha = alpha;
    }
}
class AmmoCounter extends UIElement {
    constructor(app, bounds, player) {
        super(app, bounds, [], true);
        this.text = new PIXI.Text("Ammo: 0", {fontSize: 36, fill: 0xFFFFFF, align: 'center'});
        this.setSprites(this.text);
        this.player = player;
        this.setAlphaImmediate(0)
    }

    update(delta) {
        super.update(delta);
        this.setAmmo(this.player.weaponRanged.ammo)
    }
    setAmmo(amount) {
        this.text.text = `Ammo: ${amount}`;
    }

    setAlphaImmediate(alpha) {
        super.setAlphaImmediate(alpha);
        this.text.alpha = alpha
    }

}
class KillCounter extends UIElement {
    constructor(app, bounds, trackLiving) {
        super(app, bounds, [], true);
        this.text = new PIXI.Text("Kills: 0", {fontSize: 36, fill: 0xFFFFFF, align: 'center'});
        this.setSprites(this.text);
        this.trackLiving = trackLiving;
        this.setAlphaImmediate(0)
    }

    update(delta) {
        super.update(delta);
        this.setKills(this.trackLiving.killCount)
    }
    setKills(amount) {
        this.text.text = `Kills: ${amount}`;
    }

    setAlphaImmediate(alpha) {
        super.setAlphaImmediate(alpha);
        this.text.alpha = alpha
    }

}

class HealthBar extends UIElement {
    constructor(app, bounds, health, maxHealth, sticky) {
        super(app, bounds, [], sticky);
        this.setHealth(health, maxHealth);
        this.setAlphaImmediate(0)
    }
    setHealth(health, maxHealth) {
        this.health = health;
        this.maxHealth = maxHealth;
        let sprites = [];
        for (let i = 0; i < this.maxHealth; i += 2) {
            let sprite;
            if(i < this.health - (this.health % 2)) {
                // Normal heart
                sprite = getSingleFromSpritesheet("tiles.json", "heart_0");
            } else if(this.health - i === 1) {
                sprite = getSingleFromSpritesheet("tiles.json", "heart_1");
            } else {
                // Empty
                sprite = getSingleFromSpritesheet("tiles.json", "heart_2");
            }
            let padding = 5;
            let xLoc = (Math.round(i / 2) + 1) * (sprite.width + padding);
            sprite.position.set(xLoc, 50);
            sprites.push(sprite);
        }
        this.setSprites(sprites);
    }
    update(delta) {
        super.update(delta);
    }
}