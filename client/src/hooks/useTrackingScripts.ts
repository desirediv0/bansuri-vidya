"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";

interface TrackingScript {
  id: string;
  name: string;
  script: string;
  position: "HEAD" | "BODY_START" | "BODY_END";
  priority: number;
  isActive: boolean;
}

// Debug logging only in development
const isDev = process.env.NODE_ENV === "development";
const log = (message: string, ...args: any[]) => {
  if (isDev) console.log(message, ...args);
};

const useTrackingScripts = () => {
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isLoadingRef = useRef(false);
  const lastPathnameRef = useRef<string>("");

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Function to report script errors to admin
  const reportScriptError = useCallback(async (scriptId: string, scriptName: string, error: Error) => {
    try {
      const errorData = {
        scriptId,
        scriptName,
        error: error.message,
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };

      // Log to console for immediate debugging
      console.error('🚨 Tracking Script Error Report:', errorData);

      // Send to server for admin tracking (optional - only if API exists)
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        fetch(`${apiUrl}/tracking-scripts/error-report`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData),
        }).catch((reportError) => {
          console.warn('Failed to report script error to server:', reportError);
        });
      }
    } catch (reportError) {
      console.error('Failed to report script error:', reportError);
    }
  }, []);

  // Function to inject script based on position
  const injectScript = useCallback(
    (scriptElement: HTMLScriptElement, position: string) => {
      // Validate script element
      if (!scriptElement || !(scriptElement instanceof HTMLElement)) {
        console.error('Invalid script element provided to injectScript');
        return false;
      }

      // Validate script content doesn't contain HTML tags
      const scriptContent = scriptElement.textContent || '';
      if (scriptContent.includes('<') && scriptContent.includes('>')) {
        console.error('Script contains HTML content, skipping injection:', scriptContent.substring(0, 100));
        return false;
      }

      // Remove any existing script with the same ID to prevent duplicates
      const scriptId = scriptElement.getAttribute("data-tracking-script-id");
      const scriptName = scriptElement.getAttribute("data-tracking-script-name");
      if (scriptId) {
        const existingScript = document.querySelector(
          `[data-tracking-script-id="${scriptId}"]`
        );
        if (existingScript) {
          existingScript.remove();
        }
      }

      try {
        switch (position) {
          case "HEAD":
            document.head.appendChild(scriptElement);
            break;
          case "BODY_START":
            // Safe insertBefore with null check
            if (document.body.firstChild) {
              document.body.insertBefore(scriptElement, document.body.firstChild);
            } else {
              document.body.appendChild(scriptElement);
            }
            break;
          case "BODY_END":
          default:
            document.body.appendChild(scriptElement);
            break;
        }
        log(`✅ Successfully injected script: ${scriptName || 'Unnamed'} (${position})`);
        return true;
      } catch (error) {
        console.error(`❌ Failed to inject script "${scriptName || 'Unnamed'}":`, error);

        // Report error to admin tracking
        reportScriptError(scriptId || 'unknown', scriptName || 'Unnamed', error as Error);

        // Fallback to body append
        try {
          document.body.appendChild(scriptElement);
          log(`⚠️ Fallback injection successful for: ${scriptName || 'Unnamed'}`);
          return true;
        } catch (fallbackError) {
          console.error(`❌ Failed fallback injection for "${scriptName || 'Unnamed'}":`, fallbackError);
          reportScriptError(scriptId || 'unknown', scriptName || 'Unnamed', fallbackError as Error);
          return false;
        }
      }
    },
    []
  );

  // Enhanced function to wrap script content in IIFE with better isolation
  const wrapScriptInIIFE = useCallback(
    (script: string, scriptId: string): string => {
      // Check if script is already wrapped or contains HTML
      if (
        script.includes("<script") ||
        script.trim().startsWith("(function()") ||
        script.trim().startsWith("!function")
      ) {
        return script;
      }

      // More aggressive variable isolation with timestamp
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);

      return `
;(function() {
    "use strict";
    
    // Create isolated scope with unique namespace
    const trackingScope_${timestamp}_${randomId} = {
        scriptId: "${scriptId}",
        timestamp: ${timestamp}
    };
    
    try {
        // Isolated execution
        ${script}
    } catch (trackingError) {
        console.error('Tracking script error [${scriptId}]:', trackingError);
    }
    
    // Clean up scope
    delete window.trackingScope_${timestamp}_${randomId};
})();`;
    },
    []
  );

  // Stable load function with better controls
  const loadTrackingScripts = useCallback(async () => {
    // Prevent multiple simultaneous loads
    if (isLoadingRef.current) {
      log("⏸️ Skipping load - already in progress");
      return;
    }

    // Prevent loading same pathname multiple times
    if (isLoaded && lastPathnameRef.current === pathname) {
      log("⏸️ Skipping load - already loaded for this path");
      return;
    }

    isLoadingRef.current = true;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const fullUrl = `${apiUrl}/tracking-scripts/active`;

      const response = await fetch(fullUrl);

      if (!response.ok) {
        console.warn("Failed to load tracking scripts");
        return;
      }

      const data = await response.json();
      const scripts: TrackingScript[] = data.data || [];

      // Sort scripts by priority
      scripts.sort((a, b) => a.priority - b.priority);

      // Clear any existing tracking scripts first to prevent conflicts
      const existingScripts = document.querySelectorAll(
        "[data-tracking-script-id]"
      );
      existingScripts.forEach((script) => script.remove());

      scripts.forEach((script, scriptIndex) => {
        const isActive = script.isActive !== undefined ? script.isActive : true;

        if (!isActive) return;

        // Create script element with unique identifier
        const uniqueId = `${script.id}_${Date.now()}_${scriptIndex}`;
        const scriptElement = document.createElement("script");
        scriptElement.setAttribute("data-tracking-script-id", uniqueId);
        scriptElement.setAttribute("data-tracking-script-name", script.name);
        scriptElement.setAttribute("data-original-id", script.id);

        // Check if script content contains <script> tags
        if (script.script.includes("<script")) {
          // If it contains HTML script tags, extract and execute the JavaScript
          try {
            // Use DOMParser to safely parse HTML content
            const parser = new DOMParser();
            const doc = parser.parseFromString(script.script, 'text/html');

            // Check for parsing errors
            const parserError = doc.querySelector('parsererror');
            if (parserError) {
              console.warn('HTML parsing error in tracking script, treating as plain JavaScript');
              // Fallback to treating as plain JavaScript
              const wrappedContent = wrapScriptInIIFE(script.script, uniqueId);
              scriptElement.textContent = wrappedContent;
              injectScript(scriptElement, script.position);
              return;
            }

            const scriptTags = doc.querySelectorAll("script");

            scriptTags.forEach((tag: Element, index: number) => {
              const newScript = document.createElement("script");
              const subUniqueId = `${uniqueId}-sub-${index}`;
              newScript.setAttribute("data-tracking-script-id", subUniqueId);
              newScript.setAttribute("data-tracking-script-name", script.name);
              newScript.setAttribute("data-original-id", script.id);

              // Copy attributes from the parsed script tag
              const scriptElement = tag as HTMLScriptElement;
              Array.from(scriptElement.attributes).forEach((attr: Attr) => {
                if (!attr.name.startsWith("data-tracking-script-")) {
                  newScript.setAttribute(attr.name, attr.value);
                }
              });

              // Set content
              if (scriptElement.src) {
                newScript.src = scriptElement.src;
              } else {
                const scriptContent = scriptElement.textContent || "";

                // Skip empty scripts
                if (!scriptContent.trim()) {
                  log(`⚠️ Skipping empty script: ${script.name}`);
                  return;
                }

                // Additional validation - ensure it's JavaScript, not HTML
                if (scriptContent.includes('<') && scriptContent.includes('>')) {
                  console.warn(`⚠️ Script contains HTML, skipping: ${script.name}`);
                  reportScriptError(script.id, script.name, new Error('Script contains HTML content'));
                  return;
                }

                // Wrap inline scripts in enhanced IIFE
                const wrappedContent = wrapScriptInIIFE(scriptContent, subUniqueId);
                newScript.textContent = wrappedContent;
              }

              // Inject based on position
              const injected = injectScript(newScript, script.position);
              if (!injected) {
                console.warn(`Failed to inject script: ${script.name}`);
              }
            });

            // Handle noscript tags
            const noscriptTags = doc.querySelectorAll("noscript");
            noscriptTags.forEach((tag: Element, index: number) => {
              const noscript = document.createElement("noscript");
              noscript.innerHTML = tag.innerHTML;
              noscript.setAttribute(
                "data-tracking-script-id",
                `${uniqueId}-noscript-${index}`
              );
              noscript.setAttribute("data-original-id", script.id);

              // Always inject noscript in body
              document.body.appendChild(noscript);
            });
          } catch (htmlParseError) {
            console.error('Error parsing HTML tracking script:', htmlParseError);
            // Fallback to treating as plain JavaScript
            const wrappedContent = wrapScriptInIIFE(script.script, uniqueId);
            scriptElement.textContent = wrappedContent;
            injectScript(scriptElement, script.position);
          }
        } else {
          // Direct JavaScript content - wrap in enhanced IIFE
          const scriptContent = script.script.trim();

          if (!scriptContent) {
            log(`⚠️ Skipping empty script: ${script.name}`);
            return;
          }

          // Final validation for plain JS
          if (scriptContent.includes('<script') || scriptContent.includes('</script>')) {
            console.error(`❌ Plain script still contains HTML tags: ${script.name}`);
            reportScriptError(script.id, script.name, new Error('Plain script contains HTML script tags'));
            return;
          }

          const wrappedContent = wrapScriptInIIFE(scriptContent, uniqueId);
          scriptElement.textContent = wrappedContent;

          const injected = injectScript(scriptElement, script.position);
          if (!injected) {
            console.warn(`Failed to inject plain script: ${script.name}`);
          }
        }
      });

      setIsLoaded(true);
      lastPathnameRef.current = pathname;
      log(`✅ Loaded ${scripts.length} tracking scripts for: ${pathname}`);
    } catch (error) {
      console.error("Error loading tracking scripts:", error);
    } finally {
      isLoadingRef.current = false;
    }
  }, [pathname, injectScript, wrapScriptInIIFE, isLoaded]);

  useEffect(() => {
    // Only run on client side after hydration
    if (!isClient || typeof window === "undefined") return;

    // Don't load tracking scripts on dashboard or admin pages
    const excludedPaths = [
      "/dashboard",
      "/admin",
      "/auth",
      "/api",
      "/login",
      "/register",
      "/profile",
      "/_next",
      "/favicon",
      "/sitemap",
      "/robots",
    ];

    const shouldExclude = excludedPaths.some((path) =>
      pathname.startsWith(path)
    );

    if (shouldExclude) {
      log("🚫 Tracking scripts disabled for dashboard/admin pages:", pathname);
      return;
    }

    // Only load if pathname actually changed
    if (lastPathnameRef.current === pathname && isLoaded) {
      log("⏸️ Same pathname, skipping load");
      return;
    }

    // Reset load state when pathname changes
    if (lastPathnameRef.current !== pathname) {
      setIsLoaded(false);
      lastPathnameRef.current = pathname;
    }

    // Debounced loading with longer delay
    const timeoutId = setTimeout(() => {
      if (!isLoadingRef.current && !isLoaded) {
        loadTrackingScripts();
      }
    }, 500);

    // Cleanup function to remove scripts on unmount
    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname, isClient, isLoaded, loadTrackingScripts]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const trackingScripts = document.querySelectorAll(
        "[data-tracking-script-id]"
      );
      trackingScripts.forEach((script) => {
        script.remove();
      });
      isLoadingRef.current = false;
      setIsLoaded(false);
    };
  }, []);
};

export default useTrackingScripts;
