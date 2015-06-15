/// <reference path="lib/types.ts" />
/// <reference path="scene.ts" />

interface BulletTrail {
    type: string;
    start: Vector2;
    finish: Vector2;
    age: number;
}

interface CollisionResult {
    position: Vector2;
}

function orderStickmenByDistanceFromPoint(stickmen: Stickman[], position: Vector2) {
    const stickmanDistances: [number, Stickman][] = [];

    // Find distance to each stickman
    for (const stickman of stickmen) {
        const stickmanPosition = stickman.getCentroid();
        const distance = (position[0] - stickmanPosition[0]) ^ 2 + (position[1] - stickmanPosition[1]) ^ 2;
        stickmanDistances.push([distance, stickman])
    }

    // Sort by distances
    stickmanDistances.sort(function([distance, stickman]) {
        return distance;
    })

    // Remove distances
    return stickmanDistances.map(function([distance, stickman]) {
        return stickman;
    });
}

class BulletEngine {
    private scene: Scene;
    private trails: BulletTrail[] = [];

    constructor(scene: Scene) {
        this.scene = scene;
    }

    raycastMap(map: Map, start: Vector2, end: Vector2): CollisionResult {
        return; // TODO
    }

    raycastPlayers(stickmen: Stickman[], start: Vector2, end: Vector2): CollisionResult {
        const stickmenOrdered = orderStickmenByDistanceFromPoint(stickmen, start);

        return; //TODO
    }

    shoot(type: string, position: Vector2, direction: number) {
        position = <Vector2>position.slice();

        // Find finish position
        let finishPosition = <Vector2>[
            position[0] + 1000 * Math.sin(direction),
            position[1] + 1000 * Math.cos(direction),
        ]

        // Raycast map
        const mapCollision = this.raycastMap(this.scene.map, position, finishPosition);

        if (mapCollision) {
            finishPosition = mapCollision.position;
        }

        // Raycast players
        const playerCollsion = this.raycastPlayers(this.scene.getStickmen(), position, finishPosition);

        if (playerCollsion) {
            finishPosition = playerCollsion.position;
        }

        // Add a trail for the bullet
        this.trails.push({
            type: type,
            start: position,
            finish: finishPosition,
            age: 0,
        })
    }

    tick(dt: number) {
        for (const trail of this.trails) {
            trail.age += dt;
        }
    }

    draw(context: Context2D, at: number) {
        context.save();
        for (const trail of this.trails) {
            if (trail.age < 0.2) {
                const progress = 1 - trail.age * 5;
                context.globalAlpha = progress;
                context.beginPath();
                context.moveTo(
                    trail.start[0] + (trail.finish[0] - trail.start[0]) * (1 - progress),
                    trail.start[1] + (trail.finish[1] - trail.start[1]) * (1 - progress)
                );
                context.lineTo(
                    trail.start[0] + (trail.finish[0] - trail.start[0]) * (1 - (progress - 0.3)),
                    trail.start[1] + (trail.finish[1] - trail.start[1]) * (1 - (progress - 0.3))
                );
                context.stroke();
            }
        }
        context.restore();
    }
}