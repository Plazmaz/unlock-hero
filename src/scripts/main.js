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
        .add("assets/images/char.png")
        .add("assets/sound/no_ammo.wav")
        .add("assets/sound/pickup.wav")
        .add("assets/sound/sword-hit.wav")
        .add("assets/sound/punch.wav")
        .add("assets/sound/rock.wav")
        .add("assets/sound/unlock.wav")
        .add("assets/images/sprites/tiles.json")
        .add("assets/images/sprites/entities.json")
        .add("assets/images/sprites/projectiles.json")
        .add("assets/images/sprites/platforms.json")
        .add("assets/font/PressStart2P-Regular.ttf")
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

let slimeSpawnInterval = 10 * 1000;
let slimeSpawnCount = 4;
let lastSlimeSpawnTime = 0;

let batSpawnInterval = 60 * 1000;
let batSpawnCount = 1;
let lastBatSpawnTime = performance.now();
let spawnBats = false;

let world;
let noAmmoSound;
let unlockAnnouncer;
let killCounter;
let ammoCounter;
let hb;

function runUpdate(delta) {
    let now = performance.now();
    if (now - lastSlimeSpawnTime >= slimeSpawnInterval) {
        world.spawnEnemies(slimeSpawnCount, "slime");
        lastSlimeSpawnTime = now;
    }

    if (spawnBats && now - lastBatSpawnTime >= batSpawnInterval) {
        world.spawnEnemies(batSpawnCount, "bat");
        lastBatSpawnTime = now;
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
        case 70:
            unlockAnnouncer.setUnlocked("Gone Batty");
            spawnBats = true;
            break;
        case 80:
            unlockAnnouncer.setUnlocked("More Slimes");
            slimeSpawnInterval /= 2;
            break;
        case 100:
            unlockAnnouncer.setUnlocked("More Bats");
            batSpawnInterval /= 2;
            break;
        case 120:
            unlockAnnouncer.setUnlocked("INFINITE ROCKS");
            world.player.weaponRanged.ammo = 1;
            world.player.weaponRanged.consumable = false;
            break;
        case 135:
            unlockAnnouncer.setUnlocked("Even More Slimes");
            slimeSpawnInterval = 3 * 1000;
            break;
        case 150:
            unlockAnnouncer.setUnlocked("Regen (Phew)");
            world.player.regenDelay = 3 * 1000;
            break;
        case 165:
            unlockAnnouncer.setUnlocked("Slimeaggedon");
            slimeSpawnCount += 3;
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
            slimeSpawnCount += 3;
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