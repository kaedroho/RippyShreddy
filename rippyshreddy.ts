type Context2D = CanvasRenderingContext2D;
type Vector2 = [number, number];

interface Input {
    move: number;
    jump: boolean;
    duck: boolean;
}

interface Player {
    input: Input;
    getDisplayName(): string;
}

class AIPlayer implements Player {
    input: Input;

    getDisplayName() {
        return "John";
    }
}

class LocalPlayer implements Player {
    input: Input;

    constructor() {
        this.input = {
            move: 0,
            jump: false,
            duck: false,
        }
    }

    setInput(input: Input) {
        if ('move' in input) {
            this.input.move = input.move;
        }
        if ('jump' in input) {
            this.input.jump = input.jump;
        }
        if ('duck' in input) {
            this.input.duck = input.duck;
        }
    }

    getDisplayName() {
        return "Bob";
    }
}


class Camera {
    private posX: number;
    private posY: number;
    private posZ: number;

    private velX: number;
    private velY: number;
    private velZ: number;

    private targetX: number;
    private targetY: number;
    private targetZ: number;

    constructor(x: number, y: number, z: number) {
        this.posX = x;
        this.posY = y;
        this.posZ = z;
        this.velX = 0;
        this.velY = 0;
        this.velZ = 0;
        this.targetX = null;
        this.targetY = null;
        this.targetZ = null;
    }

    setPosition(x: number, y: number, z: number) {
        this.posX = x;
        this.posY = y;
        this.posZ = z;
        this.velX = 0;
        this.velY = 0;
        this.velZ = 0;
        this.targetX = null;
        this.targetY = null;
        this.targetZ = null;
    }

    moveTo(x: number, y: number, z: number) {
        this.targetX = x;
        this.targetY = y;
        this.targetZ = z;
    }

    private updateAxisVelocity(pos: number, vel: number, target: number, dt: number): number {
        return (target) ? (target - pos) * 10 : 0;
    }

    update(dt: number) {
        this.velX = this.updateAxisVelocity(this.posX, this.velX, this.targetX, dt);
        this.velY = this.updateAxisVelocity(this.posY, this.velY, this.targetY, dt);
        this.velZ = this.updateAxisVelocity(this.posZ, this.velZ, this.targetZ, dt);

        this.posX += this.velX * dt;
        this.posY += this.velY * dt;
        this.posZ += this.velZ * dt;
    }

    transformContext(context: Context2D, at: number) {
        const posX = this.posX + this.velX * at;
        const posY = this.posY + this.velY * at;
        const posZ = this.posZ + this.velZ * at;

        context.translate(512, 512);

        const scale = 1 / (posZ / 1024);
        context.scale(scale, scale);

        context.translate(-posX, -posY);
    }
}

function calculateJoint(p1: Vector2, p2: Vector2, length: number, invert: number): Vector2 {
    // Work out middle
    const midX = (p1[0] + p2[0]) / 2;
    const midY = (p1[1] + p2[1]) / 2;

    // Work out distance to middle
    const midDistX = midX - p1[0];
    const midDistY = midY - p1[1];

    // Work out position    
    const angle = Math.atan2(midDistY, midDistX);
    const distSquared = midDistX * midDistX + midDistY * midDistY;
    const jointHeight = Math.sqrt(Math.abs(length * length - distSquared));
    const jointAngle = angle + Math.atan2(jointHeight, Math.sqrt(distSquared)) * invert;
    const pos = <Vector2>[0, 0];
    pos[0] = p1[0] + length * Math.cos(jointAngle);
    pos[1] = p1[1] + length * Math.sin(jointAngle);

    return pos;
};

class Stickman {
    private posX: number;
    private posY: number;
    private velX: number;
    private velY: number;
    public player: Player;

    private movePhase: number;
    private duckTransition: number;

    constructor(player: Player) {
        this.posX = 0;
        this.posY = 0;
        this.velX = 0;
        this.velY = 0;
        this.player = player;
        this.movePhase = 0;
        this.duckTransition = 0;
    }

    tick(dt: number) {
        // Ducking

        const ducking = this.player.input.duck;
        const duckDistanceLeft = Math.abs((ducking ? 1 : 0) - this.duckTransition);
        const duckSpeed = duckDistanceLeft * dt * 10;

        // Update duck transition
        if (ducking) {
            this.duckTransition += duckSpeed;
        } else {
            this.duckTransition -= duckSpeed;
        }

        if (this.duckTransition < 0) {
            // Ducking
            this.duckTransition = 0;
        } else if (this.duckTransition > 1) {
            // Standing
            this.duckTransition = 1;
        }

        // Position

        this.velX = this.player.input.move / (1 + this.duckTransition) * 450;
        this.velY += dt * 2000;
        this.posX += this.velX * dt;
        this.posY += this.velY * dt;

        if (this.posY > 300) {
            this.posY = 300;
            if (this.velY > 0) {
                this.velY = 0;
            }

            if (this.player.input.jump) {
                this.velY -= 1400;
            }
        }
        
        // Move phase

        if (this.player.input.move) {
            this.movePhase += dt * 15;
        } else {
            this.movePhase = 0;
        }
    }

