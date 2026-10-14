import { ElementRef, Injectable } from '@angular/core';

/**
 * A small debris fragment produced when the falling text disintegrates at the footer line.
 */
interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    char: string;
}

/** Una tecnología que está cayendo y que el jugador puede reventar con el teclado. */
export interface PalabraEnVuelo {
    /** Carril al que pertenece, que es lo que se le pasa a destruirPalabra(). */
    indice: number;
    palabra: string;
    x: number;
    y: number;
    tamano: number;
}

/**
 * Service that renders a "Matrix" style digital rain made of the project's technology
 * stack (skills) instead of random glyphs. Each lane falls at the same, slow speed while
 * varying font size and opacity to convey depth (near vs. far lines). When a lane reaches
 * the footer line, its text disintegrates into particles.
 */
@Injectable({
    providedIn: 'root'
})
export class MatrixRainService {
    private canvas!: HTMLCanvasElement;
    private ctx!: CanvasRenderingContext2D;
    private animationFrameId = 0;
    private resizeHandler?: () => void;

    private width = 0;
    private height = 0;
    private disintegrateY = 0;

    private laneX: number[] = [];
    private yPos: number[] = [];
    private drawAtY: number[] = [];
    private words: string[] = [];
    private isWord: boolean[] = [];
    private fontSizes: number[] = [];
    private alphas: number[] = [];
    private laneColor: string[] = [];
    private wordLen: number[] = [];
    /** Current fall speed per lane (px/s); grows with gravity while it falls. */
    private velocities: number[] = [];
    /** Terminal speed per lane (px/s), fixed by its text size. */
    private terminalSpeeds: number[] = [];

    private particles: Particle[] = [];

    private lastTime = 0;
    private reduceMotion = false;

    /** Footer element that receives the impact tremor on its top border. */
    private footerEl: HTMLElement | null = null;
    private lastImpactTime = 0;
    private impactResetTimer?: ReturnType<typeof setTimeout>;
    /** Minimum gap between two impacts, so simultaneous hits read as a single tremor. */
    private readonly IMPACT_COOLDOWN = 90;
    /** How long the footer keeps the impact class (must match the CSS animation). */
    private readonly IMPACT_DURATION = 800;

    private readonly LANE_WIDTH = 46;
    private readonly MIN_FONT = 12;
    private readonly MAX_FONT = 30;
    /** Initial fall speed range (px/s): large text starts fast, small text drifts. */
    private readonly MIN_SPEED = 28;
    private readonly MAX_SPEED = 100;
    /** Gravity (px/s^2): every lane keeps accelerating while it falls. */
    private readonly GRAVITY = 24;
    /**
     * Terminal velocity range (px/s), also tied to the text size. Keeping it size-based
     * (instead of a single shared cap) is what preserves the speed difference between a
     * big technology word and a small glyph once both are done accelerating.
     */
    private readonly MIN_TERMINAL_SPEED = 70;
    private readonly MAX_TERMINAL_SPEED = 210;

    /**
     * Escalera de velocidad. El primer nivel es el más lento y su tope es el máximo que
     * se espera en esa primera etapa; a partir de ahí cada nivel multiplica la caída,
     * de modo que la velocidad que había antes queda como un nivel intermedio.
     */
    private readonly NIVEL_FACTOR_BASE = 0.72;
    private readonly NIVEL_FACTOR_PASO = 1.22;
    private readonly NIVEL_MAXIMO = 5;
    /** Un nivel dura lo que tarda un carril en cruzar la pantalla 2.5 veces a su tope. */
    private readonly NIVEL_CRUCES = 2.5;
    private readonly NIVEL_MIN_MS = 20_000;
    /** Nivel actual (1 = el más lento) y milisegundos acumulados dentro de él. */
    private nivel = 1;
    private tiempoNivelMs = 0;
    /** Explosion scale range for the footer impact, tied to the text size. */
    private readonly MIN_IMPACT_SCALE = 0.7;
    private readonly MAX_IMPACT_SCALE = 1.6;
    /** Share of lanes that show a full, readable technology word instead of glyphs. */
    private readonly WORD_LANE_RATIO = 0.35;
    private readonly MAX_PARTICLES = 500;

