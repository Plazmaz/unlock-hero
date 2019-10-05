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
