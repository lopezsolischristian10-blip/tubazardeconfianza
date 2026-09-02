document.addEventListener("DOMContentLoaded", () => {

    const contenedor = document.getElementById("contenedorRopa");
    const loader = document.getElementById("loaderRopa");
    const sinRopa = document.getElementById("sinRopa");
    const filtros = document.getElementById("filtrosCategorias");

    let productos = [];


    /* ==========================================
       CARGAR PRODUCTOS
    ========================================== */

    async function cargarProductos() {

        try {

            const respuesta = await fetch(
                "/.netlify/functions/productos"
            );

            const tipoContenido =
                respuesta.headers.get("content-type") || "";

            const texto =
                await respuesta.text();

            if (
                !respuesta.ok ||
                !texto ||
                !tipoContenido.includes("application/json")
            ) {
                throw new Error(
                    `Respuesta inesperada del servidor (status ${respuesta.status}).`
                );
            }

            productos = JSON.parse(texto);

            loader.classList.add("d-none");

            crearFiltros();

            mostrarProductos(productos);

        } catch (error) {

            /*
             * Cualquier falla (sin conexión, función caída,
             * respuesta inválida, etc.) se muestra siempre
             * como "no hay ropa por el momento", nunca como
             * un error técnico visible para la clienta.
             */

            console.error("Error al cargar productos:", error);

            loader.classList.add("d-none");

            mostrarMensajeSinRopa();

        }

    }


    /* ==========================================
       CREAR FILTROS
    ========================================== */

    function crearFiltros() {

        const categorias = [
            ...new Set(
                productos
                    .map(producto => producto.categoria)
                    .filter(Boolean)
            )
        ];

        categorias.forEach(categoria => {

            const boton = document.createElement("button");

            boton.className = "btn-filtro";

            boton.dataset.categoria = categoria;

            boton.textContent = categoria;

            boton.addEventListener("click", () => {

                document
                    .querySelectorAll(".btn-filtro")
                    .forEach(btn =>
                        btn.classList.remove("activo")
                    );

                boton.classList.add("activo");

                const filtrados = productos.filter(
                    producto =>
                        producto.categoria === categoria
                );

                mostrarProductos(filtrados);

            });

            filtros.appendChild(boton);

        });


        const botonTodas =
            document.querySelector(
                '[data-categoria="todas"]'
            );

        botonTodas.addEventListener("click", () => {

            document
                .querySelectorAll(".btn-filtro")
                .forEach(btn =>
                    btn.classList.remove("activo")
                );

            botonTodas.classList.add("activo");

            mostrarProductos(productos);

        });

    }


    /* ==========================================
       MOSTRAR PRODUCTOS
    ========================================== */

    function mostrarProductos(lista) {

        contenedor.innerHTML = "";

        if (lista.length === 0) {

            mostrarMensajeSinRopa();

            return;

        }

        sinRopa.classList.add("d-none");


        lista.forEach(producto => {

            const tarjeta =
                crearTarjeta(producto);

            contenedor.appendChild(tarjeta);

        });

    }


    /* ==========================================
       MENSAJE SIN ROPA
    ========================================== */

    function mostrarMensajeSinRopa() {

        contenedor.innerHTML = "";

        sinRopa.querySelector("h3").textContent =
            "No hay ropa por el momento";

        sinRopa.querySelector("p").textContent =
            "Vuelve pronto para descubrir nuevas prendas.";

        sinRopa.classList.remove("d-none");

    }


    /* ==========================================
       CREAR TARJETA
    ========================================== */

    function crearTarjeta(producto) {

        const columna =
            document.createElement("div");

        columna.className =
            "col-12 col-sm-6 col-lg-4 col-xl-3";


        const tarjeta =
            document.createElement("article");

        tarjeta.className =
            "tarjeta-ropa";


        /* Imagen */

        const imagenContenedor =
            document.createElement("div");

        imagenContenedor.className =
            "ropa-imagen-contenedor";


        const imagen =
            document.createElement("img");

        imagen.className =
            "ropa-imagen";

        imagen.alt =
            "Prenda de Tu Bazar de Confianza";

        /*
         * La imagen se obtiene mediante
         * nuestra Netlify Function.
         */

        if (producto.foto) {

            imagen.src =
                `/.netlify/functions/imagen?key=${encodeURIComponent(producto.foto)}`;

        } else {

            imagen.src =
                "https://placehold.co/600x800/f9edf3/8e2855?text=Sin+imagen";

        }


        /* Estado */

        const estado =
            document.createElement("span");

        estado.className =
            "estado-prenda";


        if (producto.estado === "disponible") {

            estado.classList.add(
                "estado-disponible"
            );

            estado.textContent =
                "Disponible";

        } else if (
            producto.estado === "apartado"
        ) {

            estado.classList.add(
                "estado-apartado"
            );

            estado.textContent =
                "Apartado";

        } else {

            estado.classList.add(
                "estado-comprado"
            );

            estado.textContent =
                "Comprado";

        }


        imagenContenedor.appendChild(imagen);

        imagenContenedor.appendChild(estado);


        /* Información */

        const informacion =
            document.createElement("div");

        informacion.className =
            "ropa-info";


        const categoria =
            document.createElement("div");

        categoria.className =
            "ropa-categoria";

        categoria.textContent =
            producto.categoria || "Ropa";


        const descripcion =
            document.createElement("div");

        descripcion.className =
            "ropa-descripcion";

        descripcion.textContent =
            producto.descripcion || "";


        const precio =
            document.createElement("div");

        precio.className =
            "ropa-precio";

        precio.textContent =
            formatearPrecio(producto.precio);


        informacion.appendChild(categoria);

        informacion.appendChild(descripcion);

        informacion.appendChild(precio);


        /*
         * WHATSAPP
         *
         * Solamente se crea si el estado
         * es "disponible".
         */

        if (producto.estado === "disponible") {

            const whatsapp =
                document.createElement("a");

            whatsapp.className =
                "btn-whatsapp";

            whatsapp.target = "_blank";

            whatsapp.rel = "noopener";


            const imagenURL =
                `${window.location.origin}/.netlify/functions/imagen?key=${encodeURIComponent(producto.foto)}`;


            const mensaje =
                `YO 🙋🏻‍♀️\n\n` +
                `${producto.descripcion}\n\n` +
                `Precio: ${formatearPrecio(producto.precio)}\n\n` +
                `Foto: ${imagenURL}`;


            /*
             * Enlace al grupo de WhatsApp.
             *
             * IMPORTANTE: WhatsApp no permite prellenar
             * un mensaje (ni mucho menos adjuntar una foto)
             * en un link de invitación a grupo, así que
             * copiamos el mensaje al portapapeles antes de
             * abrir el grupo, para que la clienta solo tenga
             * que pegarlo.
             */

            const linkGrupo =
                "https://chat.whatsapp.com/L27TM6CVe0R6IFYzoIs9O5";


            whatsapp.href =
                linkGrupo;


            whatsapp.addEventListener(
                "click",
                async () => {

                    try {

                        await navigator.clipboard.writeText(
                            mensaje
                        );

                        mostrarAvisoCopiado();

                    } catch (error) {

                        console.error(
                            "No se pudo copiar el mensaje:",
                            error
                        );

                    }

                }
            );


            whatsapp.innerHTML =
                `<i class="bi bi-whatsapp"></i> Yo quiero esta prenda`;


            informacion.appendChild(whatsapp);

        }


        tarjeta.appendChild(imagenContenedor);

        tarjeta.appendChild(informacion);

        columna.appendChild(tarjeta);


        return columna;

    }


    /* ==========================================
       AVISO DE MENSAJE COPIADO
    ========================================== */

    let temporizadorAviso = null;

    function mostrarAvisoCopiado() {

        const aviso =
            document.getElementById("avisoCopiado");

        if (!aviso) return;


        aviso.classList.remove("d-none");

        requestAnimationFrame(() => {
            aviso.classList.add("visible");
        });


        clearTimeout(temporizadorAviso);

        temporizadorAviso = setTimeout(() => {

            aviso.classList.remove("visible");

            setTimeout(() => {
                aviso.classList.add("d-none");
            }, 300);

        }, 3500);

    }


    /* ==========================================
       FORMATEAR PRECIO
    ========================================== */

    function formatearPrecio(precio) {

        return new Intl.NumberFormat(
            "es-MX",
            {
                style: "currency",
                currency: "MXN"
            }
        ).format(precio);

    }


    /* ==========================================
       INICIAR
    ========================================== */

    cargarProductos();

});