let graficaDistribucion = null;

let tipoGraficaActual = "pie";

let conteoEstados = {
    disponible: 0,
    apartado: 0,
    comprado: 0
};


document.addEventListener(
    "DOMContentLoaded",
    async () => {

        /* ==================================
           BOTONES: PASTEL / BARRAS
        ================================== */

        document
            .querySelectorAll(".btn-tipo-grafica")
            .forEach(boton => {

                boton.addEventListener("click", () => {

                    if (
                        boton.dataset.tipo ===
                        tipoGraficaActual
                    ) {
                        return;
                    }

                    document
                        .querySelectorAll(".btn-tipo-grafica")
                        .forEach(btn =>
                            btn.classList.remove("activo")
                        );

                    boton.classList.add("activo");

                    tipoGraficaActual =
                        boton.dataset.tipo;

                    mostrarGraficaDistribucion();

                });

            });


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
       DISTRIBUCIÓN (GRÁFICA)
    ================================== */

    conteoEstados = {
        disponible: disponibles.length,
        apartado: apartadas.length,
        comprado: compradas.length
    };

    mostrarGraficaDistribucion();

}



/* =========================================
   GRÁFICA DE DISTRIBUCIÓN
   (pastel o barras, según lo elegido)
========================================= */

function mostrarGraficaDistribucion() {

    const lienzo =
        document.getElementById(
            "graficaDistribucion"
        );

    if (!lienzo || typeof Chart === "undefined") {
        return;
    }


    const etiquetas =
        ["Disponibles", "Apartadas", "Compradas"];

    const valores = [
        conteoEstados.disponible,
        conteoEstados.apartado,
        conteoEstados.comprado
    ];

    const colores =
        ["#d63384", "#f0b429", "#777777"];


    const esPastel =
        tipoGraficaActual === "pie";


    if (graficaDistribucion) {
        graficaDistribucion.destroy();
    }


    graficaDistribucion = new Chart(
        lienzo,
        {
            type: tipoGraficaActual,

            data: {
                labels: etiquetas,
                datasets: [{
                    label: "Prendas",
                    data: valores,
                    backgroundColor: colores,
                    borderColor: esPastel
                        ? "#ffffff"
                        : colores,
                    borderWidth: esPastel ? 3 : 0,
                    borderRadius: esPastel ? 0 : 8,
                    maxBarThickness: 70
                }]
            },

            options: {
                responsive: true,

                plugins: {
                    legend: {
                        display: esPastel,
                        position: "bottom",
                        labels: {
                            color: "#59404c",
                            usePointStyle: true,
                            padding: 18
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: contexto => {

                                const valor =
                                    esPastel
                                        ? contexto.parsed
                                        : contexto.parsed.y;

                                return ` ${contexto.label}: ${valor}`;

                            }
                        }
                    }
                },

                scales: esPastel
                    ? undefined
                    : {
                        x: {
                            grid: { display: false },
                            ticks: { color: "#806270" }
                        },
                        y: {
                            beginAtZero: true,
                            ticks: {
                                precision: 0,
                                color: "#806270"
                            },
                            grid: { color: "#f3e3ea" }
                        }
                    }
            }
        }
    );

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