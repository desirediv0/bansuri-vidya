"use client";

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface TrackingScript {
    id: string;
    name: string;
    script: string;
    position: 'HEAD' | 'BODY_START' | 'BODY_END';
    priority: number;
    isActive: boolean;
}

const useTrackingScripts = () => {
    const pathname = usePathname();

    useEffect(() => {        // Don't load tracking scripts on dashboard or admin pages
        const excludedPaths = [
            '/dashboard',
            '/admin',
            '/auth',
            '/api',
            '/login',
            '/register',
            '/profile',
            '/_next',
            '/favicon',
            '/sitemap',
            '/robots'
        ];

        const shouldExclude = excludedPaths.some(path =>
            pathname.startsWith(path)
        );

        if (shouldExclude) {
            console.log('🚫 Tracking scripts disabled for dashboard/admin pages:', pathname);
            return;
        }

        console.log('✅ Loading tracking scripts for public page:', pathname);
        const loadTrackingScripts = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL;
                const fullUrl = `${apiUrl}/tracking-scripts/active`;

                const response = await fetch(fullUrl);

                if (!response.ok) {
                    console.warn('Failed to load tracking scripts');
                    return;
                }

                const data = await response.json();
                const scripts: TrackingScript[] = (data.data || []);

                // Sort scripts by priority
                scripts.sort((a, b) => a.priority - b.priority);

                scripts.forEach((script) => {
                    const isActive = script.isActive !== undefined ? script.isActive : true;

                    if (!isActive) return;

                    // Create script element
                    const scriptElement = document.createElement('script');
                    scriptElement.setAttribute('data-tracking-script-id', script.id);
                    scriptElement.setAttribute('data-tracking-script-name', script.name);                    // Check if script content contains <script> tags
                    if (script.script.includes('<script')) {
                        // If it contains HTML script tags, extract and execute the JavaScript
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = script.script;

                        const scriptTags = tempDiv.querySelectorAll('script');

                        scriptTags.forEach((tag) => {
                            const newScript = document.createElement('script');
                            newScript.setAttribute('data-tracking-script-id', script.id);
                            newScript.setAttribute('data-tracking-script-name', script.name);

                            // Copy attributes
                            Array.from(tag.attributes).forEach(attr => {
                                if (attr.name !== 'data-tracking-script-id' && attr.name !== 'data-tracking-script-name') {
                                    newScript.setAttribute(attr.name, attr.value);
                                }
                            });

                            // Set content
                            if (tag.src) {
                                newScript.src = tag.src;
                            } else {
                                newScript.textContent = tag.textContent;
                            }

                            // Inject based on position
                            injectScript(newScript, script.position);
                        });

                        // Handle noscript tags
                        const noscriptTags = tempDiv.querySelectorAll('noscript');
                        noscriptTags.forEach((tag) => {
                            const noscript = document.createElement('noscript');
                            noscript.innerHTML = tag.innerHTML;
                            noscript.setAttribute('data-tracking-script-id', script.id);

                            // Always inject noscript in body
                            document.body.appendChild(noscript);
                        });
                    } else {
                        // Direct JavaScript content
                        scriptElement.textContent = script.script;
                        injectScript(scriptElement, script.position);
                    }
                });

            } catch (error) {
                console.error('Error loading tracking scripts:', error);
            }
        };        // Function to inject script based on position
        const injectScript = (scriptElement: HTMLScriptElement, position: string) => {
            // Remove any existing script with the same ID to prevent duplicates
            const existingScript = document.querySelector(`[data-tracking-script-id="${scriptElement.getAttribute('data-tracking-script-id')}"]`);
            if (existingScript) {
                existingScript.remove();
            }

            switch (position) {
                case 'HEAD':
                    document.head.appendChild(scriptElement);
                    break;
                case 'BODY_START':
                    document.body.insertBefore(scriptElement, document.body.firstChild);
                    break;
                case 'BODY_END':
                default:
                    document.body.appendChild(scriptElement);
                    break;
            }
        };

        // Only load scripts on client side
        if (typeof window !== 'undefined') {
            loadTrackingScripts();
        }        // Cleanup function to remove scripts on unmount
        return () => {
            const trackingScripts = document.querySelectorAll('[data-tracking-script-id]');
            trackingScripts.forEach(script => {
                script.remove();
            });
        };
    }, [pathname]);
};

export default useTrackingScripts;
