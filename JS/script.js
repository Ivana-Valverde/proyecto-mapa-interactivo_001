const zonas = document.querySelectorAll(".zona");
const mapa = document.querySelector("svg");

zonas.forEach(zona => {

    zona.addEventListener("click", () => {

        zonas.forEach(z => z.classList.remove("activo"));
        zona.classList.add("activo");

        const idZona = zona.id;
        const region = regiones[idZona];

        if (!region) return;

        document.getElementById("nombreRegion").textContent = region.nombre;
        document.getElementById("subtituloRegion").textContent = region.subtitulo;

        document.getElementById("descripcionRegion").innerHTML = region.descripcion;

        document.getElementById("imgPrincipal").src = region.imagenPrincipal;

        document.getElementById("lugaresTuristicos").innerHTML = region.lugares;

    });

});



