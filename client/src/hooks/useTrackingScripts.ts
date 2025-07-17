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

  // Function to inject script based on position
  const injectScript = useCallback(
    (scriptElement: HTMLScriptElement, position: string) => {
      // Remove any existing script with the same ID to prevent duplicates
      const existingScript = document.querySelector(
        `[data-tracking-script-id="${scriptElement.getAttribute(
          "data-tracking-script-id"
        )}"]`
      );
      if (existingScript) {
        existingScript.remove();
      }

      switch (position) {
        case "HEAD":
          document.head.appendChild(scriptElement);
          break;
        case "BODY_START":
          document.body.insertBefore(scriptElement, document.body.firstChild);
          break;
        case "BODY_END":
        default:
          document.body.appendChild(scriptElement);
          break;
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
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = script.script;

          const scriptTags = tempDiv.querySelectorAll("script");

          scriptTags.forEach((tag, index) => {
            const newScript = document.createElement("script");
            const subUniqueId = `${uniqueId}-sub-${index}`;
            newScript.setAttribute("data-tracking-script-id", subUniqueId);
            newScript.setAttribute("data-tracking-script-name", script.name);
            newScript.setAttribute("data-original-id", script.id);

            // Copy attributes
            Array.from(tag.attributes).forEach((attr) => {
              if (!attr.name.startsWith("data-tracking-script-")) {
                newScript.setAttribute(attr.name, attr.value);
              }
            });

            // Set content
            if (tag.src) {
              newScript.src = tag.src;
            } else {
              // Wrap inline scripts in enhanced IIFE
              const wrappedContent = wrapScriptInIIFE(
                tag.textContent || "",
                subUniqueId
              );
              newScript.textContent = wrappedContent;
            }

            // Inject based on position
            injectScript(newScript, script.position);
          });

          // Handle noscript tags
          const noscriptTags = tempDiv.querySelectorAll("noscript");
          noscriptTags.forEach((tag, index) => {
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
        } else {
          // Direct JavaScript content - wrap in enhanced IIFE
          const wrappedContent = wrapScriptInIIFE(script.script, uniqueId);
          scriptElement.textContent = wrappedContent;
          injectScript(scriptElement, script.position);
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
