document.addEventListener(
    "DOMContentLoaded",
    async () => {

        try {

            const respuesta =
                await fetch(
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


            const productos =
                JSON.parse(texto);


            calcularEstadisticas(
                productos
            );


        } catch (error) {

            console.error(
                "Error cargando dashboard:",
                error
            );

        }

    }
);



function calcularEstadisticas(
    productos
) {

    const total =
        productos.length;


    const disponibles =
        productos.filter(
            p => p.estado === "disponible"
        );


    const apartadas =
        productos.filter(
            p => p.estado === "apartado"
        );


    const compradas =
        productos.filter(
            p => p.estado === "comprado"
        );


    /* ==================================
       CANTIDADES
    ================================== */

    document.getElementById(
        "totalPrendas"
    ).textContent = total;


    document.getElementById(
        "disponibles"
    ).textContent =
        disponibles.length;


    document.getElementById(
        "apartadas"
    ).textContent =
        apartadas.length;


    document.getElementById(
        "compradas"
    ).textContent =
        compradas.length;



    /* ==================================
       VALORES
    ================================== */

    const valorDisponible =
        disponibles.reduce(
            (total, producto) =>
                total +
                Number(producto.precio || 0),
            0
        );


    const valorComprado =
        compradas.reduce(
            (total, producto) =>
                total +
                Number(producto.precio || 0),
            0
        );


    document.getElementById(
        "valorDisponible"
    ).textContent =
        formatearPrecio(
            valorDisponible
        );


    document.getElementById(
        "valorComprado"
    ).textContent =
        formatearPrecio(
            valorComprado
        );



    /* ==================================
       CATEGORÍAS
    ================================== */

    mostrarCategorias(
        productos
    );



    /* ==================================
       BARRA
    ================================== */

    if (total > 0) {

        const porcentajeDisponible =
            (disponibles.length / total) *
            100;


        const porcentajeApartado =
            (apartadas.length / total) *
            100;


        const porcentajeComprado =
            (compradas.length / total) *
            100;


        document.getElementById(
            "barraDisponible"
        ).style.width =
            `${porcentajeDisponible}%`;


        document.getElementById(
            "barraApartado"
        ).style.width =
            `${porcentajeApartado}%`;


        document.getElementById(
            "barraComprado"
        ).style.width =
            `${porcentajeComprado}%`;

    }

}



/* =========================================
   CATEGORÍAS
========================================= */

function mostrarCategorias(
    productos
) {

    const contenedor =
        document.getElementById(
            "categorias"
        );


    const categorias = {};


    productos.forEach(producto => {

        const categoria =
            producto.categoria ||
            "Sin categoría";


        if (!categorias[categoria]) {

            categorias[categoria] = 0;

        }


        categorias[categoria]++;

    });


    contenedor.innerHTML = "";


    const nombres =
        Object.keys(categorias);


    if (nombres.length === 0) {

        contenedor.innerHTML = `
            <p>
                No hay prendas registradas.
            </p>
        `;

        return;

    }


    nombres
        .sort()
        .forEach(categoria => {

            const elemento =
                document.createElement(
                    "div"
                );


            elemento.className =
                "categoria-item";


            elemento.innerHTML = `

                <span>
                    ${escapeHTML(categoria)}
                </span>

                <strong>
                    ${categorias[categoria]}
                </strong>

            `;


            contenedor.appendChild(
                elemento
            );

        });

}



/* =========================================
   PRECIO
========================================= */

function formatearPrecio(
    precio
) {

    return new Intl.NumberFormat(
        "es-MX",
        {
            style: "currency",
            currency: "MXN"
        }
    ).format(precio);

}



/* =========================================
   ESCAPAR HTML
========================================= */

function escapeHTML(
    texto
) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent = texto;

    return div.innerHTML;

}