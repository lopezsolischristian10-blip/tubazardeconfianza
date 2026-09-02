document.addEventListener("DOMContentLoaded", () => {

    const contenedor = document.getElementById("contenedorRopa");
    const loader = document.getElementById("loaderRopa");
    const sinRopa = document.getElementById("sinRopa");
    const filtros = document.getElementById("filtrosCategorias");
    const filtrosEstados = document.getElementById("filtrosEstados");

    let productos = [];


    /*
     * Filtros activos. Ambos se aplican en conjunto
     * (estado Y categoría) sobre el listado completo.
     */

    let filtroEstadoActual = "todos";

    let filtroCategoriaActual = "todas";


    /*
     * Número de tarjetas que se muestran de inicio.
     * El resto queda oculto detrás del botón "ver más".
     */

    const LIMITE_TARJETAS = 14;


    /*
     * Prioridad para acomodar las prendas: primero las
     * disponibles, luego las apartadas y al final las
     * compradas. Dentro de cada grupo se conserva el
     * orden que ya entrega la función (más recientes
     * primero), gracias a que el ordenamiento es estable.
     */

    const ORDEN_ESTADO = {
        disponible: 0,
        apartado: 1,
        comprado: 2
    };


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

            productos = ordenarProductos(
                JSON.parse(texto)
            );

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
       ORDENAR PRODUCTOS
    ========================================== */

    function ordenarProductos(lista) {

        return [...lista].sort((a, b) => {

            const ordenA =
                ORDEN_ESTADO[a.estado] ?? 3;

            const ordenB =
                ORDEN_ESTADO[b.estado] ?? 3;

            return ordenA - ordenB;

        });

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

                seleccionarFiltro(
                    filtros,
                    boton
                );

                filtroCategoriaActual = categoria;

                aplicarFiltros();

            });

            filtros.appendChild(boton);

        });


        /* Botón "Todas" (categorías) */

        const botonTodas =
            filtros.querySelector(
                '[data-categoria="todas"]'
            );

        botonTodas.addEventListener("click", () => {

            seleccionarFiltro(
                filtros,
                botonTodas
            );

            filtroCategoriaActual = "todas";

            aplicarFiltros();

        });


        /* Botones de estado (ya existen en el HTML) */

        filtrosEstados
            .querySelectorAll(".btn-filtro")
            .forEach(boton => {

                boton.addEventListener("click", () => {

                    seleccionarFiltro(
                        filtrosEstados,
                        boton
                    );

                    filtroEstadoActual =
                        boton.dataset.estado;

                    aplicarFiltros();

                });

            });

    }


    /* ==========================================
       SELECCIONAR FILTRO (marca el botón activo
       dentro de su propio grupo, sin afectar al
       otro grupo de filtros)
    ========================================== */

    function seleccionarFiltro(grupo, botonActivo) {

        grupo
            .querySelectorAll(".btn-filtro")
            .forEach(btn =>
                btn.classList.remove("activo")
            );

        botonActivo.classList.add("activo");

    }


    /* ==========================================
       APLICAR FILTROS (estado + categoría)
    ========================================== */

    function aplicarFiltros() {

        let filtrados = productos;

        if (filtroEstadoActual !== "todos") {

            filtrados = filtrados.filter(
                producto =>
                    producto.estado === filtroEstadoActual
            );

        }

        if (filtroCategoriaActual !== "todas") {

            filtrados = filtrados.filter(
                producto =>
                    producto.categoria === filtroCategoriaActual
            );

        }

        mostrarProductos(filtrados);

    }


    /* ==========================================
       MOSTRAR PRODUCTOS
    ========================================== */

    function mostrarProductos(lista) {

        if (lista.length === 0) {

            contenedor.innerHTML = "";

            mostrarMensajeSinRopa();

            return;

        }

        sinRopa.classList.add("d-none");


        /*
         * Cada vez que se muestra un nuevo listado
         * (por ejemplo al cambiar de filtro) se
         * arranca otra vez mostrando solo las
         * primeras tarjetas.
         */

        renderizarTarjetas(lista, false);

    }


    /* ==========================================
       RENDERIZAR TARJETAS (con límite y botón
       "ver más" opcional)
    ========================================== */

    function renderizarTarjetas(lista, mostrarTodas) {

        contenedor.innerHTML = "";

        const visibles =
            mostrarTodas
                ? lista
                : lista.slice(0, LIMITE_TARJETAS);

        visibles.forEach(producto => {

            const tarjeta =
                crearTarjeta(producto);

            contenedor.appendChild(tarjeta);

        });


        if (
            !mostrarTodas &&
            lista.length > LIMITE_TARJETAS
        ) {

            contenedor.appendChild(
                crearBotonVerMasCatalogo(lista)
            );

        }

        actualizarBotonesVerMas();

    }


    /* ==========================================
       BOTÓN "+" (VER MÁS PRENDAS)
       Ocupa el lugar de la tarjeta 15 y, al
       presionarlo, muestra todo el listado.
    ========================================== */

    function crearBotonVerMasCatalogo(lista) {

        const columna =
            document.createElement("div");

        columna.className = "col";


        const boton =
            document.createElement("button");

        boton.type = "button";

        boton.className = "btn-ver-mas-catalogo";

        boton.setAttribute(
            "aria-label",
            "Ver más prendas"
        );

        boton.innerHTML =
            `<i class="bi bi-plus-lg"></i>
             <span>Ver más</span>`;

        boton.addEventListener("click", () => {

            renderizarTarjetas(lista, true);

        });


        columna.appendChild(boton);

        return columna;

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

        columna.className = "col";


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


        /*
         * PRECIO Y WHATSAPP (sobre la imagen)
         *
         * Se colocan del lado derecho, a la misma
         * altura que la etiqueta de estado, para que
         * precio, disponibilidad y el botón de "YO"
         * queden visibles de un vistazo, sin tener
         * que bajar hasta la descripción.
         */

        const superiorDerecha =
            document.createElement("div");

        superiorDerecha.className =
            "ropa-superior-derecha";


        const precioOverlay =
            document.createElement("span");

        precioOverlay.className =
            "precio-overlay";

        precioOverlay.textContent =
            formatearPrecio(producto.precio);

        superiorDerecha.appendChild(precioOverlay);


        if (producto.estado === "disponible") {

            superiorDerecha.appendChild(
                crearBotonWhatsapp(producto, true)
            );

        }


        imagenContenedor.appendChild(superiorDerecha);


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
            formatearCategoriaFecha(producto);


        const descripcion =
            document.createElement("div");

        descripcion.className =
            "ropa-descripcion";

        descripcion.textContent =
            producto.descripcion || "";


        /*
         * VER MÁS
         *
         * La descripción se muestra recortada a 3
         * renglones (vía CSS). Este botón solo se
         * muestra si el texto realmente se recortó
         * (ver actualizarBotonesVerMas) y abre un
         * modal con la descripción completa.
         */

        const botonVerMas =
            document.createElement("button");

        botonVerMas.type = "button";

        botonVerMas.className =
            "btn-ver-mas d-none";

        botonVerMas.textContent =
            "Ver más";

        botonVerMas.addEventListener(
            "click",
            () => abrirModalDescripcion(producto)
        );


        informacion.appendChild(categoria);

        informacion.appendChild(descripcion);

        informacion.appendChild(botonVerMas);


        tarjeta.appendChild(imagenContenedor);

        tarjeta.appendChild(informacion);

        columna.appendChild(tarjeta);


        return columna;

    }


    /* ==========================================
       BOTÓN "YO QUIERO ESTA PRENDA"
       (se usa tanto en la tarjeta como en el
       modal de descripción)
    ========================================== */

    function crearBotonWhatsapp(producto, esOverlay = false) {

        const whatsapp =
            document.createElement("a");

        whatsapp.className =
            esOverlay
                ? "btn-whatsapp btn-whatsapp-overlay"
                : "btn-whatsapp";

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
         * que pegarlo. El mensaje siempre incluye el "YO",
         * la descripción/leyenda de la prenda y el enlace
         * de la foto.
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
            `<i class="bi bi-whatsapp"></i> YO`;


        return whatsapp;

    }


    /* ==========================================
       VER MÁS: MOSTRAR / OCULTAR BOTÓN
       SEGÚN SI LA DESCRIPCIÓN SE RECORTÓ
    ========================================== */

    function actualizarBotonesVerMas() {

        requestAnimationFrame(() => {

            document
                .querySelectorAll(".ropa-descripcion")
                .forEach(descripcion => {

                    const boton =
                        descripcion.nextElementSibling;

                    if (
                        !boton ||
                        !boton.classList.contains("btn-ver-mas")
                    ) {
                        return;
                    }

                    const estaRecortada =
                        descripcion.scrollHeight >
                        descripcion.clientHeight + 1;

                    boton.classList.toggle(
                        "d-none",
                        !estaRecortada
                    );

                });

        });

    }


    /* ==========================================
       MODAL: VER DESCRIPCIÓN COMPLETA
    ========================================== */

    function abrirModalDescripcion(producto) {

        const modalElemento =
            document.getElementById("modalDescripcion");

        if (!modalElemento) return;


        const imagen =
            document.getElementById("modalDescripcionImagen");

        const categoriaTitulo =
            document.getElementById("modalDescripcionCategoria");

        const texto =
            document.getElementById("modalDescripcionTexto");

        const precio =
            document.getElementById("modalDescripcionPrecio");

        const zonaWhatsapp =
            document.getElementById("modalDescripcionWhatsapp");


        imagen.src =
            producto.foto
                ? `/.netlify/functions/imagen?key=${encodeURIComponent(producto.foto)}`
                : "https://placehold.co/600x800/f9edf3/8e2855?text=Sin+imagen";

        imagen.alt =
            producto.categoria ||
            "Prenda de Tu Bazar de Confianza";


        categoriaTitulo.textContent =
            formatearCategoriaFecha(producto);

        texto.textContent =
            producto.descripcion || "";

        precio.textContent =
            formatearPrecio(producto.precio);


        zonaWhatsapp.innerHTML = "";

        if (producto.estado === "disponible") {

            zonaWhatsapp.appendChild(
                crearBotonWhatsapp(producto)
            );

        } else {

            const infoEstado =
                document.createElement("p");

            infoEstado.className =
                "modal-descripcion-estado-info";

            infoEstado.textContent =
                producto.estado === "apartado"
                    ? "Esta prenda ya está apartada. 💛"
                    : "Esta prenda ya fue vendida. 🤍";

            zonaWhatsapp.appendChild(infoEstado);

        }


        new bootstrap.Modal(modalElemento).show();

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
       FORMATEAR FECHA (DD/MM/AAAA)
    ========================================== */

    function formatearFecha(fecha) {

        if (!fecha) return "";

        /*
         * La fecha llega como "AAAA-MM-DD" (tipo DATE
         * de PostgreSQL). Se arma el texto directo del
         * string para evitar corrimientos de un día por
         * zona horaria al usar new Date().
         */

        const partes =
            String(fecha).slice(0, 10).split("-");

        if (partes.length !== 3) return "";

        const [anio, mes, dia] = partes;

        return `${dia}/${mes}/${anio}`;

    }


    /* ==========================================
       CATEGORÍA + FECHA
    ========================================== */

    function formatearCategoriaFecha(producto) {

        const categoria =
            producto.categoria || "Ropa";

        const fecha =
            formatearFecha(producto.fecha);

        return fecha
            ? `${categoria} - ${fecha}`
            : categoria;

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