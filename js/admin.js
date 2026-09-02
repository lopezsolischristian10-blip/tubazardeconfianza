document.addEventListener("DOMContentLoaded", () => {

    const form = document.getElementById("formProducto");

    const foto = document.getElementById("foto");

    const previewContainer =
        document.getElementById("previewContainer");

    const previewImagen =
        document.getElementById("previewImagen");

    const zonaImagen =
        document.getElementById("zonaImagen");

    const quitarImagen =
        document.getElementById("quitarImagen");

    const descripcion =
        document.getElementById("descripcion");

    const contadorCaracteres =
        document.getElementById("contadorCaracteres");

    const tablaProductos =
        document.getElementById("tablaProductos");

    const loader =
        document.getElementById("loaderAdmin");

    const sinProductos =
        document.getElementById("sinProductos");

    const totalProductos =
        document.getElementById("totalProductos");

    const tituloFormulario =
        document.getElementById("tituloFormulario");

    const btnGuardar =
        document.getElementById("btnGuardar");

    const btnCancelar =
        document.getElementById("btnCancelar");

    const productoId =
        document.getElementById("productoId");

    const estado =
        document.getElementById("estado");

    let productos = [];

    let idEliminar = null;



    /* ==========================================
       LEER RESPUESTA COMO JSON DE FORMA SEGURA
       (evita "Unexpected token '<'..." cuando el
       servidor responde con una página HTML de
       error en lugar de JSON)
    ========================================== */

    async function leerJSON(respuesta) {

        const tipoContenido =
            respuesta.headers.get("content-type") || "";

        const texto =
            await respuesta.text();

        if (!texto) {

            throw new Error(
                "El servidor no devolvió ninguna respuesta. " +
                "Si subiste una foto, intenta con una imagen " +
                "más ligera o revisa tu conexión."
            );

        }

        if (!tipoContenido.includes("application/json")) {

            throw new Error(
                "El servidor no respondió correctamente. " +
                "Intenta de nuevo en unos minutos."
            );

        }

        try {

            return JSON.parse(texto);

        } catch (error) {

            throw new Error(
                "No se pudo interpretar la respuesta del servidor."
            );

        }

    }



    /* ==========================================
       CARGAR PRODUCTOS
    ========================================== */

    async function cargarProductos() {

        loader.classList.remove("d-none");

        try {

            const respuesta =
                await fetch(
                    "/.netlify/functions/productos"
                );

            productos =
                await leerJSON(respuesta);

            if (!respuesta.ok) {
                throw new Error(
                    productos?.error ||
                    "No fue posible cargar las prendas."
                );
            }

            mostrarTabla();

        } catch (error) {

            console.error(error);

            mostrarToast(
                error.message ||
                "No fue posible cargar las prendas.",
                "error"
            );

        } finally {

            loader.classList.add("d-none");

        }

    }



    /* ==========================================
       MOSTRAR TABLA
    ========================================== */

    function mostrarTabla() {

        tablaProductos.innerHTML = "";

        totalProductos.textContent =
            `${productos.length} ${
                productos.length === 1
                    ? "prenda"
                    : "prendas"
            }`;


        if (productos.length === 0) {

            sinProductos.classList.remove("d-none");

            return;

        }

        sinProductos.classList.add("d-none");


        productos.forEach(producto => {

            const fila =
                document.createElement("tr");


            const imagen =
                producto.foto
                    ? `/.netlify/functions/imagen?key=${encodeURIComponent(producto.foto)}`
                    : "https://placehold.co/100x120/f9edf3/8e2855?text=Sin+imagen";


            fila.innerHTML = `

                <td>

                    <img
                        src="${imagen}"
                        alt="Prenda"
                        class="tabla-imagen"
                    >

                </td>


                <td>

                    <div class="descripcion-tabla">

                        ${escapeHTML(
                            producto.descripcion || ""
                        )}

                    </div>

                </td>


                <td>

                    <strong>
                        ${formatearPrecio(
                            producto.precio
                        )}
                    </strong>

                </td>


                <td>

                    ${escapeHTML(
                        producto.categoria || ""
                    )}

                </td>


                <td>

                    <span class="
                        estado
                        estado-${producto.estado}
                    ">

                        ${producto.estado}

                    </span>

                </td>


                <td>

                    <div class="acciones-tabla">

                        <button
                            class="btn-tabla btn-editar"
                            data-editar="${producto.id}"
                            title="Editar"
                        >

                            <i class="bi bi-pencil"></i>

                        </button>


                        <button
                            class="btn-tabla btn-eliminar"
                            data-eliminar="${producto.id}"
                            title="Eliminar"
                        >

                            <i class="bi bi-trash"></i>

                        </button>

                    </div>

                </td>

            `;


            tablaProductos.appendChild(fila);

        });


        agregarEventosTabla();

    }



    /* ==========================================
       EVENTOS TABLA
    ========================================== */

    function agregarEventosTabla() {

        document
            .querySelectorAll("[data-editar]")
            .forEach(boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        const id =
                            Number(
                                boton.dataset.editar
                            );

                        editarProducto(id);

                    }
                );

            });


        document
            .querySelectorAll("[data-eliminar]")
            .forEach(boton => {

                boton.addEventListener(
                    "click",
                    () => {

                        idEliminar =
                            Number(
                                boton.dataset.eliminar
                            );

                        const modal =
                            new bootstrap.Modal(
                                document.getElementById(
                                    "modalEliminar"
                                )
                            );

                        modal.show();

                    }
                );

            });

    }



    /* ==========================================
       EDITAR
    ========================================== */

    function editarProducto(id) {

        const producto =
            productos.find(
                p => Number(p.id) === id
            );

        if (!producto) return;


        productoId.value =
            producto.id;

        descripcion.value =
            producto.descripcion || "";

        document.getElementById("precio").value =
            producto.precio;

        document.getElementById("categoria").value =
            producto.categoria || "";

        estado.value =
            producto.estado;


        if (producto.foto) {

            previewImagen.src =
                `/.netlify/functions/imagen?key=${encodeURIComponent(producto.foto)}`;

            previewContainer.classList.remove(
                "d-none"
            );

            zonaImagen.classList.add(
                "d-none"
            );

        }


        tituloFormulario.textContent =
            "Editar prenda";

        btnGuardar.innerHTML =
            `<i class="bi bi-check-circle"></i>
             Actualizar prenda`;

        btnCancelar.classList.remove(
            "d-none"
        );


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    }



    /* ==========================================
       CANCELAR EDICIÓN
    ========================================== */

    btnCancelar.addEventListener(
        "click",
        limpiarFormulario
    );



    /* ==========================================
       GUARDAR / ACTUALIZAR
    ========================================== */

    form.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const id =
                productoId.value;


            const formData =
                new FormData();


            formData.append(
                "descripcion",
                descripcion.value
            );


            formData.append(
                "precio",
                document.getElementById(
                    "precio"
                ).value
            );


            formData.append(
                "categoria",
                document.getElementById(
                    "categoria"
                ).value
            );


            formData.append(
                "estado",
                estado.value
            );


            if (foto.files.length > 0) {

                formData.append(
                    "foto",
                    foto.files[0]
                );

            }


            if (id) {

                formData.append(
                    "id",
                    id
                );

            }


            btnGuardar.disabled = true;

            btnGuardar.innerHTML =
                `<span class="spinner-border spinner-border-sm"></span>
                 Guardando...`;


            try {

                const respuesta =
                    await fetch(
                        "/.netlify/functions/productos",
                        {
                            method: id
                                ? "PUT"
                                : "POST",

                            body: formData
                        }
                    );


                const resultado =
                    await leerJSON(respuesta);


                if (!respuesta.ok) {

                    throw new Error(
                        resultado.error ||
                        "Error al guardar"
                    );

                }


                mostrarToast(
                    id
                        ? "Prenda actualizada correctamente. 💗"
                        : "Prenda agregada correctamente. 💗",
                    "success"
                );


                limpiarFormulario();

                await cargarProductos();


            } catch (error) {

                console.error(error);

                mostrarToast(
                    error.message ||
                    "No fue posible guardar la prenda.",
                    "error"
                );

            } finally {

                btnGuardar.disabled = false;

            }

        }
    );



    /* ==========================================
       ELIMINAR
    ========================================== */

    document
        .getElementById(
            "btnConfirmarEliminar"
        )
        .addEventListener(
            "click",
            async () => {

                if (!idEliminar) return;


                try {

                    const respuesta =
                        await fetch(
                            "/.netlify/functions/productos",
                            {
                                method: "DELETE",

                                headers: {
                                    "Content-Type":
                                        "application/json"
                                },

                                body: JSON.stringify({
                                    id: idEliminar
                                })
                            }
                        );


                    const resultado =
                        await leerJSON(respuesta);


                    if (!respuesta.ok) {

                        throw new Error(
                            resultado.error
                        );

                    }


                    bootstrap.Modal
                        .getInstance(
                            document.getElementById(
                                "modalEliminar"
                            )
                        )
                        .hide();


                    mostrarToast(
                        "Prenda eliminada correctamente.",
                        "success"
                    );


                    idEliminar = null;

                    await cargarProductos();


                } catch (error) {

                    mostrarToast(
                        error.message ||
                        "No fue posible eliminar la prenda.",
                        "error"
                    );

                }

            }
        );



    /* ==========================================
       VISTA PREVIA
    ========================================== */

    foto.addEventListener(
        "change",
        () => {

            const archivo =
                foto.files[0];

            if (!archivo) return;


            if (
                !archivo.type.startsWith(
                    "image/"
                )
            ) {

                mostrarToast(
                    "Selecciona una imagen válida.",
                    "error"
                );

                foto.value = "";

                return;

            }


            const lector =
                new FileReader();


            lector.onload =
                event => {

                    previewImagen.src =
                        event.target.result;

                    previewContainer.classList.remove(
                        "d-none"
                    );

                    zonaImagen.classList.add(
                        "d-none"
                    );

                };


            lector.readAsDataURL(
                archivo
            );

        }
    );



    /* ==========================================
       QUITAR IMAGEN
    ========================================== */

    quitarImagen.addEventListener(
        "click",
        () => {

            foto.value = "";

            previewImagen.src = "";

            previewContainer.classList.add(
                "d-none"
            );

            zonaImagen.classList.remove(
                "d-none"
            );

        }
    );



    /* ==========================================
       CONTADOR
    ========================================== */

    descripcion.addEventListener(
        "input",
        () => {

            contadorCaracteres.textContent =
                descripcion.value.length;

        }
    );



    /* ==========================================
       LIMPIAR
    ========================================== */

    function limpiarFormulario() {

        form.reset();

        productoId.value = "";

        foto.value = "";

        previewImagen.src = "";

        previewContainer.classList.add(
            "d-none"
        );

        zonaImagen.classList.remove(
            "d-none"
        );

        contadorCaracteres.textContent =
            "0";


        tituloFormulario.textContent =
            "Agregar nueva prenda";

        btnGuardar.innerHTML =
            `<i class="bi bi-plus-circle"></i>
             Guardar prenda`;

        btnCancelar.classList.add(
            "d-none"
        );

    }



    /* ==========================================
       PRECIO
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
       ESCAPAR HTML
    ========================================== */

    function escapeHTML(texto) {

        const div =
            document.createElement("div");

        div.textContent = texto;

        return div.innerHTML;

    }



    /* ==========================================
       TOAST
    ========================================== */

    function mostrarToast(
        mensaje,
        tipo
    ) {

        const toast =
            document.getElementById(
                "toastAdmin"
            );

        const mensajeElemento =
            document.getElementById(
                "toastMensaje"
            );


        mensajeElemento.textContent =
            mensaje;


        toast.classList.remove(
            "text-bg-danger",
            "text-bg-success"
        );


        toast.classList.add(
            tipo === "error"
                ? "text-bg-danger"
                : "text-bg-success"
        );


        new bootstrap.Toast(
            toast
        ).show();

    }



    /* ==========================================
       INICIO
    ========================================== */

    cargarProductos();

});