    draw(context: Context2D, at: number) {
        const duckTransition = this.duckTransition;
        const neckHeight = 100 - 25 * duckTransition;
        const hipHeight = 75 - 25 * duckTransition;
        const legHeight = 40;

        const hipPositionX = 0;
        const hipPositionY = -hipHeight;

        const neckPositionX = hipPositionX;
        const neckPositionY = hipPositionY - neckHeight;

        // TODO: Add recoil to neck position

        const middlePositionX = (hipPositionX + neckPositionX) / 2;
        const middlePositionY = (hipPositionY + neckPositionY) / 2;

        let leftFootPositionX = -20;
        let leftFootPositionY = 0;
        let rightFootPositionX = 20;
        let rightFootPositionY = 0;

        const movingLeft = this.player.input.move < 0;
        const movingRight = this.player.input.move > 0;
        const moving = movingLeft || movingRight
        const running = 1;

        if (this.player.input.move != 0) {
            const movePhase = this.movePhase + at * 15;

            leftFootPositionX = Math.sin(-this.movePhase) * hipPositionY / 2;
            rightFootPositionX = Math.sin(-this.movePhase + Math.PI) * hipPositionY / 2;

            leftFootPositionY = Math.cos(-this.movePhase) * hipPositionY / 4 + (hipPositionY / 8) * running;
            rightFootPositionY = Math.cos(-this.movePhase + Math.PI) * hipPositionY / 4 + (hipPositionY / 8) * running;
        }

        // Knees

        // Work out knee inversion
        const leftKneeInversion = moving ? -1: 1;
        const rightKneeInversion = -1;

        // Work out knee positions
        let [leftKneePositionX, leftKneePositionY] = calculateJoint(
            [hipPositionX, hipPositionY],
            [leftFootPositionX, leftFootPositionY],
            legHeight, leftKneeInversion);
        let [rightKneePositionX, rightKneePositionY] = calculateJoint(
            [hipPositionX, hipPositionY],
            [rightFootPositionX, rightFootPositionY],
            legHeight, rightKneeInversion);

        if (movingLeft) {
            // Reverse leg direction
            leftFootPositionX = -leftFootPositionX;
            rightFootPositionX = -rightFootPositionX;
            leftKneePositionX = -leftKneePositionX;
            rightKneePositionX = -rightKneePositionX;
        }

        context.save();
        context.translate(this.posX + this.velX * at, this.posY + this.velY * at);

        context.lineWidth = 10;
        context.lineJoin = 'round';
        context.lineCap = 'round';
 
        context.beginPath();
        context.moveTo(leftFootPositionX, leftFootPositionY);
        context.lineTo(leftKneePositionX, leftKneePositionY);
        context.lineTo(hipPositionX, hipPositionY);

        context.moveTo(rightFootPositionX, rightFootPositionY);
        context.lineTo(rightKneePositionX, rightKneePositionY);
        context.lineTo(hipPositionX, hipPositionY);

        context.moveTo(neckPositionX, neckPositionY);
        context.lineTo(hipPositionX, hipPositionY);

        context.stroke();

        context.restore();
    }

    getPosition(): [number, number] {
        return [this.posX, this.posY]
    }
}

class PlayerState {
    public kills: number;
    public deaths: number;
    public respawnTimer: number
    public stickman: Stickman;

    isInGame() {
        return this.stickman != null;
    }

    getScore() {
        return this.kills * 100;
    }
}

class Map {
    private tiles: Uint8Array;

    constructor(private sizeX: number, private sizeY: number) {
        this.tiles = new Uint8Array(sizeX * sizeY);
    }

    setTile(x: number, y: number, value: number) {
        this.tiles[y * this.sizeX + x] = value;
    }

    getTile(x: number, y: number): number {
        return this.tiles[y * this.sizeX + x];
    }

    fillArea(x: number, y: number, width: number, height: number, value: number) {
        for (let i = 0; i < width; i++) {
            for (let  j = 0; j < height; j++) {
                this.setTile(x+i, y+j, value);
            }
        }
    }

    draw(context: Context2D) {
        for (let i = 0; i < this.sizeX; i++) {
            for (let j = 0; j < this.sizeY; j++) {
                const value = this.getTile(i, j);

                if (value) {
                    context.fillRect(i * 64, j * 64, 64, 64);
                }
            }
        }
    }
}

