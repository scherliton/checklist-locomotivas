const CACHE_NAME = "checklist-locomotivas-v2-offline-2";

const APP_SHELL = [
  "./",
  "./index.html"
];

self.addEventListener("install", event => {

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
  );

  self.skipWaiting();

});


self.addEventListener("activate", event => {

  event.waitUntil(
    caches
      .keys()
      .then(keys =>
        Promise.all(
          keys
            .filter(key => key !== CACHE_NAME)
            .map(key => caches.delete(key))
        )
      )
  );

  self.clients.claim();

});


self.addEventListener("fetch", event => {

  if (event.request.method !== "GET") {
    return;
  }

  const request = event.request;

  const accept =
    request.headers.get("accept") || "";

  const isHtml =
    accept.includes("text/html");


  if (isHtml) {

    event.respondWith(

      fetch(request)

        .then(response => {

          const clone =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache =>
              cache.put(request, clone)
            );

          return response;

        })

        .catch(() =>
          caches
            .match(request)
            .then(cached =>
              cached ||
              caches.match("./index.html")
            )
        )

    );

    return;
  }


  event.respondWith(

    caches
      .match(request)
      .then(cached => {

        if (cached) {
          return cached;
        }

        return fetch(request)
          .then(response => {

            const clone =
              response.clone();

            caches
              .open(CACHE_NAME)
              .then(cache =>
                cache.put(request, clone)
              );

            return response;

          });

      })

  );

});
