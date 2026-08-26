const CACHE_NAME =
"checklist-locomotivas-v2-offline-4";

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

    const url =
      new URL(request.url);


    /*
      TESTE REAL DE CONEXÃO

      Essa requisição nunca utiliza o cache.
      Se a internet cair, o fetch falha e o
      index consegue identificar o modo offline.
    */

    if(
      url.origin === self.location.origin
      &&
      url.searchParams.has("ping")
    ){

      event.respondWith(

        fetch(
          request,
          {
            cache:"no-store"
          }
        )

      );

      return;

    }


    /*
      APIs externas, como Google Apps Script,
      não são interceptadas nem armazenadas.
    */

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
      busca sempre a versão mais recente.

      Sem internet:
      utiliza a versão armazenada no cache.
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
      ARQUIVOS LOCAIS = CACHE FIRST

      Mantém o checklist disponível mesmo
      quando não houver conexão.
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
