document.addEventListener('DOMContentLoaded', () => {
    const focusSlider = document.getElementById('focus-slider');
    const isoSlider = document.getElementById('iso-slider');
    const zoomSlider = document.getElementById('zoom-slider');
    const subjectSelect = document.getElementById('subject-select');
    const shutterSlider = document.getElementById('shutter-slider');
    
    // Labels
    const valAperture = document.getElementById('val-aperture');
    const valShutter = document.getElementById('val-shutter');
    const valIso = document.getElementById('val-iso');
    const valZoom = document.getElementById('val-zoom');
    
    // Exposímetro
    const exposureIndicator = document.getElementById('exposure-indicator');
    const exposureStatus = document.getElementById('exposure-status');

    const layers = document.querySelectorAll('.layer');
    const grainOverlay = document.querySelector('.grain-overlay');
    const sceneContainer = document.querySelector('.scene-container');
    const motionBlurNode = document.getElementById('motionBlurNode');
    
    const subjectSvgs = {
        'standing': document.getElementById('subject-standing'),
        'running': document.getElementById('subject-running'),
        'car': document.getElementById('subject-car')
    };

    // Velocidades base para calcular el desenfoque de movimiento
    const subjectSpeeds = {
        'standing': 0,    // No se mueve
        'running': 1,     // Velocidad normal
        'car': 4          // Muy rápido
    };
    let currentSubjectSpeed = 0;

    // Intensidad máxima del desenfoque en píxeles (aumentada para mayor impacto)
    const maxBlur = 24; 
    
    // El punto de enfoque ahora está fijo en la persona (Capa 6, profundidad 1)
    const focalPoint = 1;
    
    let currentApertureStops = 4;
    let currentIsoStops = 0;
    let currentShutterStops = 5;

    function updateBlur() {
        // Invertir el valor para que f/1.4 esté a la izquierda (valor 0) y f/22 a la derecha (valor 100)
        const invertedFocusValue = 100 - parseFloat(focusSlider.value);
        // Intensidad del efecto (Apertura simulada / multiplicador de 0 a 1)
        const blurIntensity = invertedFocusValue / 100;
        
        currentApertureStops = blurIntensity * 8;
        const fStops = [22, 16, 11, 8, 5.6, 4, 2.8, 2, 1.4];
        const stopIndex = Math.min(8, Math.max(0, Math.round(blurIntensity * 8)));
        const fNumber = fStops[stopIndex];
        valAperture.textContent = `f/${fNumber % 1 === 0 ? fNumber : fNumber.toFixed(1)}`;

        layers.forEach(layer => {
            const layerDepth = parseFloat(layer.getAttribute('data-depth'));
            
            // Distancia en "capas" desde el sujeto (va de 0 a 5)
            const distanceInLayers = Math.abs(layerDepth - focalPoint);

            let blurAmount = 0;

            if (distanceInLayers > 0) {
                // CÁLCULO MATEMÁTICO DE SEPARACIÓN GRADUAL
                // Usamos la distancia de la capa normalizada (de 0 a 5) y la elevamos ligeramente (1.2)
                // para que el desenfoque empiece suave y acelere matemáticamente hacia el fondo.
                // Esto garantiza una separación visual perfecta y gradual entre cada una de las capas.
                const mathematicalFactor = Math.pow(distanceInLayers / 5, 1.2);
                
                blurAmount = mathematicalFactor * maxBlur * blurIntensity;
            }

            // Aplicamos el filtro de desenfoque
            layer.style.filter = `blur(${blurAmount}px)`;
            
            // Ligera expansión del bokeh (seteado en variable CSS)
            const bokehScale = 1 + (blurAmount * 0.003);
            layer.style.setProperty('--bokeh-scale', bokehScale);
        });
        
        calculateExposure();
    }

    function updateISO() {
        const isoValue = parseFloat(isoSlider.value);
        
        // Calcular pasos de ISO: 100 = 0 stops, 6400 = 6 stops
        currentIsoStops = Math.log2(isoValue / 100);
        valIso.textContent = `ISO ${isoValue}`;
        
        const minISO = 100;
        const maxISO = 6400;
        const grainOpacity = (isoValue - minISO) / (maxISO - minISO);

        grainOverlay.style.opacity = grainOpacity;
        
        calculateExposure();
    }

    function updateZoom() {
        const zoomValue = parseFloat(zoomSlider.value);
        valZoom.textContent = `${zoomValue.toFixed(1)}x`;
        
        const selectedSubject = subjectSelect.value;
        // Origen del zoom dinámico: 
        // Si no es el carro, enfocamos en el cuello del modelo (aprox 32% en X, 64% en Y)
        let dollyOrigin = '30% 70%';
        if (selectedSubject !== 'car') {
            dollyOrigin = '32% 64%';
        }
        
        layers.forEach(layer => {
            const layerDepth = parseFloat(layer.getAttribute('data-depth'));
            const distanceInLayers = Math.abs(layerDepth - focalPoint);
            
            const depthMultiplier = 1 + (distanceInLayers * 0.5); 
            const dollyScale = 1 + (zoomValue - 1) * depthMultiplier;
            
            layer.style.setProperty('--dolly-origin', dollyOrigin);
            layer.style.setProperty('--dolly-scale', dollyScale);
        });
    }

    function updateSubject() {
        const selected = subjectSelect.value;
        currentSubjectSpeed = subjectSpeeds[selected];
        
        // Ocultar todos los sujetos y mostrar solo el seleccionado
        Object.keys(subjectSvgs).forEach(key => {
            if (subjectSvgs[key]) {
                subjectSvgs[key].style.display = (key === selected) ? 'block' : 'none';
            }
        });
        
        // Recalcular el desenfoque porque la velocidad del sujeto cambió
        updateShutter();
        updateZoom();
    }

    function updateShutter() {
        const shutterValue = parseFloat(shutterSlider.value);
        const invertedShutterValue = 100 - shutterValue;
        
        // Calcular pasos de Velocidad con el valor invertido
        currentShutterStops = (invertedShutterValue / 100) * 10;
        
        const timeInSeconds = (1/1000) * Math.pow(2, currentShutterStops);
        if (timeInSeconds >= 1) {
            valShutter.textContent = `${timeInSeconds.toFixed(1)}s`;
        } else {
            valShutter.textContent = `1/${Math.round(1/timeInSeconds)}s`;
        }
        
        const maxMotionBlur = 20; 
        const blurX = (invertedShutterValue / 100) * currentSubjectSpeed * maxMotionBlur;
        motionBlurNode.setAttribute('stdDeviation', `${blurX} 0`);
        
        calculateExposure();
    }

    function calculateExposure() {
        // Combinamos la ganancia de luz de la Apertura, el Obturador y el ISO.
        // Base de exposición (para que el medio de los sliders sea EV 0).
        // Si f=5.6 (4 stops), Vel=1/30 (5 stops), ISO=400 (2 stops) -> Suma = 11
        const baseStops = 11;
        const totalEV = (currentApertureStops + currentShutterStops + currentIsoStops) - baseStops;
        
        // Actualizar UI del Exposímetro visual
        const meterRange = 3; // Muestra de -3 a +3
        // Limitamos visualmente para que la aguja no se salga de la pista
        const visualPos = Math.max(-meterRange, Math.min(meterRange, totalEV));
        // Mapeamos de -3..+3 a 0%..100%
        const percentage = ((visualPos + meterRange) / (meterRange * 2)) * 100;
        exposureIndicator.style.left = `${percentage}%`;
        
        // Cambiamos el color de estado según el EV
        if (totalEV < -1.5) {
            exposureStatus.textContent = "Subexpuesta (Oscura)";
            exposureStatus.style.color = "#ef4444"; // Rojo
            exposureIndicator.style.color = "#ef4444";
        } else if (totalEV > 1.5) {
            exposureStatus.textContent = "Sobreexpuesta (Quemada)";
            exposureStatus.style.color = "#ef4444"; // Rojo
            exposureIndicator.style.color = "#ef4444";
        } else {
            exposureStatus.textContent = "Exposición Correcta";
            exposureStatus.style.color = "#22c55e"; // Verde
            exposureIndicator.style.color = "#22c55e";
        }
        
        // Aplicamos la ganancia total como brillo sobre el contenedor visual
        const lightMultiplier = Math.pow(2, totalEV);
        sceneContainer.style.filter = `brightness(${lightMultiplier})`;
    }

    // Actualizar cuando interactúan con los controles
    focusSlider.addEventListener('input', updateBlur);
    isoSlider.addEventListener('input', updateISO);
    zoomSlider.addEventListener('input', updateZoom);
    subjectSelect.addEventListener('change', updateSubject);
    shutterSlider.addEventListener('input', updateShutter);

    // Inicializar el estado
    updateBlur();
    updateISO();
    updateZoom();
    updateSubject();
});
