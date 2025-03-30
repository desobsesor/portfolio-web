import { Injectable, ElementRef } from '@angular/core';

/**
 * Represents a star in the starry background
 */
interface Star {
    x: number;
    y: number;
    size: number;
    speed: number;
    brightness: number;
    twinkleSpeed: number;
    twinklePhase: number;
    type: 'normal' | 'cross';
    color: string;
}

/**
 * Represents a planet in the starry background
 */
interface Planet {
    x: number;
    y: number;
    size: number;
    color: string;
    atmosphereSize: number;
    atmosphereColor: string;
    rotationAngle: number;
    rotationSpeed: number;
    hasRings: boolean;
    ringsColor: string;
    ringsSize: number;
    surfaceDetails: Array<{ x: number, y: number, radius: number, color: string }>;
}

/**
 * Represents a space station in the starry background
 */
interface SpaceStation {
    x: number;
    y: number;
    scale: number;
    glowIntensity: number;
    glowPhase: number;
}

/**
 * Represents a shooting star in the starry background
 */
interface ShootingStar {
    x: number;
    y: number;
    length: number;
    speed: number;
    active: boolean;
}

/**
 * Service that creates and manages an animated starry background with stars, planets and a space station
 * Provides an immersive visual experience for the application background
 */
@Injectable({
    providedIn: 'root'
})
export class StarryBackgroundService {
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private stars: Star[] = [];
    private animationFrameId: number = 0;
    private readonly STAR_COUNT = 300;
    private readonly MIN_STAR_SIZE = 0.5;
    private readonly MAX_STAR_SIZE = 2.5;
    private readonly MIN_STAR_SPEED = 0.02;
    private readonly MAX_STAR_SPEED = 0.05;
    private readonly SHOOTING_STAR_COUNT = 2;
    private readonly PLANET_COUNT = 2;
    private readonly SPACE_STATION_SCALE = 0.5;
    private shootingStars: ShootingStar[] = [];
    private planets: Planet[] = [];
    private spaceStation: SpaceStation = { x: 0, y: 0, scale: 0, glowIntensity: 0, glowPhase: 0 };
    private mouseX: number = 0;
    private mouseY: number = 0;

    /**
     * Initializes the canvas and configures the starry background
     * @param canvasRef Reference to the HTML canvas element where the starry background will be drawn
     */
    initCanvas(canvasRef: ElementRef<HTMLCanvasElement>) {
        if (typeof window !== 'undefined') {
            this.canvas = canvasRef.nativeElement;
            this.ctx = this.canvas.getContext('2d')!;
            this.resizeCanvas();
            this.initStars();
            this.initShootingStars();
            this.initPlanets();
            this.initSpaceStation();
            this.startAnimation();

            window.addEventListener('resize', () => this.resizeCanvas());
            this.canvas.addEventListener('mousemove', (e) => {
                this.mouseX = e.clientX;
                this.mouseY = e.clientY;
            });
        }
    }

    /**
     * Resizes the canvas to fit the window size and updates the positions of the elements
     * @private
     */
    private resizeCanvas() {
        const oldWidth = this.canvas.width;
        const oldHeight = this.canvas.height;

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // If planets already exist, update their positions to maintain the proportion
        if (this.planets.length > 0) {
            // Fixed relative positions for each planet
            const positions = [
                { xRatio: 0.25, yRatio: 0.3 },
                { xRatio: 0.65, yRatio: 0.6 },
                { xRatio: 0.85, yRatio: 0.25 }
            ];

            // Update positions maintaining proportions
            for (let i = 0; i < this.planets.length; i++) {
                this.planets[i].x = this.canvas.width * positions[i].xRatio;
                this.planets[i].y = this.canvas.height * positions[i].yRatio;
            }
        }
    }

