import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/dashboard/',
                '/dashboard/*',
                '/api/',
                '/admin/',
                '/login',
                '/register',
                '/forgot-password',
                '/reset-password',
                '/account',
                '/_next/'
            ]
        },
        sitemap: 'https://bansurividya.com/sitemap.xml',
    }
}