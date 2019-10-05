class UIElement {
    constructor(app, bounds, sprites, sticky) {
        this.app = app;
        this.set = false;
        this.bounds = bounds;
        this.setSprites(sprites);
        this.sticky = sticky;
    }
    setSprites(sprites) {
        if(this.element != null) {
            this.app.stage.removeChild(this.element)

        }
        // Wrap with array if it's not an array.
        if(Array.isArray(sprites)) {
            this.element = new PIXI.Container();
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
    setAlpha(alpha) {
        this.sprite.alpha = alpha;
    }
}

class HealthBar extends UIElement{
    constructor(app, bounds, health, maxHealth, sticky) {
        super(app, bounds, [], sticky);
        this.setHealth(health, maxHealth);
    }
    setHealth(health, maxHealth) {
        this.health = health;
        this.maxHealth = maxHealth;
        let sprites = [];
        for (let i = 0; i < this.maxHealth; i += 2) {
            let sprite;
            if(i < this.health - (this.health % 2)) {
                // Normal heart
                sprite = getSingleFromSpritesheet("16x16.json", "heart_0.png");
            } else if(this.health - i === 1) {
                sprite = getSingleFromSpritesheet("16x16.json", "heart_1.png");
            } else {
                // Empty
                sprite = getSingleFromSpritesheet("16x16.json", "heart_2.png");
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