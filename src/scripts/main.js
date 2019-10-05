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
    .add("assets/images/sprites/p1_walk.json")
    .add("assets/images/sprites/p2_walk.json")
    .load(loadFinished);

window.onload = () => {
    document.body.appendChild(app.view);
};

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

function runUpdate(delta) {
    world.update(delta);
}

function loadFinished() {
    let player = new Player(app, app.stage, 0);
    world.player = player;
    world.entities.push(player);
    world.entities.push(new Enemy(app, app.stage, 0));

    app.ticker.add((delta) => {
        runUpdate(delta)
    });
    // app.stage.addChild(getSprite("char.png"))
}