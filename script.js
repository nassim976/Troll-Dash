const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const levelDisplay = document.getElementById("level-display");
const deathDisplay = document.getElementById("death-display");
const messageBox = document.getElementById("message-box");

const gravity = 0.5;
let deaths = 0;
let currentLevel = 0;

let player = {
    x: 30,
    y: 150,
    w: 16,
    h: 16,
    vx: 0,
    vy: 0,
    speed: 3.5,
    jumpPower: -9,
    grounded: false
};

let keys = { left: false, right: false };

// مراحل مصممة خصيصاً للشاشة العريضة (Landscape)
let levels = [
    // المرحلة 1: أرضية تسقط في المنتصف
    {
        msg: "Level 1: Wide world, watch the gap!",
        platforms: [
            { x: 0, y: 180, w: 220, h: 40 },
            { x: 220, y: 180, w: 100, h: 40, isTrap: true, triggered: false },
            { x: 320, y: 180, w: 240, h: 40 }
        ],
        spikes: [],
        door: { x: 500, y: 148, w: 20, h: 32 },
        updateTroll: function() {
            let trap = this.platforms[1];
            if (player.x > 180 && !trap.triggered) {
                trap.triggered = true;
                messageBox.textContent = "Oops! Floor is gone!";
            }
            if (trap.triggered && trap.y < 250) {
                trap.y += 6;
            }
        }
    },
    // المرحلة 2: أشواك تندفع من اليمين
    {
        msg: "Level 2: Speed trap!",
        platforms: [
            { x: 0, y: 180, w: 560, h: 40 }
        ],
        spikes: [
            { x: 350, y: 168, w: 20, h: 12, moving: false }
        ],
        door: { x: 500, y: 148, w: 20, h: 32 },
        updateTroll: function() {
            let spike = this.spikes[0];
            if (player.x > 220 && !spike.moving) {
                spike.moving = true;
                messageBox.textContent = "Run fast!!";
            }
            if (spike.moving && spike.x > 150) {
                spike.x -= 4;
            }
        }
    },
    // المرحلة 3: الباب الهارب في المسار العريض
    {
        msg: "Level 3: The escaping door!",
        platforms: [
            { x: 0, y: 180, w: 560, h: 40 }
        ],
        spikes: [
            { x: 250, y: 168, w: 25, h: 12 }
        ],
        door: { x: 500, y: 148, w: 20, h: 32, escaped: false },
        updateTroll: function() {
            if (player.x > 400 && !this.door.escaped) {
                this.door.x = 50; // الباب يهرب للبداية!
                this.door.escaped = true;
                messageBox.textContent = "Too easy? Think again!";
            }
        }
    }
];

let activeLevel = {};

function loadLevel(index) {
    if (index >= levels.length) {
        messageBox.textContent = "YOU BEAT THE GAME! 🎉";
        currentLevel = 0;
        index = 0;
    }
    activeLevel = JSON.parse(JSON.stringify(levels[index]));
    activeLevel.updateTroll = levels[index].updateTroll;

    player.x = 30;
    player.y = 140;
    player.vx = 0;
    player.vy = 0;

    levelDisplay.textContent = `LEVEL: ${index + 1} / ${levels.length}`;
    messageBox.textContent = activeLevel.msg;
}

function killPlayer() {
    deaths++;
    deathDisplay.textContent = `DEATHS: ${deaths}`;
    loadLevel(currentLevel);
}

function update() {
    if (keys.left) player.vx = -player.speed;
    else if (keys.right) player.vx = player.speed;
    else player.vx = 0;

    player.x += player.vx;

    if (player.x < 0) player.x = 0;
    if (player.x + player.w > canvas.width) player.x = canvas.width - player.w;

    player.vy += gravity;
    player.y += player.vy;
    player.grounded = false;

    activeLevel.updateTroll();

    for (let plat of activeLevel.platforms) {
        if (
            player.x < plat.x + plat.w &&
            player.x + player.w > plat.x &&
            player.y + player.h > plat.y &&
            player.y + player.h - player.vy <= plat.y + 5
        ) {
            player.y = plat.y - player.h;
            player.vy = 0;
            player.grounded = true;
        }
    }

    if (player.y > canvas.height) {
        killPlayer();
    }

    for (let s of activeLevel.spikes) {
        if (
            player.x < s.x + s.w &&
            player.x + player.w > s.x &&
            player.y < s.y + s.h &&
            player.y + player.h > s.y
        ) {
            killPlayer();
        }
    }

    let d = activeLevel.door;
    if (
        player.x < d.x + d.w &&
        player.x + player.w > d.x &&
        player.y < d.y + d.h &&
        player.y + player.h > d.y
    ) {
        currentLevel++;
        loadLevel(currentLevel);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#5c3c10";
    for (let plat of activeLevel.platforms) {
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
    }

    ctx.fillStyle = "#1a1a1a";
    for (let s of activeLevel.spikes) {
        ctx.beginPath();
        ctx.moveTo(s.x, s.y + s.h);
        ctx.lineTo(s.x + s.w / 2, s.y);
        ctx.lineTo(s.x + s.w, s.y + s.h);
        ctx.closePath();
        ctx.fill();
    }

    let d = activeLevel.door;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.strokeRect(d.x, d.y, d.w, d.h);

    ctx.fillStyle = "#000000";
    ctx.fillRect(player.x, player.y, player.w, player.h);
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

const btnLeft = document.getElementById("btn-left");
const btnRight = document.getElementById("btn-right");
const btnJump = document.getElementById("btn-jump");

btnLeft.addEventListener("touchstart", (e) => { e.preventDefault(); keys.left = true; });
btnLeft.addEventListener("touchend", () => { keys.left = false; });
btnLeft.addEventListener("mousedown", () => { keys.left = true; });
btnLeft.addEventListener("mouseup", () => { keys.left = false; });

btnRight.addEventListener("touchstart", (e) => { e.preventDefault(); keys.right = true; });
btnRight.addEventListener("touchend", () => { keys.right = false; });
btnRight.addEventListener("mousedown", () => { keys.right = true; });
btnRight.addEventListener("mouseup", () => { keys.right = false; });

function triggerJump() {
    if (player.grounded) {
        player.vy = player.jumpPower;
        player.grounded = false;
    }
}

btnJump.addEventListener("touchstart", (e) => { e.preventDefault(); triggerJump(); });
btnJump.addEventListener("mousedown", triggerJump);

loadLevel(currentLevel);
gameLoop();
