// seleccionamos botones
const botonesFiltro = document.querySelectorAll(".filtro");

// seleccionamos todas las tarjetas
const tarjetas = document.querySelectorAll(".tarjeta-plato");

// recorremos los botones

botonesFiltro.forEach(boton => {


    boton.addEventListener("click", () => {

        // quitar selección anterior

        botonesFiltro.forEach(btn => {

            btn.classList.remove("activo");

        });



        // marcar botón seleccionado

        boton.classList.add("activo");



        // obtenemos la región del botón

        let region = boton.dataset.region;




        // recorremos las tarjetas

        tarjetas.forEach(tarjeta => {



            // si es todos muestra todo

            if(region === "todos"){

                tarjeta.style.display = "block";

            }



            // si coincide la región muestra

            else if(tarjeta.classList.contains(region)){


                tarjeta.style.display = "block";


            }



            // si no coincide oculta

            else{


                tarjeta.style.display = "none";


            }



        });



    });



});


// BUSCADOR

const buscador = document.querySelector(".buscador");



buscador.addEventListener("keyup", () => {


    // texto que escribe el usuario

    let texto = buscador.value.toLowerCase();



    tarjetas.forEach(tarjeta => {



        // texto completo de la tarjeta

        let contenido = tarjeta.textContent.toLowerCase();



        // compara la búsqueda

        if(contenido.includes(texto)){


            tarjeta.style.display = "block";


        }else{


            tarjeta.style.display = "none";


        }



    });



});

// RESEÑAS DE LOS PLATOS

const botonesResena = document.querySelectorAll(".leer");


botonesResena.forEach(boton => {


    boton.addEventListener("click", (e) => {

        


        e.preventDefault();


        // obtiene la tarjeta donde se hizo click

        const tarjetaActual = boton.closest(".tarjeta-plato");



        // cerrar todas las demás tarjetas

        tarjetas.forEach(tarjeta => {


            if(tarjeta !== tarjetaActual){

                tarjeta.classList.remove("activa");

            }


        });



        // abrir o cerrar la tarjeta seleccionada

        tarjetaActual.classList.toggle("activa");



    });


});

