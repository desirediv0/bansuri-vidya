import { MetadataRoute } from 'next'

const BASE_URL = 'https://bansurividya.com'


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = [
        {
            url: `${BASE_URL}`,
            lastModified: new Date(),
            changeFrequency: 'daily' as const,
            priority: 1,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly' as const,
            priority: 0.5,
        },
    ]

    let courseRoutes: MetadataRoute.Sitemap = []
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course/get-courses-for-seo`)
        const data = await response.json()

        if (data.data) {
            courseRoutes = data.data.map((course: any) => ({
                url: `${BASE_URL}/course/${course.slug}`,
                lastModified: new Date(course.updatedAt || course.createdAt),
                changeFrequency: 'weekly' as const,
                priority: 0.9,
            }))
        }
    } catch (error) {
        console.error('Failed to fetch courses for sitemap:', error)
    }

    let liveClassRoutes: MetadataRoute.Sitemap = []
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/seo-classes`)
        const data = await response.json()

        if (data.data) {
            liveClassRoutes = data.data.map((liveClass: any) => ({
                url: `${BASE_URL}/live-classes/${liveClass.slug}`,
                lastModified: new Date(liveClass.updatedAt || liveClass.createdAt),
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            }))
        }
    } catch (error) {
        console.error('Failed to fetch live classes for sitemap:', error)
    }

    return [...staticRoutes, ...courseRoutes, ...liveClassRoutes]
}