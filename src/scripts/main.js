let width = window.innerWidth;
let height = window.innerHeight;

const bump = new Bump(PIXI);

let app = new PIXI.Application({
    width: width,
    height: height,
    antialias: true,
    transparent: false
});

PIXI.loader
    .add("assets/images/char.png")
    .add("assets/images/sprites/16x16.json")
    .add("assets/images/sprites/32x32.json")
    .add("assets/images/sprites/p2_walk.json")
    .load(loadFinished);

document.body.appendChild(app.view);

function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
}

function stepTowards(val, target, step) {
    if (val > target) {
        val -= step;
    }
    if (val < target) {
        val += step;
    }
    if (Math.abs(val - target) <= step) {
        val = target;
    }
    return val;
}

const world = new World(app, true);
let hb;

function runUpdate(delta) {
    world.update(delta);
}

function loadFinished() {
    hb = new HealthBar(app, new PIXI.Rectangle(0, 0, 500, 80), 11, 20, true);
    let player = new Player(app, app.stage, hb, 0);

    app.renderer.backgroundColor = 0x60959a;
    world.player = player;
    world.entities.push(player);
    world.spawnEnemy();

    app.ticker.add((delta) => {
        runUpdate(delta)
    });
    // app.stage.addChild(getSprite("char.png"))
}