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
class TextButton extends UIElement {
    constructor(app, bounds, text, fontSize, color, colorHover) {
        super(app, bounds, [], false);
        let padding = 20;
        this.text = new PIXI.Text(text, {fontFamily: 'Press Start 2P', fontSize: fontSize, fill: color});
        this.text.anchor.set(0.5);
        this.text.interactive = true;
        this.text.hitArea = new PIXI.Rectangle(-this.text.width / 2 - padding, -this.text.height / 2 - padding, this.text.width + padding, this.text.height + padding);
        this.text.click = (e) => {this.click(e)};
        this.text.buttonMode = true;
        this.text.mouseover = () => {
            this.text.style.fill = this.colorHover;
        };
        this.text.mouseout = () => {
            this.text.style.fill = this.color;
        };
        this.text.position.set(this.bounds.x, this.bounds.y);
        this.setSprites(this.text);
        this.color = color;
        this.colorHover = colorHover;
    }
}
class TextDisplay extends UIElement {
    constructor(app, bounds, text, fontSize, color, wrap) {
        super(app, bounds, [], false);
        this.text = new PIXI.Text(text, {fontFamily: 'Press Start 2P', fontSize: fontSize, fill: color, wordWrap: wrap, wordWrapWidth: bounds.width});
        this.text.anchor.set(0.5);
        this.text.position.set(this.bounds.x, this.bounds.y);
        this.setSprites(this.text);
        this.color = color;
    }
}

class UnlockAnnouncer extends UIElement {
    constructor(app, bounds) {
        super(app, bounds, [], true);
        this.text = new PIXI.Text("Unlocked: Nothing!", {fontFamily: 'Press Start 2P', fontSize: 36, fill: 0xFFFFFF, align: 'center'});
        this.text.anchor.set(0.5);
        this.setSprites(this.text);
        this.setAlphaImmediate(0);
        this.visibleStartTime = 0;
        this.sound = PIXI.loader.resources['assets/sound/unlock.wav'].sound;
        this.sound.volume = 0.8;
    }

    update(delta) {
        super.update(delta);
        if(this.targetAlpha !== 0 && performance.now() - this.visibleStartTime > 3 * 1000) {
            this.setAlpha(0);
        }
    }
    setUnlocked(amount) {
        this.text.text = `Unlocked: ${amount}!`;
        this.visibleStartTime = performance.now();
        this.setAlpha(1);
        this.sound.play();
    }

    setAlphaImmediate(alpha) {
        super.setAlphaImmediate(alpha);
        this.text.alpha = alpha
    }

}
class AmmoCounter extends UIElement {
    constructor(app, bounds, player) {
        super(app, bounds, [], true);
        this.text = new PIXI.Text("Ammo:  0", {fontFamily: 'Press Start 2P', fontSize: 24, fill: 0xFFFFFF});
        this.setSprites(this.text);
        this.player = player;
        this.setAlphaImmediate(0)
    }

    update(delta) {
        super.update(delta);
        this.setAmmo(this.player.weaponRanged.ammo)
    }
    setAmmo(amount) {
        this.text.text = `Ammo:  ${amount}`;
    }

    setAlphaImmediate(alpha) {
        super.setAlphaImmediate(alpha);
        this.text.alpha = alpha
    }

}
class KillCounter extends UIElement {
    constructor(app, bounds, trackLiving) {
        super(app, bounds, [], true);
        this.text = new PIXI.Text("Kills: 0", {fontFamily: 'Press Start 2P', fontSize: 24, fill: 0xFFFFFF});
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
        this.element.calculateBounds();
        this.bounds.width = this.element.getBounds().width;
        this.bounds.height = this.element.getBounds().height;
    }
    update(delta) {
        super.update(delta);
    }
}