class Scene {
    private players: [Player, PlayerState][];

    constructor(private map: Map) {
        this.players = [];
    }

    private getStickmen(): Stickman[] {
        const stickmen: Stickman[] = [];

        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            if (player[1].stickman) {
                stickmen.push(player[1].stickman);
            }
        }

        return stickmen;
    }

    addPlayer(player: Player) {
        this.players.push([player, new PlayerState()]);
    }

    getPlayerState(player: Player): PlayerState {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i][0] === player) {
                return this.players[i][1];
            }
        }
    }

    getStickman(player: Player): Stickman {
        const playerState = this.getPlayerState(player);

        if (playerState) {
            return playerState.stickman;
        }
    }

    spawnPlayer(player: Player, timer: number = 0) {
        const playerState = this.getPlayerState(player);

        if (playerState) {
            playerState.respawnTimer = timer;
        }
    }

    leaderBoard(): [Player, PlayerState][] {
        return [];
    }

    draw(context: Context2D, at: number) {
        this.map.draw(context);

        this.getStickmen().forEach(function(stickman) {
            stickman.draw(context, at);
        })
    }

    tick(dt: number) {
        this.players.forEach(function(p) {
            const player = p[0];
            const playerState = p[1];

            if (!playerState.isInGame() && playerState.respawnTimer != null) {
                playerState.respawnTimer -= dt;

                if (playerState.respawnTimer <= 0) {
                    playerState.stickman = new Stickman(player);
                    playerState.respawnTimer = null;
                }
            }
        });

        this.getStickmen().forEach(function(stickman) {
            stickman.tick(dt);
        })
    }
}

function constructFortMap() {
    const map = new Map(100, 100);

    // Right fort
    map.fillArea(35, 13, 8, 1, 1);
    map.fillArea(35, 0, 1, 13, 1);
    map.fillArea(35, 0, 20, 1, 1);
    map.fillArea(55, 0, 1, 22, 1);
    map.fillArea(35, 22, 21, 1, 1);
    map.fillArea(50, 16, 5, 6, 1);

    // Left fort
    map.fillArea(13, 13, 8, 1, 1);
    map.fillArea(20, 0, 1, 13, 1);
    map.fillArea(0, 0, 20, 1, 1);
    map.fillArea(0, 0, 1, 22, 1);
    map.fillArea(0, 22, 21, 1, 1);
    map.fillArea(1, 16, 5, 6, 1);

    // Middle
    map.fillArea(21, 22, 14, 1, 1);

    return map;
}

function startGame(element: HTMLCanvasElement): void {
    const context = <Context2D>element.getContext('2d');

    const map = constructFortMap();
    const scene = new Scene(map);
    const human = new LocalPlayer();
    const camera = new Camera(0, 0, 2000);

    scene.addPlayer(human);
    scene.spawnPlayer(human);

    let lastFrame = Date.now();
    let lastTick = Date.now();

    function frame() {
        const time = Date.now();
        const dt = (time - lastFrame) / 1000;
        const at = (time - lastTick) / 1000;
        lastFrame = time;

        context.clearRect(0, 0, 1024, 768);

        const stickman = scene.getStickman(human);
        if (stickman) {
            const position = stickman.getPosition();
            camera.moveTo(position[0], position[1], 2400);
        }

        context.save();
        camera.transformContext(context, at);

        scene.draw(context, at);

        context.restore();

        requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    function tick() {
        lastTick = Date.now();

        camera.update(0.03);
        scene.tick(0.03);
    }

    setInterval(tick, 30);

    let moveLeft = false;
    let moveRight = false;
    let jump = false;
    let duck = false;

    function refreshInput() {
        let move = 0;
        if (moveRight) move++;
        if (moveLeft) move--;

        human.setInput({
            move: move,
            jump: jump,
            duck: duck,
        });
    }

    document.body.onkeydown = function(event) {
        if (event.keyCode === 37) {
            moveLeft = true;
        } else if (event.keyCode === 39) {
            moveRight = true;
        } else if (event.keyCode == 38) {
            jump = true;
        } else if (event.keyCode == 40) {
            duck = true;
        } else {
            return;
        }

        refreshInput();
        event.preventDefault();
        return false;
    };

    document.body.onkeyup = function(event) {
        if (event.keyCode === 37) {
            moveLeft = false;
        } else if (event.keyCode === 39) {
            moveRight = false;
        } else if (event.keyCode == 38) {
            jump = false;
        } else if (event.keyCode == 40) {
            duck = false;
        } else {
            return;
        }

        refreshInput();
        event.preventDefault();
        return false;
    };
}