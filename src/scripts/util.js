function getSprite(name) {
    name = "assets/images/" + name;
    let sprite = new PIXI.heaven.Sprite(PIXI.loader.resources[name].texture);
    sprite.anchor.set(0.5);
    return sprite;
}
function getSingleFromSpritesheet(name, region) {
    name = "assets/images/sprites/" + name;
    let sheet = PIXI.loader.resources[name].spritesheet;
    let sprite = new PIXI.heaven.Sprite(sheet.textures[region]);
    sprite.anchor.set(0.5);
    return sprite;
}
function getSingleTextureFromSpritesheet(name, region) {
    name = "assets/images/sprites/" + name;
    let sheet = PIXI.loader.resources[name].spritesheet;
    return sheet.textures[region];
}
function randRange(min, max) {
    let diff = max - min;
    return Math.random() * (diff + 1) + min;
}
// Expects an object w/ x and y, returns object with x/y normalized
function normalize(point) {
    let x = point.x;
    let y = point.y;
    let bSquared = (x * x) + (y * y);
    let mag = Math.sqrt(bSquared);
    point.x = x / mag;
    point.y = y / mag;
    return point;
}