function keyboard(value) {
    let key = {};
    key.value = value;
    key.isDown = false;
    key.isUp = true;
    key.press = undefined;
    key.release = undefined;
    //The `downHandler`
    key.downHandler = event => {
        if (event.key === key.value) {
            if (key.isUp && key.press) key.press();
            key.isDown = true;
            key.isUp = false;
            event.preventDefault();
        }
    };

    //The `upHandler`
    key.upHandler = event => {
        if (event.key === key.value) {
            if (key.isDown && key.release) key.release();
            key.isDown = false;
            key.isUp = true;
            event.preventDefault();
        }
    };

    //Attach event listeners
    const downListener = key.downHandler.bind(key);
    const upListener = key.upHandler.bind(key);

    window.addEventListener(
        "keydown", downListener, false
    );
    window.addEventListener(
        "keyup", upListener, false
    );

    // Detach event listeners
    key.unsubscribe = () => {
        window.removeEventListener("keydown", downListener);
        window.removeEventListener("keyup", upListener);
    };

    return key;
}

let Mouse = {
    LeftDown: false,
    RightDown: false,
    X: 0,
    Y: 0
};
window.addEventListener("mousedown", e => {
    if(e.button === 0) {
        Mouse.LeftDown = true;
    } else if (e.button === 2) {
        Mouse.RightDown = true;
    }
    e.preventDefault()
});
window.addEventListener("mouseup", e => {
    if(e.button === 0) {
        Mouse.LeftDown = false;
    } else if (e.button === 2) {
        Mouse.RightDown = false;
    }
    e.preventDefault()
});
window.addEventListener("mousemove", e => {
    Mouse.X = e.pageX;
    Mouse.Y = e.pageY;
});