    /**
     * Initializes the array of stars with random properties
     * @private
     */
    private initStars() {
        this.stars = [];
        const starColors = ['#FFFFFF', '#E3E3FF', '#A1C4FD', '#8BB8FF', '#C2E9FB'];

        for (let i = 0; i < this.STAR_COUNT; i++) {
            // Randomly determine if the star will be normal or cross-shaped
            const starType = Math.random() < 0.2 ? 'cross' : 'normal';
            // Select a random color, with higher probability for white
            const colorIndex = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * starColors.length);

            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                size: Math.random() * (this.MAX_STAR_SIZE - this.MIN_STAR_SIZE) + this.MIN_STAR_SIZE,
                speed: Math.random() * (this.MAX_STAR_SPEED - this.MIN_STAR_SPEED) + this.MIN_STAR_SPEED,
                brightness: Math.random(),
                twinkleSpeed: 0.03 + Math.random() * 0.05,
                twinklePhase: Math.random() * Math.PI * 2,
                type: starType,
                color: starColors[colorIndex]
            });
        }
    }

    /**
     * Initializes the array of shooting stars
     * @private
     */
    private initShootingStars() {
        this.shootingStars = [];
        for (let i = 0; i < this.SHOOTING_STAR_COUNT; i++) {
            this.shootingStars.push(this.createShootingStar());
        }
    }

    /**
     * Creates a new shooting star with random properties
     * @returns A ShootingStar object with random properties
     * @private
     */
    private createShootingStar(): ShootingStar {
        return {
            x: Math.random() * this.canvas.width,
            y: 0,
            length: 50 + Math.random() * 50,
            speed: 5 + Math.random() * 10,
            active: false
        };
    }

    /**
     * Initializes the planets with their properties and surface details
     * @private
     */
    private initPlanets() {
        // Fixed colors for each planet
        const planetColors = ['#A1C4FD', '#4A6FD4', '#3B5998'];
        const atmosphereColors = ['rgba(161,196,253,0.2)', 'rgba(74,111,212,0.2)', 'rgba(59,89,152,0.2)'];

        // Fixed positions for each planet (proportional to canvas size)
        const positions = [
            { xRatio: 0.25, yRatio: 0.3 },
            { xRatio: 0.65, yRatio: 0.6 },
            { xRatio: 0.85, yRatio: 0.25 }
        ];

        for (let i = 0; i < this.PLANET_COUNT; i++) {
            // Create random surface details for each planet
            const surfaceDetails = [];
            const detailCount = 3 + Math.floor(Math.random() * 5); // 3-7 details

            for (let j = 0; j < detailCount; j++) {
                const radius = 5 + Math.random() * 15;
                surfaceDetails.push({
                    x: (Math.random() - 0.5) * 0.8, // Relative position (-0.4 to 0.4)
                    y: (Math.random() - 0.5) * 0.3,
                    radius: radius,
                    color: `${planetColors[i]}${Math.floor(Math.random() * 40 + 20).toString(16)}` // Variation of the main color
                });
            }

            // Determine if the planet has rings (only the second planet)
            const hasRings = i === 1;

            this.planets.push({
                x: this.canvas.width * positions[i].xRatio,
                y: (this.canvas.height * positions[i].yRatio) - 150,
                size: 40 + i * 15, // Different sizes for each planet
                color: planetColors[i],
                atmosphereSize: 1.3 + i * 0.8,
                atmosphereColor: atmosphereColors[i],
                rotationAngle: Math.random() * Math.PI * 3,
                rotationSpeed: 0.0005 + i * 0.0003,
                hasRings: hasRings,
                ringsColor: '#F9D423',
                ringsSize: 1.8,
                surfaceDetails: surfaceDetails
            });
        }
    }

    /**
     * Initializes the space station with its position and properties
     * @private
     */
    private initSpaceStation() {
        this.spaceStation = {
            x: this.canvas.width * 0.55,
            y: this.canvas.height * 0.2,
            scale: this.SPACE_STATION_SCALE,
            glowIntensity: 0,
            glowPhase: 0
        };
    }

    /**
     * Draws the space station with glow effects and energy rings
     * @private
     */
    private drawSpaceStation() {
        const { x, y, scale, glowIntensity } = this.spaceStation;

        this.ctx.save();
        this.ctx.translate(x + 300, y - 40);
        this.ctx.scale(scale, scale);

        // Glow effect
        const gradient = this.ctx.createRadialGradient(0, 0, 20, 0, 0, 100);
        gradient.addColorStop(0, `rgba(0, 255, 255, ${0.2 + glowIntensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-100, -100, 200, 200);

        // Main structure
        this.ctx.fillStyle = '#2C3E50';
        this.ctx.beginPath();
        this.ctx.moveTo(-40, -20);
        this.ctx.lineTo(40, -20);
        this.ctx.lineTo(60, 0);
        this.ctx.lineTo(40, 20);
        this.ctx.lineTo(-40, 20);
        this.ctx.lineTo(-60, 0);
        this.ctx.closePath();
        this.ctx.fill();

        // Energy rings
        this.ctx.strokeStyle = `rgba(0, 255, 255, ${0.5 + glowIntensity * 0.5})`;
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 2; i++) {
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 30 + i * 10, 0, Math.PI * 2);
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    /**
     * Updates and draws the planets, including atmospheres, rings and surface details
     * @private
     */
    private updateAndDrawPlanets() {
        this.planets.forEach(planet => {
            planet.rotationAngle += planet.rotationSpeed;

            // Draw atmosphere
            const gradient = this.ctx.createRadialGradient(
                planet.x, planet.y, planet.size,
                planet.x, planet.y, planet.size * planet.atmosphereSize
            );
            gradient.addColorStop(0, planet.atmosphereColor);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size * planet.atmosphereSize, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw rings if the planet has them (before the planet so they appear behind)
            if (planet.hasRings) {
                this.ctx.save();
                this.ctx.translate(planet.x, planet.y);

                // Apply a rotation to give perspective to the rings
                this.ctx.rotate(Math.PI / 6);

                // Create gradient for the rings
                const ringGradient = this.ctx.createLinearGradient(
                    -planet.size * planet.ringsSize, 0,
                    planet.size * planet.ringsSize, 0
                );
                ringGradient.addColorStop(0, 'rgba(249, 212, 35, 0.1)');
                ringGradient.addColorStop(0.4, 'rgba(245, 219, 92, 0.5)');
                ringGradient.addColorStop(0.6, 'rgba(249, 212, 35, 0.5)');
                ringGradient.addColorStop(1, 'rgba(249, 212, 35, 0.1)');

                // Draw ellipse for the rings
                this.ctx.beginPath();
                //this.ctx.ellipse(0, 0, planet.size * planet.ringsSize, planet.size * 0.3, 0, 0, Math.PI * 2);
                this.ctx.strokeStyle = ringGradient;
                this.ctx.lineWidth = planet.size * 0.2;
                this.ctx.stroke();

                this.ctx.restore();
            }

            // Create gradient for the planet to give lighting effect
            const planetGradient = this.ctx.createRadialGradient(
                planet.x - planet.size * 0.3, planet.y - planet.size * 0.3, 0,
                planet.x, planet.y, planet.size
            );
            planetGradient.addColorStop(0, planet.color);
            planetGradient.addColorStop(1, this.adjustColor(planet.color, -30)); // Darker color at the edges

            // Draw planet
            this.ctx.fillStyle = planetGradient;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.size, 0, Math.PI * 2);
            this.ctx.fill();

            // Add a subtle border to give more depth
            this.ctx.strokeStyle = this.adjustColor(planet.color, -50);
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Draw surface details
            this.ctx.save();
            this.ctx.translate(planet.x, planet.y);
            this.ctx.rotate(planet.rotationAngle);

            // Draw each surface detail
            planet.surfaceDetails.forEach(detail => {
                this.ctx.beginPath();
                this.ctx.arc(
                    detail.x * planet.size,
                    detail.y * planet.size,
                    detail.radius,
                    0, Math.PI * 2
                );
                this.ctx.fillStyle = detail.color;
                this.ctx.fill();
            });

            this.ctx.restore();
        });
    }

    /**
     * Starts the animation loop that updates and draws all elements of the starry background
     * @private
     */
    private startAnimation() {
        const animate = () => {
            // Crear un degradado de fondo con tonalidades azules profundas
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, 'rgba(8, 15, 40, 0.1)');
            gradient.addColorStop(0.5, 'rgba(17, 24, 60, 0.1)');
            gradient.addColorStop(1, 'rgba(26, 33, 66, 0.1)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.updateAndDrawPlanets();
            this.updateAndDrawStars();
            this.updateAndDrawShootingStars();

            // Update space station glow
            this.spaceStation.glowPhase += 0.08;
            this.spaceStation.glowIntensity = (Math.sin(this.spaceStation.glowPhase) + 1) * 0.7;
            this.drawSpaceStation();

            this.animationFrameId = requestAnimationFrame(animate);
        };

        animate();
    }

    /**
     * Updates and draws the stars, including twinkling effects and response to mouse movement
     * @private
     */
    private updateAndDrawStars() {
        this.stars.forEach(star => {
            star.twinklePhase += star.twinkleSpeed;
            const twinkle = Math.sin(star.twinklePhase) * 0.3;
            const distanceToMouse = Math.hypot(this.mouseX - star.x, this.mouseY - star.y);
            const mouseInfluence = Math.max(0, 1 - distanceToMouse / 100) * 0.2;
            const opacity = 0.3 + (star.brightness + twinkle + mouseInfluence) * 0.7;

            // Extract RGB components from the star color
            let r = 255, g = 255, b = 255;
            if (star.color !== '#FFFFFF') {
                const hex = star.color.substring(1);
                r = parseInt(hex.substring(0, 2), 16);
                g = parseInt(hex.substring(2, 4), 16);
                b = parseInt(hex.substring(4, 6), 16);
            }

            if (star.type === 'normal') {
                // Draw normal star (circle)
                this.ctx.beginPath();
                this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                this.ctx.fill();
            } else {
                // Draw star with multiple spikes of variable length
                const size = star.size * 4;
                const baseOuterRadius = size / 2;
                const baseInnerRadius = baseOuterRadius * 0.3; // Inner radius for the spikes
                const spikes = 8; // Number of star spikes

                this.ctx.save();
                this.ctx.translate(star.x, star.y);

                // Draw the star with multiple spikes
                this.ctx.beginPath();

                // Create variations for each spike
                const outerRadiusVariations = [];
                const innerRadiusVariations = [];
                const angleVariations = [];

                // Generate random variations for each spike with much more pronounced differences
                for (let i = 0; i < spikes; i++) {
                    // Dramatically increased length variation for outer spikes (some much longer than others)
                    // Use exponential distribution to create more extreme variations
                    const lengthMultiplier = Math.random() < 0.3 ?
                        (1.5 + Math.random() * 1.5) : // 30% chance of very long spike (1.5-3x)
                        (0.6 + Math.random() * 0.8);  // 70% chance of normal/shorter spike (0.6-1.4x)

                    outerRadiusVariations.push(baseOuterRadius * lengthMultiplier);

                    // More dramatic variation for inner spikes
                    innerRadiusVariations.push(baseInnerRadius * (0.4 + Math.random() * 0.9));

                    // Larger angle variations to break symmetry more significantly
                    angleVariations.push(Math.random() * 0.5 - 0.25);
                }

                // Starting point with slight offset for asymmetry
                const startAngle = -Math.PI / 2 + (Math.random() * 0.3 - 0.15); // Start from near the top with slight variation
                this.ctx.moveTo(
                    Math.cos(startAngle) * outerRadiusVariations[0],
                    Math.sin(startAngle) * outerRadiusVariations[0]
                );

                for (let i = 0; i < spikes; i++) {
                    // Angle for the outer spike with more significant variation
                    const outerAngle = startAngle + (Math.PI * 2 * i) / spikes + angleVariations[i];

                    // Angle for the inner point with more variation
                    // Sometimes make inner points closer to the next spike for asymmetry
                    const innerAngleOffset = Math.random() < 0.3 ?
                        Math.PI / spikes * (0.5 + Math.random() * 0.8) : // 30% chance of offset position
                        Math.PI / spikes + angleVariations[(i + 1) % spikes] / 2;

                    const innerAngle = outerAngle + innerAngleOffset;

                    // Add slight curve to some lines for more natural look
                    if (Math.random() < 0.4) {
                        // Create a control point for a quadratic curve
                        const controlX = Math.cos(outerAngle + innerAngleOffset / 2) *
                            (innerRadiusVariations[i] + outerRadiusVariations[i]) / 2 *
                            (0.7 + Math.random() * 0.6);
                        const controlY = Math.sin(outerAngle + innerAngleOffset / 2) *
                            (innerRadiusVariations[i] + outerRadiusVariations[i]) / 2 *
                            (0.7 + Math.random() * 0.6);

                        // Draw curved line to inner point
                        this.ctx.quadraticCurveTo(
                            controlX,
                            controlY,
                            Math.cos(innerAngle) * innerRadiusVariations[i],
                            Math.sin(innerAngle) * innerRadiusVariations[i]
                        );
                    } else {
                        // Draw straight line to inner point
                        this.ctx.lineTo(
                            Math.cos(innerAngle) * innerRadiusVariations[i],
                            Math.sin(innerAngle) * innerRadiusVariations[i]
                        );
                    }

                    // Draw line to the next outer point
                    const nextI = (i + 1) % spikes;
                    const nextOuterAngle = startAngle + (Math.PI * 2 * nextI) / spikes + angleVariations[nextI];

                    // Sometimes add curve to the outer points too
                    if (Math.random() < 0.3) {
                        const controlX = Math.cos(innerAngle + (nextOuterAngle - innerAngle) / 2) *
                            (outerRadiusVariations[nextI] + innerRadiusVariations[i]) / 2 *
                            (0.8 + Math.random() * 0.4);
                        const controlY = Math.sin(innerAngle + (nextOuterAngle - innerAngle) / 2) *
                            (outerRadiusVariations[nextI] + innerRadiusVariations[i]) / 2 *
                            (0.8 + Math.random() * 0.4);

                        this.ctx.quadraticCurveTo(
                            controlX,
                            controlY,
                            Math.cos(nextOuterAngle) * outerRadiusVariations[nextI],
                            Math.sin(nextOuterAngle) * outerRadiusVariations[nextI]
                        );
                    } else {
                        this.ctx.lineTo(
                            Math.cos(nextOuterAngle) * outerRadiusVariations[nextI],
                            Math.sin(nextOuterAngle) * outerRadiusVariations[nextI]
                        );
                    }
                }

                this.ctx.closePath();
                this.ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
                this.ctx.lineWidth = star.size * 0.3;
                this.ctx.stroke();
                this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity * 0.7})`;
                this.ctx.fill();

                // Add a more intense and variable center glow for more brightness
                this.ctx.beginPath();
                // Variable size center based on star brightness
                const centerSize = star.size * (0.4 + Math.random() * 0.3 + twinkle * 0.4);
                this.ctx.arc(0, 0, centerSize, 0, Math.PI * 2);
                // More intense center with slight color variation
                const centerOpacity = Math.min(1, opacity * 1.3);
                this.ctx.fillStyle = `rgba(${r + 15}, ${g + 15}, ${b + 15}, ${centerOpacity})`;
                this.ctx.fill();

                // Add a subtle outer glow for some stars
                if (Math.random() < 0.6) {
                    const glowGradient = this.ctx.createRadialGradient(
                        0, 0, centerSize,
                        0, 0, star.size * 2
                    );
                    glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${opacity * 0.5})`);
                    glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    this.ctx.fillStyle = glowGradient;
                    this.ctx.fill();
                }

                this.ctx.restore();
            }

            star.y = (star.y + star.speed) % this.canvas.height;
        });
    }

    /**
     * Updates and draws the shooting stars, activating them randomly
     * @private
     */
    private updateAndDrawShootingStars() {
        this.shootingStars.forEach(star => {
            if (!star.active && Math.random() < 0.005) {
                star.active = true;
                star.x = Math.random() * this.canvas.width;
                star.y = 0;
            }

            if (star.active) {
                this.ctx.beginPath();
                this.ctx.moveTo(star.x, star.y);
                this.ctx.lineTo(star.x - star.length, star.y - star.length);
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
                this.ctx.lineWidth = 2;
                this.ctx.stroke();

                star.x += star.speed;
                star.y += star.speed;

                if (star.y > this.canvas.height || star.x > this.canvas.width) {
                    star.active = false;
                    Object.assign(star, this.createShootingStar());
                }
            }
        });
    }

    /**
     * Stops the animation and frees resources when the component is destroyed
     */
    destroy() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    /**
     * Adjusts the brightness of a hexadecimal color
     * @param color Color in hexadecimal format (#RRGGBB)
     * @param amount Amount of adjustment (-255 to 255)
     * @returns Adjusted color in hexadecimal format
     */
    private adjustColor(color: string, amount: number): string {
        // Remove the # if it exists
        color = color.replace('#', '');

        // Convert to RGB values
        let r = parseInt(color.substring(0, 2), 16);
        let g = parseInt(color.substring(2, 4), 16);
        let b = parseInt(color.substring(4, 6), 16);

        // Adjust each component
        r = Math.max(0, Math.min(255, r + amount));
        g = Math.max(0, Math.min(255, g + amount));
        b = Math.max(0, Math.min(255, b + amount));

        // Convert back to hexadecimal
        const rHex = r.toString(16).padStart(2, '0');
        const gHex = g.toString(16).padStart(2, '0');
        const bHex = b.toString(16).padStart(2, '0');

        return `#${rHex}${gHex}${bHex}`;
    }
}