/**
 * Interface for the portfolio owner information
 */
export interface PortfolioOwner {
    name: string;
    title: string;
    bio: string;
    avatar: string;
}

/**
 * Interface for skill information
 */
export interface Skill {
    name: string;
    level: number;
    icon: string;
    description?: string;
}

/**
 * Interface for experience information
 */
export interface Experience {
    role: string;
    company: string;
    period: string;
    description: string;
}