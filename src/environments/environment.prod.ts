// This file contains environment variables for production
// In production, these variables must be configured on the server

export const environment = {
    production: true,
    // In production, this key must be replaced during deployment
    // or configured as an environment variable on the server
    resendApiKey: process.env['RESEND_API_KEY'] || '',
};