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
    .add("assets/images/sprites/tiles.json")
    .add("assets/sound/no_ammo.wav")
    .add("assets/images/sprites/entities.json")
    .add("assets/images/sprites/projectiles.json")
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

const ENEMY_SPAWN_INTERVAL = 10 * 1000;
let lastEnemySpawnTime = 0;
let world;
let noAmmoSound;
let killCounter;
let ammoCounter;
let hb;

function runUpdate(delta) {
    let now = performance.now();
    if(now - lastEnemySpawnTime >= ENEMY_SPAWN_INTERVAL) {
        world.spawnEnemies(5);
        lastEnemySpawnTime = now;
    }
    world.update(delta);
    killCounter.update(delta);
    ammoCounter.update(delta);

}
function loadFinished() {
    noAmmoSound = PIXI.sound.Sound.from('assets/sound/no_ammo.wav');
    world = new World(app, true);
    hb = new HealthBar(app, new PIXI.Rectangle(0, 0, 500, 80), 20, 20, true);

    let player = new Player(app, hb);
    player.setY(world.ground.top);
    let killCounterBounds = new PIXI.Rectangle(app.screen.width / 2 - 250, 0, 500, 80);
    killCounter = new KillCounter(app, killCounterBounds, player);

    let ammoCounterBounds = new PIXI.Rectangle(app.screen.width / 2 + 250, 0, 500, 80);
    ammoCounter = new AmmoCounter(app, ammoCounterBounds, player);

    app.renderer.backgroundColor = 0;
    world.player = player;
    world.entities.push(player);

    app.ticker.add((delta) => {
        runUpdate(delta)
    });
    // app.stage.addChild(getSprite("char.png"))
}
function performUnlocks(killCount) {
    switch(killCount) {
        case 3:
            killCounter.setAlpha(1);
            break;
        case 10:
            hb.setAlpha(1);
            break;
        case 15:
            app.renderer.backgroundColor = 0x60959a;
            break;
        case 25:
            world.player.weaponMelee = new Stick(app, world);
            break;
        case 30:
            world.entityHBUnlocked = true;
            world.entities.forEach((entity) => {
                if(entity instanceof Living && entity.healthBar) {
                    entity.healthBar.setAlpha(1);
                }
            });
            break;
        case 40:
            ammoCounter.setAlpha(1);
            break;
        case 45:
            world.spawnRocks = true;
            break
        // case 3:
        //     app.renderer.backgroundColor = 0x60959a;
        //     break;
    }
}
window.addEventListener('playerkill', (e) => {
    this.performUnlocks(e.totalKills)
});
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});