import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// Type declarations for service worker manifest
declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Cache version
const CACHE_VERSION = "v1";
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing");

  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      console.log("[Service Worker] Caching app shell");
      return cache.addAll([
        "/",
        "/offline",
        "/icons/icon-72x72.png",
        "/icons/icon-96x96.png",
        "/icons/icon-144x144.png",
        "/icons/icon-192x192.png",
        "/icons/icon-512x512.png",
      ]);
    }),
  );
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return (
              cacheName.startsWith("app-shell-") &&
              cacheName !== APP_SHELL_CACHE
            );
          })
          .map((cacheName) => {
            console.log("[Service Worker] Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }),
      );
    }),
  );
});

self.addEventListener("install", () => {
  console.log("[Service Worker] Installed");
});

self.addEventListener("activate", () => {
  console.log("[Service Worker] Activated");
});