    /** How many cells of soft trail to keep behind the text before cleaning it away. */
    private readonly TRAIL_CELLS = 3;
    private readonly FADE = 'rgba(24, 24, 36, 0.35)';
    private readonly CANVAS_COLOR = '#181824';
    private readonly HEAD_COLOR = '#f2f3ff';
    private readonly PARTICLE_COLOR = '#ff7a63';
    private readonly GLOW = 'rgba(255, 122, 99, 0.45)';
    /** Soft per-lane body colors (aubergine + coral family) so the text reads full of color. */
    private readonly RAIN_COLORS = ['#a6ace6', '#ff9f88', '#cdd2ff', '#ffb3a0', '#8f95d6', '#e0e2ff'];
    private readonly FONT_STACK = '"Inter", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    /** Classic Matrix glyphs for the rain lanes. */
    private readonly CHARSET =
        'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789:=<>*+';

    /** Technologies shown in the "Skills" section, plus related stack keywords. */
    private readonly WORDS = [
        // Lenguajes
        'TypeScript', 'JavaScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust',
        'Kotlin', 'Swift', 'PHP', 'Ruby', 'Scala', 'Dart', 'Elixir', 'Perl', 'R',
        'MATLAB', 'Lua', 'Groovy', 'VB.NET', 'COBOL', 'Haskell', 'Clojure', 'F#',
        'Objective-C', 'Bash', 'PowerShell', 'Assembly', 'Solidity', 'Zig',
        // Frontend
        'React', 'Angular', 'Vue', 'Svelte', 'NextJS', 'Nuxt', 'Remix', 'Astro',
        'SolidJS', 'Qwik', 'Redux', 'RxJS', 'Zustand', 'NgRx', 'HTML', 'CSS',
        'SCSS', 'SASS', 'LESS', 'Tailwind', 'Bootstrap', 'Material UI', 'Chakra UI',
        'Shadcn', 'Vite', 'Webpack', 'Rollup', 'esbuild', 'Babel', 'Storybook',
        'Three.js', 'D3.js', 'Chart.js', 'WebGL', 'PWA', 'WebSockets', 'GraphQL',
        'REST', 'gRPC', 'Apollo', 'React Query', 'Micro Frontends', 'SSR', 'SEO',
        'Accesibilidad', 'Design System',
        // Backend
        'NodeJS', 'NestJS', 'Express', 'Fastify', 'Koa', 'Django', 'Flask',
        'FastAPI', 'Spring', 'Spring Boot', 'Quarkus', 'Micronaut', '.Net',
        'ASP.NET', 'Blazor', 'Laravel', 'Symfony', 'Rails', 'Gin', 'Fiber', 'Echo',
        'Jakarta EE', 'Kafka', 'RabbitMQ', 'Celery', 'BullMQ', 'OpenAPI', 'Swagger',
        'OAuth2', 'JWT', 'Keycloak', 'SignalR', 'Hangfire', 'WebForms', 'Ext.NET',
        'Razor', 'Microservicios', 'APIs REST',
        // Datos
        'SQL', 'MySQL', 'PostgreSQL', 'Oracle', 'SQL Server', 'MongoDB', 'Redis',
        'Cassandra', 'DynamoDB', 'Elasticsearch', 'Neo4j', 'SQLite', 'MariaDB',
        'Firebase', 'Supabase', 'Prisma', 'TypeORM', 'Mongoose', 'Sequelize',
        'Dapper', 'Entity Framework', 'PL/SQL', 'T-SQL', 'ETL', 'Data Warehouse',
        // Cloud y DevOps
        'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Ansible',
        'Jenkins', 'GitHub Actions', 'GitLab CI', 'ArgoCD', 'Helm', 'Nginx',
        'Apache', 'Linux', 'Ubuntu', 'Prometheus', 'Grafana', 'Datadog', 'ELK',
        'Cloudflare', 'Vercel', 'Netlify', 'Lambda', 'S3', 'EC2', 'Azure DevOps',
        'CI/CD', 'Git', 'GitHub', 'GitLab', 'Bitbucket',
        // IA y análisis
        'OpenAI', 'GPT', 'LLMs', 'RAG', 'LangChain', 'ChatGPT', 'Claude', 'Gemini',
        'Whisper', 'TensorFlow', 'PyTorch', 'Keras', 'Scikit-learn', 'Pandas',
        'NumPy', 'Jupyter', 'Power BI', 'Tableau', 'Spark', 'Airflow', 'MLOps',
        'NLP', 'Computer Vision', 'Prompt Engineering',
        // Pruebas
        'Jest', 'Jasmine', 'Karma', 'Cypress', 'Playwright', 'Selenium', 'Vitest',
        'Mocha', 'JUnit', 'xUnit', 'NUnit', 'Postman', 'SonarQube', 'TDD', 'BDD',
        // Móvil y herramientas
        'React Native', 'Flutter', 'Ionic', 'Xamarin', '.NET MAUI', 'Capacitor',
        'Android', 'iOS', 'Expo', 'Unity', 'Unreal', 'Blender', 'Figma', 'Sketch',
        'Jira', 'Confluence', 'Scrum', 'Kanban', 'Agile', 'DevOps', 'DDD', 'SOLID',
        'Clean Code', 'Design Patterns', 'UML', 'BPMN', 'SAP', 'Dynamics 365',
        'Power Platform', 'SharePoint', 'Power Apps', 'Power Automate', 'MQTT',
        'OPC UA', 'SCADA', 'IoT', 'Arduino', 'Blockchain', 'Web3', 'Ethereum',
        'Smart Contracts', 'AR/VR', 'WebXR'
    ];

