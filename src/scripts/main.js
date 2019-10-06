let width = window.innerWidth;
let height = window.innerHeight;

WebFont.load({
    google: {
        families: ['Press Start 2P']
    },
    active:e => {
        init();
    }
});
const bump = new Bump(PIXI);
let app;
function init() {
    app = new PIXI.Application({
        width: width,
        height: height,
        antialias: true,
        transparent: false
    });

    PIXI.loader
        .add("src/assets/images/char.png")
        .add("src/assets/sound/no_ammo.wav")
        .add("src/assets/sound/pickup.wav")
        .add("src/assets/sound/sword-hit.wav")
        .add("src/assets/sound/punch.wav")
        .add("src/assets/sound/rock.wav")
        .add("src/assets/sound/unlock.wav")
        .add("src/assets/images/sprites/tiles.json")
        .add("src/assets/images/sprites/entities.json")
        .add("src/assets/images/sprites/projectiles.json")
        .add("src/assets/images/sprites/platforms.json")
        .load(loadFinished);

    document.body.appendChild(app.view);
}

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

let enemySpawnInterval = 10 * 1000;
let enemySpawnCount = 5;
let lastEnemySpawnTime = 0;
let world;
let noAmmoSound;
let unlockAnnouncer;
let killCounter;
let ammoCounter;
let hb;

function runUpdate(delta) {
    let now = performance.now();
        if (now - lastEnemySpawnTime >= enemySpawnInterval) {
        world.spawnEnemies(enemySpawnCount);
        lastEnemySpawnTime = now;
    }
    world.update(delta);
    unlockAnnouncer.update(delta);
    killCounter.update(delta);
    ammoCounter.update(delta);

}

function loadFinished() {
    noAmmoSound = PIXI.loader.resources['assets/sound/no_ammo.wav'].sound;
    world = new World(app, false);
    hb = new HealthBar(app, new PIXI.Rectangle(0, 0, 500, 80), 20, 20, true);

    let player = new Player(app, hb);
    player.setY(world.ground.top);
    let unlockBounds = new PIXI.Rectangle(app.screen.width / 2, 160, 500, 80);
    unlockAnnouncer = new UnlockAnnouncer(app, unlockBounds, player);

    let killCounterBounds = new PIXI.Rectangle(16, 90, 500, 80);
    killCounter = new KillCounter(app, killCounterBounds, player);

    let ammoCounterBounds = new PIXI.Rectangle(16, 128, 500, 80);
    ammoCounter = new AmmoCounter(app, ammoCounterBounds, player);

    app.renderer.backgroundColor = 0;
    world.player = player;
    world.entities.push(player);

    app.ticker.add((delta) => {
        runUpdate(delta)
    });
    // hax
    performUnlocks(60);
    performUnlocks(120);
    performUnlocks(190);
    //

    // app.stage.addChild(getSprite("char.png"))
}

function performUnlocks(killCount) {
    switch (killCount) {
        case 3:
            killCounter.setAlpha(1);
            break;
        case 10:
            unlockAnnouncer.setUnlocked("Health HUD");

            hb.setAlpha(1);
            break;
        case 15:
            unlockAnnouncer.setUnlocked("Blue Skies");
            app.renderer.backgroundColor = 0x60959a;
            break;
        case 25:
            unlockAnnouncer.setUnlocked("A Big Stick");
            world.player.weaponMelee = new Stick(app, world);
            break;
        case 30:
            unlockAnnouncer.setUnlocked("Enemy Health");
            world.entityHBUnlocked = true;
            world.entities.forEach((entity) => {
                if (entity instanceof Living && entity.healthBar) {
                    entity.healthBar.setAlpha(1);
                }
            });
            break;
        case 40:
            unlockAnnouncer.setUnlocked("Dirt and grass. Congrats");
            world.beautifyGround();
            break;
        case 50:
            unlockAnnouncer.setUnlocked("Platforms for platforming");
            world.spawnPlatforms();
            break;
        case 55:
            unlockAnnouncer.setUnlocked("Ammo counter?");
            ammoCounter.setAlpha(1);
            break;
        case 60:
            unlockAnnouncer.setUnlocked("Lots of rocks");
            world.spawnRocks = true;
            break;
        case 80:
            unlockAnnouncer.setUnlocked("More Slimes");
            enemySpawnInterval /= 2;
            break;
        case 120:
            unlockAnnouncer.setUnlocked("INFINITE ROCKS");
            world.player.weaponRanged.ammo = 1;
            world.player.weaponRanged.consumable = false;
            break;
        case 135:
            unlockAnnouncer.setUnlocked("Even More Slimes");
            enemySpawnInterval = 3 * 1000;
            break;
        case 150:
            unlockAnnouncer.setUnlocked("Regen (Phew)");
            world.player.regenDelay = 3 * 1000;
            break;
        case 165:
            unlockAnnouncer.setUnlocked("Slimeaggedon");
            enemySpawnCount += 3;
            break;
        case 170:
            unlockAnnouncer.setUnlocked("Stick sharpening (hurts more)");
            world.player.weaponMelee.damage *= 2;
            break;
        case 190:
            unlockAnnouncer.setUnlocked("Rock hard (rocks hit twice before break)");
            world.player.weaponRanged.despawnAfterHits = 2;
            break;
        case 210:
            unlockAnnouncer.setUnlocked("Slimepocalypse");
            enemySpawnCount += 3;
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
    unlockAnnouncer.bounds = new PIXI.Rectangle(app.screen.width / 2, 160, 500, 80);
    killCounter.bounds = new PIXI.Rectangle(16, 90, 500, 80);
    ammoCounter.bounds = new PIXI.Rectangle(16, 128, 500, 80);
});