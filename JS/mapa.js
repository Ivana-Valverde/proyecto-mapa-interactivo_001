document.addEventListener('DOMContentLoaded', () => {

    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    });

    // 1. INICIALIZAR MAPA
   
    const miMapa = L.map('mapa-interactivo-ia').setView([-9.19, -75.01], 5);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(miMapa);

    // 2. PIN DE BIENVENIDA en Lima

    L.marker([-12.0463, -77.0427]).addTo(miMapa)
        .bindPopup('<b>Bienvenidos a Perú 3D</b><br>Haz clic en cualquier región para empezar.')
        .openPopup();


    // 3. CLIC EN EL MAPA → Pin + Captura región

    let pinActual      = null;
    let coordsActuales = null;

    miMapa.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        coordsActuales = { lat, lng };

        if (pinActual) miMapa.removeLayer(pinActual);

        pinActual = L.marker([lat, lng]).addTo(miMapa)
            .bindPopup('📍 Consultando región...')
            .openPopup();

        const inputRegion = document.getElementById('region-seleccionada');
        inputRegion.value = `Cargando... (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

        try {
            const url  = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=es`;
            const res  = await fetch(url);
            const data = await res.json();
            const addr = data.address || {};

            const region   = addr.state || addr.region || addr.county || addr.country || 'Región desconocida';
            const ciudad   = addr.city  || addr.town  || addr.village || '';
            const etiqueta = ciudad ? `${ciudad}, ${region}` : region;

            inputRegion.value = etiqueta;
            pinActual.setPopupContent(`📍 <b>${etiqueta}</b>`).openPopup();

        } catch {
            inputRegion.value = `(${lat.toFixed(4)}, ${lng.toFixed(4)})`;
            pinActual.setPopupContent('📍 No se pudo identificar la región').openPopup();
        }
    });

    // 4. SLIDER → Actualiza texto días

    const slider  = document.getElementById('duracion-viaje');
    const txtDias = document.getElementById('txt-duracion');

    slider.addEventListener('input', () => {
        txtDias.textContent = `${slider.value} día${slider.value > 1 ? 's' : ''}`;
    });

    // 5. BOTONES OPCIÓN → Toggle activo

    document.querySelectorAll('.opciones-botones').forEach(grupo => {
        grupo.querySelectorAll('.btn-opcion').forEach(btn => {
            btn.addEventListener('click', () => {
                grupo.querySelectorAll('.btn-opcion').forEach(b => b.classList.remove('activo'));
                btn.classList.add('activo');
            });
        });
    });

    // 6. GENERAR EXPERIENCIA IA

    document.getElementById('form-filtros-ia').addEventListener('submit', async (e) => {
        e.preventDefault();

        const region      = document.getElementById('region-seleccionada').value;
        const dias        = document.getElementById('duracion-viaje').value;
        const compania    = document.querySelector('#form-filtros-ia .campo-grupo:nth-child(3) .btn-opcion.activo')?.textContent?.trim() || 'No especificado';
        const presupuesto = document.querySelector('#form-filtros-ia .campo-grupo:nth-child(4) .btn-opcion.activo')?.textContent?.trim() || 'No especificado';

        if (!coordsActuales && region.includes('Ninguna')) {
            alert('Primero haz clic en el mapa para seleccionar una región 📍');
            return;
        }

        const btnGenerar = document.getElementById('btn-generar-experiencia');
        const contenedor = document.getElementById('resultado-itinerario');

        btnGenerar.disabled    = true;
        btnGenerar.textContent = '⏳ Generando ruta...';
        contenedor.innerHTML   = `
            <div class="estado-vacio">
                <span class="icono-guia">🔄</span>
                <p>La IA está construyendo tu itinerario personalizado...</p>
            </div>`;

        try {
            const response = await fetch('http://localhost:3000/api/itinerario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ region, dias, compania, presupuesto })
            });

            const data = await response.json();
            if (!data.itinerario) throw new Error('Respuesta vacía');

            renderizarItinerario(data.itinerario, miMapa, coordsActuales);

        } catch (err) {
            console.error('Error al generar itinerario:', err);
            contenedor.innerHTML = `
                <div class="estado-vacio">
                    <span class="icono-guia">❌</span>
                    <p>Error al generar el itinerario. ¿Está corriendo el servidor?</p>
                </div>`;
        } finally {
            btnGenerar.disabled  = false;
            btnGenerar.innerHTML = '<span class="icono-chispa">✨</span> Generar experiencia';
        }
    });

    // 7. RENDERIZAR TARJETAS + POPUPS RICOS

    function renderizarItinerario(itinerario, mapa, coords) {
        const contenedor = document.getElementById('resultado-itinerario');
        contenedor.innerHTML = '';

        // Limpiar pines anteriores
        if (window._pinesItinerario) {
            window._pinesItinerario.forEach(p => mapa.removeLayer(p));
        }
        window._pinesItinerario = [];

        itinerario.forEach((dia, index) => {

            // Tarjeta lateral 
            const tarjeta = document.createElement('div');
            tarjeta.className = 'tarjeta-itinerario-ia';
            tarjeta.style.cursor = 'pointer';
            tarjeta.innerHTML = `
                <h3>Día ${dia.dia}: ${dia.titulo}</h3>
                <p>${dia.actividades}</p>
                <p><strong>🍽️ Gastronomía:</strong> ${dia.gastronomia}</p>
                <p><strong>💡 Tip:</strong> ${dia.tip}</p>
            `;
            contenedor.appendChild(tarjeta);

            // Pin en el mapa
            if (coords) {
                const offsetLat = coords.lat + (index * 0.08);
                const offsetLng = coords.lng + (index * 0.05);

                const popupHTML = `
                <div style="
                    font-family: 'Helvetica Neue', Arial, sans-serif;
                    width: 280px;
                    box-sizing: border-box;
                ">
                    <div style="
                        background: #c85a17;
                        color: white;
                        padding: 10px 14px;
                        margin: -13px -20px 12px -20px;
                        border-radius: 10px 10px 0 0;
                        font-weight: 700;
                        font-size: 13px;
                        word-wrap: break-word;
                        white-space: normal;
                        line-height: 1.4;
                    ">
                        📅 Día ${dia.dia}: ${dia.titulo}
                    </div>
                    <p style="font-size: 12px; color: #2c2520; margin: 0 0 10px 0; line-height: 1.5;">
                        ${dia.actividades}
                    </p>
                    <div style="
                        background: #fdf6f0;
                        border-left: 3px solid #c85a17;
                        padding: 8px 10px;
                        margin-bottom: 8px;
                        border-radius: 0 6px 6px 0;
                        font-size: 12px;
                        color: #2c2520;
                        word-wrap: break-word;
                    ">
                        🍽️ <strong>Gastronomía:</strong> ${dia.gastronomia}
                    </div>
                    <div style="
                        background: #fffbf0;
                        border-left: 3px solid #f6c144;
                        padding: 8px 10px;
                        border-radius: 0 6px 6px 0;
                        font-size: 12px;
                        color: #2c2520;
                        word-wrap: break-word;
                    ">
                        💡 <strong>Tip:</strong> ${dia.tip}
                    </div>
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        margin-top: 12px;
                        gap: 6px;
                    ">
                        ${index > 0 ? `
                        <button onclick="navegarDia(${index - 1})" style="
                            flex: 1;
                            padding: 6px;
                            background: #f7fafc;
                            border: 1px solid #e2e8f0;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 12px;
                            color: #1e3a5f;
                            font-weight: 600;
                        ">← Día ${dia.dia - 1}</button>` : '<div style="flex:1"></div>'}
                        ${index < itinerario.length - 1 ? `
                        <button onclick="navegarDia(${index + 1})" style="
                            flex: 1;
                            padding: 6px;
                            background: #c85a17;
                            border: none;
                            border-radius: 6px;
                            cursor: pointer;
                            font-size: 12px;
                            color: white;
                            font-weight: 600;
                        ">Día ${dia.dia + 1} →</button>` : '<div style="flex:1"></div>'}
                    </div>
                </div>`;

                const pin = L.marker([offsetLat, offsetLng])
                    .addTo(mapa)
                    .bindPopup(popupHTML, {
                        maxWidth: 300,
                        className: 'popup-peru3d'
                    });

                window._pinesItinerario.push(pin);

                // Al hacer clic en la tarjeta lateral → abre el popup del pin
                tarjeta.addEventListener('click', () => {
                    mapa.flyTo([offsetLat, offsetLng], 10, { duration: 1 });
                    setTimeout(() => pin.openPopup(), 800);
                });
            }
        });

        // Abrir automáticamente el popup del Día 1 al generar
        if (window._pinesItinerario.length > 0 && coords) {
            const primerPin = window._pinesItinerario[0];
            const offsetLat = coords.lat;
            const offsetLng = coords.lng;
            setTimeout(() => {
                mapa.flyTo([offsetLat, offsetLng], 9, { duration: 1.5 });
                setTimeout(() => primerPin.openPopup(), 1500);
            }, 300);
        }

        // Función global para navegar entre días desde los botones del popup
        window.navegarDia = (index) => {
            if (!window._pinesItinerario[index] || !coords) return;
            const pin = window._pinesItinerario[index];
            const offsetLat = coords.lat + (index * 0.08);
            const offsetLng = coords.lng + (index * 0.05);
            mapa.flyTo([offsetLat, offsetLng], 10, { duration: 0.8 });
            setTimeout(() => pin.openPopup(), 800);

            // Resaltar tarjeta lateral correspondiente
            document.querySelectorAll('.tarjeta-itinerario-ia').forEach((t, i) => {
                t.style.outline = i === index ? '2px solid #c85a17' : 'none';
                t.style.boxShadow = i === index ? '0 0 0 2px #c85a17' : '';
                if (i === index) t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });
        };

        // Resaltar tarjeta al abrir popup
        window._pinesItinerario.forEach((pin, index) => {
            pin.on('popupopen', () => {
                document.querySelectorAll('.tarjeta-itinerario-ia').forEach((t, i) => {
                    t.style.outline = i === index ? '2px solid #c85a17' : 'none';
                    t.style.boxShadow = i === index ? '0 0 0 2px #c85a17' : '';
                    if (i === index) t.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });
            });
            pin.on('popupclose', () => {
                document.querySelectorAll('.tarjeta-itinerario-ia').forEach(t => {
                    t.style.outline = 'none';
                    t.style.boxShadow = '';
                });
            });
        });
    }

});