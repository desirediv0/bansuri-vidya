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

    // Skip API calls during build time to prevent connection errors
    // Dynamic routes will be generated at runtime when server is available
    if (process.env.NODE_ENV === 'development') {
        return staticRoutes
    }

    let courseRoutes: MetadataRoute.Sitemap = []
    let liveClassRoutes: MetadataRoute.Sitemap = []

    // Only attempt API calls in production runtime (not build time)
    try {
        if (process.env.NEXT_PUBLIC_API_URL && typeof window === 'undefined') {
            // Check if we're in a server context where API might be available
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 2000) // Shorter timeout

            try {
                const [coursesResponse, liveClassesResponse] = await Promise.allSettled([
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/course/get-courses-for-seo`, {
                        signal: controller.signal,
                        headers: { 'Accept': 'application/json' }
                    }),
                    fetch(`${process.env.NEXT_PUBLIC_API_URL}/zoom-live-class/seo-classes`, {
                        signal: controller.signal,
                        headers: { 'Accept': 'application/json' }
                    })
                ])

                clearTimeout(timeoutId)

                // Handle courses response
                if (coursesResponse.status === 'fulfilled' && coursesResponse.value.ok) {
                    const coursesData = await coursesResponse.value.json()
                    if (coursesData.data) {
                        courseRoutes = coursesData.data.map((course: any) => ({
                            url: `${BASE_URL}/course/${course.slug}`,
                            lastModified: new Date(course.updatedAt || course.createdAt),
                            changeFrequency: 'weekly' as const,
                            priority: 0.9,
                        }))
                    }
                }

                // Handle live classes response
                if (liveClassesResponse.status === 'fulfilled' && liveClassesResponse.value.ok) {
                    const liveClassesData = await liveClassesResponse.value.json()
                    if (liveClassesData.data) {
                        liveClassRoutes = liveClassesData.data.map((liveClass: any) => ({
                            url: `${BASE_URL}/live-classes/${liveClass.slug}`,
                            lastModified: new Date(liveClass.updatedAt || liveClass.createdAt),
                            changeFrequency: 'weekly' as const,
                            priority: 0.8,
                        }))
                    }
                }
            } catch (fetchError) {
                clearTimeout(timeoutId)
                // Silently handle fetch errors during build
            }
        }
    } catch (error) {
        // Silently handle any other errors
    }

    return [...staticRoutes, ...courseRoutes, ...liveClassRoutes]
}