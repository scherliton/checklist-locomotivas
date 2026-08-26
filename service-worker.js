const CACHE_NAME =
"checklist-locomotivas-v2-offline-3";

const APP_SHELL = [
  "./",
  "./index.html"
];


self.addEventListener(
  "install",
  event => {

    event.waitUntil(
      caches
        .open(CACHE_NAME)
        .then(
          cache =>
            cache.addAll(APP_SHELL)
        )
    );

    self.skipWaiting();

  }
);


self.addEventListener(
  "activate",
  event => {

    event.waitUntil(

      Promise.all([

        caches
          .keys()
          .then(
            keys =>
              Promise.all(
                keys
                  .filter(
                    key =>
                      key !== CACHE_NAME
                  )
                  .map(
                    key =>
                      caches.delete(key)
                  )
              )
          ),

        self.clients.claim()

      ])

    );

  }
);


self.addEventListener(
  "fetch",
  event => {

    const request =
      event.request;


    /*
      IMPORTANTE:
      O Service Worker só trabalha com arquivos
      do próprio GitHub Pages.

      APIs externas, como o Google Apps Script,
      passam direto para a internet e NÃO entram
      no cache.
    */

    const url =
      new URL(request.url);


    if(
      request.method !== "GET"
      ||
      url.origin !== self.location.origin
    ){

      return;

    }


    const accept =
      request.headers.get("accept")
      ||
      "";


    const isHtml =
      request.mode === "navigate"
      ||
      accept.includes("text/html");


    /*
      HTML = NETWORK FIRST

      Com internet:
      sempre busca a versão mais nova.

      Sem internet:
      utiliza a versão salva no cache.
    */

    if(isHtml){

      event.respondWith(

        fetch(
          request,
          {
            cache:"no-store"
          }
        )

          .then(
            response => {

              if(
                response
                &&
                response.ok
              ){

                const clone =
                  response.clone();

                caches
                  .open(CACHE_NAME)
                  .then(
                    cache =>
                      cache.put(
                        request,
                        clone
                      )
                  );

              }

              return response;

            }
          )

          .catch(
            () =>
              caches
                .match(request)
                .then(
                  cached =>
                    cached
                    ||
                    caches.match("./index.html")
                )
          )

      );

      return;

    }


    /*
      Arquivos locais = CACHE FIRST

      Mantém o checklist disponível offline
      sem interferir nas consultas da API.
    */

    event.respondWith(

      caches
        .match(request)

        .then(
          cached => {

            if(cached){

              return cached;

            }


            return fetch(request)

              .then(
                response => {

                  if(
                    response
                    &&
                    response.ok
                  ){

                    const clone =
                      response.clone();

                    caches
                      .open(CACHE_NAME)
                      .then(
                        cache =>
                          cache.put(
                            request,
                            clone
                          )
                      );

                  }

                  return response;

                }
              );

          }
        )

    );

  }
);
