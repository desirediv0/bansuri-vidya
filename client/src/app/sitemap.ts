import { MetadataRoute } from 'next'

const BASE_URL = 'https://bansurividya.com'


export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes = [
        {
            url: `${BASE_URL}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1,
        },
        {
            url: `${BASE_URL}/about`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.8,
        },
        {
            url: `${BASE_URL}/contact`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
            priority: 0.5,
        },
    ]

    let courseRoutes = []
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/course/get-courses-for-seo`)
        const data = await response.json()

        if (data.data) {
            courseRoutes = data.data.map((course: any) => ({
                url: `${BASE_URL}/course/${course.slug}`,
                lastModified: new Date(course.updatedAt || course.createdAt),
                changeFrequency: 'weekly',
                priority: 0.9,
            }))
        }
    } catch (error) {
        console.error('Failed to fetch courses for sitemap:', error)
    }

    return [...staticRoutes, ...courseRoutes]
}