import {Context2D} from "../lib/types";


export enum TrailType {
    Bullet,
}

interface Trail {
    type: TrailType;
    startX: number;
    startY: number;
    dirX: number;
    dirY: number;
    dist: number;
    age: number;
}

export default class TrailEngine {
    private trails: Trail[] = [];

    addTrail(type: TrailType, startX: number, startY: number, endX: number, endY: number) {
        // Get direction vector
        let dirX = endX - startX;
        let dirY = endY - startY;

        // Calculate distance to target
        const dist = Math.sqrt(dirX * dirX + dirY * dirY);

        // Normalise direction vector
        dirX /= dist;
        dirY /= dist;

        // Add trail
        this.trails.push({
            type: type,
            startX: startX,
            startY: startY,
            dirX: dirX,
            dirY: dirY,
            dist: dist,
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
            switch (trail.type) {
                case TrailType.Bullet:
                    if (trail.age < 0.1) {
                        const progress = trail.age * 10000;

                        if (progress < trail.dist) {
                            const endProgress = Math.min(progress + 500, trail.dist)

                            context.globalAlpha = 0.5 * (1 - progress / 1000);

                            context.beginPath();
                            context.moveTo(
                                trail.startX + trail.dirX * progress,
                                trail.startY + trail.dirY * progress
                            );
                            context.lineTo(
                                trail.startX + trail.dirX * endProgress,
                                trail.startY + trail.dirY * endProgress
                            );
                            context.stroke();
                        }
                    }
            }
        }
        context.restore();
    }
}
