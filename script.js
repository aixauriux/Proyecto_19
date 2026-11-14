
const agregar = document.getElementById("agregar");
const formulario = document.getElementById("formulario");
const formSubreddit = document.getElementById("formSubreddit");
const cancelar = document.getElementById("cancelar");
const nombre = document.getElementById("nombre");
const mensaje = document.getElementById("mensaje");
const carriles = document.getElementById("carriles");
const vacio = document.getElementById("vacio");
const botonGuardar = document.getElementById("guardar");

const API = "https://jsonplaceholder.typicode.com";

let comunidades = [];

// Recuperar carriles guardados
try {
    const datos = JSON.parse(
        localStorage.getItem("usuariosJSON") || "[]"
    );

    if (Array.isArray(datos)) {
        comunidades = [...new Set(
            datos.filter(id =>
                Number.isInteger(id) && id >= 1 && id <= 10
            )
        )];
    }
} catch (error) {
    comunidades = [];
}

// Guardar carriles
function guardarComunidades() {
    localStorage.setItem(
        "usuariosJSON",
        JSON.stringify(comunidades)
    );
}

// Mostrar mensaje cuando no hay carriles
function revisarVacio() {
    vacio.classList.toggle(
        "oculto",
        comunidades.length > 0
    );
}

// Abrir formulario
agregar.addEventListener("click", () => {
    formulario.classList.remove("oculto");
    mensaje.textContent = "";
    nombre.placeholder = "Ejemplo: 1";
    nombre.focus();
});

// Cerrar formulario
cancelar.addEventListener("click", () => {
    formulario.classList.add("oculto");
    nombre.value = "";
    mensaje.textContent = "";
});

// Consultar publicaciones del usuario
async function consultar(id, contenido) {
    contenido.replaceChildren();

    const estado = document.createElement("p");
    estado.className = "estado";
    estado.textContent = "Cargando publicaciones...";
    contenido.appendChild(estado);

    try {
        const respuesta = await fetch(
            `${API}/posts?userId=${id}`
        );

        if (!respuesta.ok) {
            throw new Error("Error al consultar publicaciones");
        }

        const publicaciones = await respuesta.json();

        contenido.replaceChildren();

        if (publicaciones.length === 0) {
            estado.textContent = "No hay publicaciones.";
            contenido.appendChild(estado);
            return;
        }

        publicaciones.forEach(post => {
            const articulo = document.createElement("article");
            articulo.className = "publicacion";

            const titulo = document.createElement("a");
            titulo.textContent = post.title;
            titulo.href = `${API}/posts/${post.id}`;
            titulo.target = "_blank";
            titulo.rel = "noopener noreferrer";

            const autor = document.createElement("p");
            autor.textContent = "Usuario: " + post.userId;

            const descripcion = document.createElement("p");
            descripcion.textContent = post.body;

            articulo.appendChild(titulo);
            articulo.appendChild(autor);
            articulo.appendChild(descripcion);

            contenido.appendChild(articulo);
        });

    } catch (error) {
        contenido.replaceChildren();

        estado.className = "estado error";
        estado.textContent =
            "No se pudieron cargar las publicaciones.";

        contenido.appendChild(estado);
    }
}

// Crear carril
function crearCarril(usuario) {
    const carril = document.createElement("section");
    carril.className = "carril";

    const cabecera = document.createElement("section");
    cabecera.className = "cabecera";

    const titulo = document.createElement("h3");
    titulo.textContent = usuario.name;

    const menu = document.createElement("section");
    menu.className = "menu";

    const botonMenu = document.createElement("button");
    botonMenu.className = "botonMenu";
    botonMenu.textContent = "⋮";
    botonMenu.setAttribute("aria-label", "Opciones");
    botonMenu.setAttribute("aria-expanded", "false");

    const opciones = document.createElement("section");
    opciones.className = "opciones oculto";

    const actualizar = document.createElement("button");
    actualizar.textContent = "Actualizar";

    const eliminar = document.createElement("button");
    eliminar.textContent = "Eliminar";

    const contenido = document.createElement("section");

    botonMenu.addEventListener("click", () => {
        const oculto = opciones.classList.toggle("oculto");
        botonMenu.setAttribute("aria-expanded", String(!oculto));
    });

    actualizar.addEventListener("click", () => {
        opciones.classList.add("oculto");
        botonMenu.setAttribute("aria-expanded", "false");
        consultar(usuario.id, contenido);
    });

    eliminar.addEventListener("click", () => {
        carril.remove();

        comunidades = comunidades.filter(
            id => id !== usuario.id
        );

        guardarComunidades();
        revisarVacio();
    });

    opciones.appendChild(actualizar);
    opciones.appendChild(eliminar);

    menu.appendChild(botonMenu);
    menu.appendChild(opciones);

    cabecera.appendChild(titulo);
    cabecera.appendChild(menu);

    carril.appendChild(cabecera);
    carril.appendChild(contenido);

    carriles.appendChild(carril);

    consultar(usuario.id, contenido);
}

// Buscar usuario por ID
async function buscarUsuario(id) {
    const respuesta = await fetch(`${API}/users/${id}`);

    if (!respuesta.ok) {
        throw new Error("El usuario no existe.");
    }

    const usuario = await respuesta.json();

    if (!usuario.id || !usuario.name) {
        throw new Error("Usuario no encontrado.");
    }

    return usuario;
}

// Agregar nuevo carril
formSubreddit.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const valor = nombre.value.trim();
    mensaje.textContent = "";

    if (!/^\d+$/.test(valor) ||
        Number(valor) < 1 || Number(valor) > 10) {
        mensaje.textContent =
            "Ingresa un número de usuario del 1 al 10.";
        return;
    }

    const id = Number(valor);

    if (comunidades.includes(id)) {
        mensaje.textContent = "Este usuario ya fue agregado.";
        return;
    }

    botonGuardar.disabled = true;
    botonGuardar.textContent = "Buscando...";

    try {
        const usuario = await buscarUsuario(id);

        comunidades.push(id);
        guardarComunidades();

        crearCarril(usuario);
        revisarVacio();

        nombre.value = "";
        formulario.classList.add("oculto");

    } catch (error) {
        mensaje.textContent =
            "No se pudo encontrar el usuario. Intenta nuevamente.";
    } finally {
        botonGuardar.disabled = false;
        botonGuardar.textContent = "Agregar comunidad";
    }
});

// Restaurar carriles guardados
async function restaurarCarriles() {
    for (const id of comunidades) {
        try {
            const usuario = await buscarUsuario(id);
            crearCarril(usuario);
        } catch (error) {
            console.error("Error al restaurar usuario:", id);
        }
    }

    revisarVacio();
}

restaurarCarriles();