    /**
     * Initializes the canvas and starts the digital rain animation.
     * @param canvasRef Reference to the HTML canvas element used as the background
     */
    initCanvas(canvasRef: ElementRef<HTMLCanvasElement>): void {
        if (typeof window === 'undefined') {
            return;
        }

        this.canvas = canvasRef.nativeElement;
        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            return;
        }
        this.ctx = ctx;

        this.reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

        this.resizeCanvas();
        this.clearCanvas();

        if (this.reduceMotion) {
            this.renderFrame(0);
        } else {
            this.startAnimation();
        }

        // Re-measure once the layout settled (footer position is only known after render).
        setTimeout(() => this.measureDisintegrationLine(), 400);

        this.resizeHandler = () => {
            this.resizeCanvas();
            this.measureDisintegrationLine();
            if (this.reduceMotion) {
                this.clearCanvas();
                this.renderFrame(0);
            }
        };
        window.addEventListener('resize', this.resizeHandler);
    }

    /**
     * Resizes the canvas to the viewport (device-pixel-ratio aware) and reinitializes the lanes.
     * @private
     */
    private resizeCanvas(): void {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.canvas.width = Math.floor(this.width * dpr);
        this.canvas.height = Math.floor(this.height * dpr);

        this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        this.ctx.textBaseline = 'middle';

        const lanes = Math.max(1, Math.floor(this.width / this.LANE_WIDTH));
        this.laneX = [];
        this.yPos = [];
        this.drawAtY = [];
        this.words = [];
        this.isWord = [];
        this.fontSizes = [];
        this.alphas = [];
        this.laneColor = [];
        this.wordLen = [];
        this.velocities = [];
        this.terminalSpeeds = [];

        for (let i = 0; i < lanes; i++) {
            this.laneX[i] = i * this.LANE_WIDTH + this.LANE_WIDTH * 0.5;
            this.yPos[i] = Math.random() * this.height - this.height;
            this.applyDepth(i);
            this.drawAtY[i] = this.yPos[i];
        }

        this.measureDisintegrationLine();
    }

    /**
     * Locates the footer's top edge so the falling text disintegrates right at the footer.
     * @private
     */
    private measureDisintegrationLine(): void {
        if (typeof document === 'undefined') {
            return;
        }
        this.footerEl = document.querySelector<HTMLElement>('.main-footer');
        const rect = this.footerEl?.getBoundingClientRect();
        this.disintegrateY = rect ? rect.top : this.height - 50;
    }

    /**
     * Reports a text impact on the footer's top border: it shakes the line and lights up a
     * spark right at the contact point, so the disintegration reads as an actual collision.
     * The blast is scaled with the text size that hit the line.
     * @param x Horizontal position (viewport px) where the falling text hit the line
     * @param size Font size (px) of the lane that hit, which drives the blast size
     * @private
     */
    private triggerImpact(x: number, size: number): void {
        const footer = this.footerEl;
        if (!footer || this.reduceMotion) {
            return;
        }

        // Throttle: several lanes can hit at once, one tremor is enough.
        const now = performance.now();
        if (now - this.lastImpactTime < this.IMPACT_COOLDOWN) {
            return;
        }
        this.lastImpactTime = now;

        footer.style.setProperty('--impact-x', `${Math.round(x)}px`);
        footer.style.setProperty('--impact-scale', this.impactScaleFor(size).toFixed(2));

        // Remove + reflow + add, so the CSS animation restarts on every new impact.
        footer.classList.remove('is-impacting');
        void footer.offsetWidth;
        footer.classList.add('is-impacting');

        if (this.impactResetTimer) {
            clearTimeout(this.impactResetTimer);
        }
        this.impactResetTimer = setTimeout(() => {
            footer.classList.remove('is-impacting');
            this.impactResetTimer = undefined;
        }, this.IMPACT_DURATION);
    }

    /**
     * Assigns a random "depth" to a lane, expressed as font size, opacity and lane content.
     * The lane also gets its initial speed: the bigger the text, the faster it starts.
     * @private
     */
    private applyDepth(index: number): void {
        const depth = Math.random();
        const size = Math.round(this.MIN_FONT + depth * (this.MAX_FONT - this.MIN_FONT));
        this.fontSizes[index] = size;
        this.alphas[index] = 0.85 + depth * 0.15;
        this.laneColor[index] = this.RAIN_COLORS[Math.floor(Math.random() * this.RAIN_COLORS.length)];
        this.isWord[index] = Math.random() < this.WORD_LANE_RATIO;
        this.words[index] = this.isWord[index] ? this.randomWord() : '';
        this.velocities[index] = this.speedFor(size) * this.factorNivel();
        this.terminalSpeeds[index] = this.terminalSpeedFor(size) * this.factorNivel();

        // Measure the word length so the trail behind it can be cleaned precisely.
        this.ctx.font = `${size}px ${this.FONT_STACK}`;
        this.wordLen[index] = this.isWord[index] ? this.ctx.measureText(this.words[index]).width : 0;
    }

    /**
     * Normalizes a font size into the 0..1 range of the lane sizes, so speed and blast
     * size can grow proportionally with the text.
     * @private
     */
    private sizeFactor(size: number): number {
        return (size - this.MIN_FONT) / Math.max(1, this.MAX_FONT - this.MIN_FONT);
    }

    /**
     * Initial fall speed for a text of the given size (px/s): bigger text falls faster.
     * @private
     */
    private speedFor(size: number): number {
        return this.MIN_SPEED + this.sizeFactor(size) * (this.MAX_SPEED - this.MIN_SPEED);
    }

    /**
     * Terminal fall speed for a text of the given size (px/s), so the size-based speed
     * difference survives once the lane stops accelerating.
     * @private
     */
    private terminalSpeedFor(size: number): number {
        return this.MIN_TERMINAL_SPEED +
            this.sizeFactor(size) * (this.MAX_TERMINAL_SPEED - this.MIN_TERMINAL_SPEED);
    }

    /** Nivel de velocidad en curso (1 = el más lento). */
    get nivelActual(): number {
        return this.nivel;
    }

    /** Nivel máximo de la escalera. */
    get nivelMaximo(): number {
        return this.NIVEL_MAXIMO;
    }

    /** Tope de velocidad del nivel en curso (px/s): el máximo que se espera en él. */
    get topeNivel(): number {
        return Math.round(this.terminalSpeedFor(this.MAX_FONT) * this.factorNivel());
    }

    /**
     * Fija el nivel a mano (1 = el más lento). Sirve para subir la dificultad sin
     * esperar al reloj, por ejemplo desde el juego.
     */
    fijarNivel(nivel: number): void {
        const destino = Math.min(this.NIVEL_MAXIMO, Math.max(1, Math.round(nivel)));
        if (destino === this.nivel) {
            return;
        }
        const anterior = this.factorNivel();
        this.nivel = destino;
        this.tiempoNivelMs = 0;
        this.escalarVelocidades(anterior);
    }

    /** Multiplicador de velocidad del nivel actual. */
    private factorNivel(): number {
        return this.NIVEL_FACTOR_BASE * Math.pow(this.NIVEL_FACTOR_PASO, this.nivel - 1);
    }

    /** Milisegundos que dura el nivel en curso antes de subir al siguiente. */
    private duracionNivelMs(): number {
        const topeMedio = this.terminalSpeedFor((this.MIN_FONT + this.MAX_FONT) / 2) * this.factorNivel();
        const cruce = topeMedio > 0 ? (this.height / topeMedio) * 1000 : this.NIVEL_MIN_MS;
        return Math.max(this.NIVEL_MIN_MS, cruce * this.NIVEL_CRUCES);
    }

    /**
     * Reescala la velocidad de todos los carriles al nivel nuevo: conserva lo que cada
     * uno llevaba acelerado y lo deja dentro de los límites del nivel.
     */
    private escalarVelocidades(factorAnterior: number): void {
        const factor = this.factorNivel();
        const razon = factorAnterior > 0 ? factor / factorAnterior : 1;

        for (let i = 0; i < this.laneX.length; i++) {
            const tamano = this.fontSizes[i];
            const arranque = this.speedFor(tamano) * factor;
            const tope = this.terminalSpeedFor(tamano) * factor;

            this.terminalSpeeds[i] = tope;
            this.velocities[i] = Math.min(Math.max((this.velocities[i] ?? arranque) * razon, arranque), tope);
        }
    }

    /**
     * Scale applied to the footer explosion, proportional to the text that hit the line.
     * @private
     */
    private impactScaleFor(size: number): number {
        return this.MIN_IMPACT_SCALE + this.sizeFactor(size) * (this.MAX_IMPACT_SCALE - this.MIN_IMPACT_SCALE);
    }

    /**
     * Picks a random technology name from the skills-based word list.
     * @private
     */
    private randomWord(): string {
        return this.WORDS[Math.floor(Math.random() * this.WORDS.length)];
    }

    /**
     * Picks a random glyph for the classic Matrix rain lanes.
     * @private
     */
    private randomChar(): string {
        return this.CHARSET[Math.floor(Math.random() * this.CHARSET.length)];
    }

    /**
     * Paints the canvas with the base surface color.
     * @private
     */
    private clearCanvas(): void {
        this.ctx.fillStyle = this.CANVAS_COLOR;
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    /**
     * Starts the animation loop.
     * @private
     */
    private startAnimation(): void {
        const animate = (time: number) => {
            const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, 0.05) : 0;
            this.lastTime = time;
            this.renderFrame(dt);
            this.animationFrameId = requestAnimationFrame(animate);
        };
        this.animationFrameId = requestAnimationFrame(animate);
    }

    /**
     * Draws a single frame: fades the previous one to create the trail and draws the
     * falling lanes (classic glyphs and readable technology words).
     * @param dt Elapsed time in seconds since the previous frame
     * @private
     */
    private renderFrame(dt: number): void {
        this.ctx.fillStyle = this.FADE;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // La caída sube por niveles: agotado el tope del nivel en curso se pasa al
        // siguiente, que arranca más rápido. El primero es el más lento.
        if (this.nivel < this.NIVEL_MAXIMO) {
            this.tiempoNivelMs += dt * 1000;
            if (this.tiempoNivelMs >= this.duracionNivelMs()) {
                const anterior = this.factorNivel();
                this.nivel += 1;
                this.tiempoNivelMs = 0;
                this.escalarVelocidades(anterior);
            }
        }

        for (let i = 0; i < this.laneX.length; i++) {
            const x = this.laneX[i];
            const y = this.yPos[i];
            const size = this.fontSizes[i];

            // Actively clean the trail behind this lane so it never lingers/accumulates as
            // a thick band in the background. Only a short estela is kept behind the text.
            const headTop = this.isWord[i] ? y - this.wordLen[i] : y;
            const clearTo = headTop - size * this.TRAIL_CELLS;
            if (clearTo > 0) {
                this.ctx.globalAlpha = 1;
                this.ctx.shadowBlur = 0;
                this.ctx.fillStyle = this.CANVAS_COLOR;
                this.ctx.fillRect(x - this.LANE_WIDTH / 2, 0, this.LANE_WIDTH, clearTo);
            }

            this.ctx.save();
            this.ctx.globalAlpha = this.alphas[i];
            this.ctx.font = `${size}px ${this.FONT_STACK}`;
            this.ctx.textBaseline = 'middle';
            this.ctx.shadowColor = this.GLOW;

            if (this.isWord[i]) {
                // Readable technology word, colored per lane.
                this.drawWordLane(x, y, size, this.words[i], this.laneColor[i]);
            } else if (y >= this.drawAtY[i]) {
                // Classic Matrix glyph, drawn one cell at a time to keep it crisp.
                this.drawGlyphLane(x, y, size, this.laneColor[i]);
                this.drawAtY[i] = y + size;
            }

            this.ctx.restore();

            // Real gravity: every lane accelerates while it falls, up to its own terminal
            // velocity. Combined with the size-based start speed, large technology words
            // plummet while small glyphs drift down slowly. Gravity also scales with the
            // speed level, so a higher level falls harder, not only faster.
            this.velocities[i] = Math.min(
                this.velocities[i] + this.GRAVITY * this.factorNivel() * dt,
                this.terminalSpeeds[i]
            );
            this.yPos[i] += this.velocities[i] * dt;

            // Disintegrate the text when it reaches the footer line.
            if (this.yPos[i] >= this.disintegrateY) {
                this.spawnDisintegration(x, this.disintegrateY, size, i);

                // The border explosion is reserved for the full technology words:
                // single glyphs die silently on the line.
                if (this.isWord[i]) {
                    this.triggerImpact(x, size);
                }

                this.yPos[i] = -Math.random() * this.height - 40;
                this.applyDepth(i);
                this.drawAtY[i] = this.yPos[i];
            }
        }

        this.updateAndDrawParticles(dt);
    }

    /**
     * Emits debris particles from a lane as it disintegrates at the footer line.
     * @param multiplicador Repite la metralla para los golpes del juego, que deben
     * verse más contundentes que una desintegración normal
     * @private
     */
    private spawnDisintegration(x: number, y: number, size: number, laneIndex: number, multiplicador = 1): void {
        if (this.particles.length >= this.MAX_PARTICLES) {
            return;
        }
        const isWord = this.isWord[laneIndex];
        const source = isWord ? this.words[laneIndex] : this.CHARSET;
        const count = (isWord ? Math.min(source.length, 10) : 5) * multiplicador;

        for (let n = 0; n < count; n++) {
            const char = source[Math.floor(Math.random() * source.length)];
            const py = y - (isWord ? n * size * 0.85 : 0);
            this.particles.push({
                x: x + (Math.random() - 0.5) * size,
                y: py,
                vx: (Math.random() - 0.5) * 90,
                vy: 40 + Math.random() * 120,
                life: 0.5 + Math.random() * 0.5,
                maxLife: 1,
                size: size * 0.8,
                char
            });
        }
    }

    /**
     * Palabras que están cayendo ahora mismo, con su posición, y que por tanto se
     * pueden reventar con el teclado. Solo devuelve las que ya están en pantalla.
     */
    palabrasEnVuelo(): PalabraEnVuelo[] {
        const enVuelo: PalabraEnVuelo[] = [];
        for (let i = 0; i < this.laneX.length; i++) {
            if (!this.isWord[i]) {
                continue;
            }
            const y = this.yPos[i];
            if (y < 0 || y > this.disintegrateY) {
                continue;
            }
            enVuelo.push({
                indice: i,
                palabra: this.words[i],
                x: this.laneX[i],
                y,
                tamano: this.fontSizes[i]
            });
        }
        return enVuelo;
    }

    /**
     * Revienta una palabra en el punto donde va cayendo: suelta la metralla ahí mismo
     * y devuelve el carril arriba. Es la reacción al acierto del jugador.
     * @param indice Carril que se destruye
     */
    destruirPalabra(indice: number): void {
        if (indice < 0 || indice >= this.laneX.length || !this.isWord[indice]) {
            return;
        }

        const x = this.laneX[indice];
        const y = this.yPos[indice];
        const tamano = this.fontSizes[indice];

        // Doble metralla: el golpe del teclado debe sentirse más fuerte que una caída.
        this.spawnDisintegration(x, y, tamano, indice, 2);

        this.yPos[indice] = -Math.random() * this.height - 40;
        this.applyDepth(indice);
        this.drawAtY[indice] = this.yPos[indice];
    }

    /**
     * Advances and renders the disintegration particles, removing the dead ones.
     * @private
     */
    private updateAndDrawParticles(dt: number): void {
        if (!this.particles.length) {
            return;
        }

        const gravity = 140;
        this.ctx.save();
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = this.PARTICLE_COLOR;
        this.ctx.shadowColor = this.GLOW;

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.vy += gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;

            this.ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            this.ctx.font = `${p.size}px ${this.FONT_STACK}`;
            this.ctx.shadowBlur = 4;
            this.ctx.fillText(p.char, p.x, p.y);
        }

        this.ctx.restore();
    }

    /**
     * Draws a full, readable technology word falling down the lane, with a bright tip.
     * @private
     */
    private drawWordLane(x: number, y: number, size: number, word: string, color: string): void {
        this.ctx.textAlign = 'left';
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(-Math.PI / 2);

        // Crisp body in the lane color (no heavy glow so the color stays clean and readable).
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = color;
        this.ctx.fillText(word, 0, 0);

        // Bright leading character for the rain tip.
        this.ctx.shadowBlur = size * 0.25;
        this.ctx.fillStyle = this.HEAD_COLOR;
        this.ctx.fillText(word.charAt(0), 0, 0);

        this.ctx.restore();
    }

    /**
     * Draws a single classic Matrix glyph at the given position.
     * @private
     */
    private drawGlyphLane(x: number, y: number, size: number, color: string): void {
        this.ctx.textAlign = 'center';
        this.ctx.shadowBlur = size * 0.25;
        this.ctx.fillStyle = color;
        this.ctx.fillText(this.randomChar(), x, y);
    }

    /**
     * Stops the animation and removes listeners when the component is destroyed.
     */
    destroy(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = 0;
        }
        if (this.resizeHandler) {
            window.removeEventListener('resize', this.resizeHandler);
            this.resizeHandler = undefined;
        }
        if (this.impactResetTimer) {
            clearTimeout(this.impactResetTimer);
            this.impactResetTimer = undefined;
        }
        this.footerEl?.classList.remove('is-impacting');
        this.footerEl = null;
    }
}
