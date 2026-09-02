import { getDatabase } from "@netlify/database";
import { getStore } from "@netlify/blobs";


export default async (req) => {

    try {

        const db = getDatabase();

        const store = getStore("ropa");


        /* ==========================================
           GET
        ========================================== */

        if (req.method === "GET") {

            const resultado = await db.sql`

                SELECT
                    id,
                    foto,
                    descripcion,
                    precio,
                    categoria,
                    estado

                FROM productos

                ORDER BY id DESC

            `;


            return respuestaJSON(
                resultado.rows
            );

        }



        /* ==========================================
           POST
        ========================================== */

        if (req.method === "POST") {

            const formData =
                await req.formData();


            const descripcion =
                formData.get(
                    "descripcion"
                );

            const precio =
                formData.get(
                    "precio"
                );

            const categoria =
                formData.get(
                    "categoria"
                );

            const estado =
                formData.get(
                    "estado"
                );

            const archivo =
                formData.get(
                    "foto"
                );


            if (
                !descripcion ||
                !precio ||
                !categoria ||
                !estado
            ) {

                return respuestaError(
                    "Todos los campos son obligatorios.",
                    400
                );

            }


            let nombreFoto = null;


            /*
             * GUARDAR IMAGEN EN NETLIFY BLOBS
             */

            if (
                archivo &&
                typeof archivo !== "string" &&
                archivo.size > 0
            ) {

                nombreFoto =
                    crearNombreImagen(
                        archivo.name
                    );


                const buffer =
                    await archivo.arrayBuffer();


                await store.set(
                    nombreFoto,
                    buffer,
                    {
                        metadata: {
                            contentType:
                                archivo.type
                        }
                    }
                );

            }


            /*
             * INSERTAR PRODUCTO
             */

            const resultado =
                await db.sql`

                INSERT INTO productos
                (
                    foto,
                    descripcion,
                    precio,
                    categoria,
                    estado
                )

                VALUES
                (
                    ${nombreFoto},
                    ${descripcion},
                    ${Number(precio)},
                    ${categoria},
                    ${estado}
                )

                RETURNING
                    id,
                    foto,
                    descripcion,
                    precio,
                    categoria,
                    estado

            `;


            return respuestaJSON(
                resultado.rows[0],
                201
            );

        }



        /* ==========================================
           PUT
        ========================================== */

        if (req.method === "PUT") {

            const formData =
                await req.formData();


            const id =
                Number(
                    formData.get("id")
                );


            if (!id) {

                return respuestaError(
                    "ID inválido.",
                    400
                );

            }


            const descripcion =
                formData.get(
                    "descripcion"
                );

            const precio =
                formData.get(
                    "precio"
                );

            const categoria =
                formData.get(
                    "categoria"
                );

            const estado =
                formData.get(
                    "estado"
                );

            const archivo =
                formData.get(
                    "foto"
                );


            /*
             * OBTENER PRODUCTO ACTUAL
             */

            const actual =
                await db.sql`

                SELECT
                    foto

                FROM productos

                WHERE id = ${id}

            `;


            if (
                actual.rows.length === 0
            ) {

                return respuestaError(
                    "La prenda no existe.",
                    404
                );

            }


            let nombreFoto =
                actual.rows[0].foto;


            /*
             * SI SUBIÓ UNA NUEVA IMAGEN
             */

            if (
                archivo &&
                typeof archivo !== "string" &&
                archivo.size > 0
            ) {

                /*
                 * Eliminar imagen anterior
                 */

                if (nombreFoto) {

                    try {

                        await store.delete(
                            nombreFoto
                        );

                    } catch (error) {

                        console.error(
                            "No se pudo eliminar la imagen anterior:",
                            error
                        );

                    }

                }


                /*
                 * Crear nueva imagen
                 */

                nombreFoto =
                    crearNombreImagen(
                        archivo.name
                    );


                const buffer =
                    await archivo.arrayBuffer();


                await store.set(
                    nombreFoto,
                    buffer,
                    {
                        metadata: {
                            contentType:
                                archivo.type
                        }
                    }
                );

            }


            /*
             * ACTUALIZAR
             */

            const resultado =
                await db.sql`

                UPDATE productos

                SET
                    foto = ${nombreFoto},
                    descripcion = ${descripcion},
                    precio = ${Number(precio)},
                    categoria = ${categoria},
                    estado = ${estado}

                WHERE id = ${id}

                RETURNING
                    id,
                    foto,
                    descripcion,
                    precio,
                    categoria,
                    estado

            `;


            return respuestaJSON(
                resultado.rows[0]
            );

        }



        /* ==========================================
           DELETE
        ========================================== */

        if (req.method === "DELETE") {

            const body =
                await req.json();


            const id =
                Number(body.id);


            if (!id) {

                return respuestaError(
                    "ID inválido.",
                    400
                );

            }


            /*
             * Obtener imagen
             */

            const actual =
                await db.sql`

                SELECT
                    foto

                FROM productos

                WHERE id = ${id}

            `;


            if (
                actual.rows.length === 0
            ) {

                return respuestaError(
                    "La prenda no existe.",
                    404
                );

            }


            const nombreFoto =
                actual.rows[0].foto;


            /*
             * Eliminar producto
             */

            await db.sql`

                DELETE FROM productos

                WHERE id = ${id}

            `;


            /*
             * Eliminar imagen
             */

            if (nombreFoto) {

                try {

                    await store.delete(
                        nombreFoto
                    );

                } catch (error) {

                    console.error(
                        "No se pudo eliminar la imagen:",
                        error
                    );

                }

            }


            return respuestaJSON({
                mensaje:
                    "Producto eliminado correctamente."
            });

        }


        return respuestaError(
            "Método no permitido.",
            405
        );


    } catch (error) {

        console.error(error);

        const detalle =
            error?.cause?.message ||
            error?.message ||
            String(error);

        return respuestaError(
            `Error interno del servidor: ${detalle}`,
            500
        );

    }

};



/* ==========================================
   CREAR NOMBRE DE IMAGEN
========================================== */

function crearNombreImagen(
    nombreOriginal
) {

    const extension =
        nombreOriginal
            .split(".")
            .pop()
            .toLowerCase();


    const nombre =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`;


    return `prendas/${nombre}`;

}



/* ==========================================
   RESPUESTAS
========================================== */

function respuestaJSON(
    datos,
    status = 200
) {

    return new Response(
        JSON.stringify(datos),
        {
            status,

            headers: {
                "Content-Type":
                    "application/json"
            }
        }
    );

}


function respuestaError(
    mensaje,
    status
) {

    return respuestaJSON(
        {
            error: mensaje
        },
        status
    );

}