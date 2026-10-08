document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM - Controles
    const timeSlider = document.getElementById('time-slider');
    const focusSlider = document.getElementById('focus-slider');
    const isoSlider = document.getElementById('iso-slider');
    const shutterSlider = document.getElementById('shutter-slider');
    const zoomSlider = document.getElementById('zoom-slider');
    const subjectSelect = document.getElementById('subject-select');
    
    // Controles de Modo de Disparo y Auto ISO
    const modeBtns = document.querySelectorAll('.mode-btn');
    const modeDescTitle = document.getElementById('mode-desc-title');
    const modeDescText = document.getElementById('mode-desc-text');
    const modeDescBox = document.getElementById('mode-desc-box');
    const autoIsoContainer = document.getElementById('auto-iso-container');
    const autoIsoToggle = document.getElementById('auto-iso-toggle');
    const autoIsoBadge = document.getElementById('auto-iso-badge');

    // Grupos de Sliders (para bloquear/desbloquear con clases)
    const groupIso = document.getElementById('group-iso');
    const groupAperture = document.getElementById('group-aperture');
    const groupShutter = document.getElementById('group-shutter');

    // Labels en pantalla
    const valTime = document.getElementById('val-time');
    const valAperture = document.getElementById('val-aperture');
    const valShutter = document.getElementById('val-shutter');
    const valIso = document.getElementById('val-iso');
    const valZoom = document.getElementById('val-zoom');
    
    // Exposímetro
    const exposureIndicator = document.getElementById('exposure-indicator');
    const exposureStatus = document.getElementById('exposure-status');

    // Elementos de la escena visual
    const layers = document.querySelectorAll('.layer');
    const grainOverlay = document.querySelector('.grain-overlay');
    const sceneContainer = document.querySelector('.scene-container');
    const motionBlurNode = document.getElementById('motionBlurNode');
    
    const subjectSvgs = {
        'standing': document.getElementById('subject-standing'),
        'running': document.getElementById('subject-running'),
        'car': document.getElementById('subject-car')
    };

    // Velocidad base por sujeto para el desenfoque de movimiento
    const subjectSpeeds = {
        'standing': 0,    // Estático
        'running': 1.5,   // Persona en movimiento
        'car': 4.5        // Vehículo a alta velocidad
    };
    let currentSubjectSpeed = 0;

    // ==========================================
    // 1. CONSTANTES ÓPTICAS Y FOTOGRÁFICAS
    // ==========================================
    const APERTURE_ARRAY = [
        'f/1.2', 'f/1.4', 'f/1.8', 'f/2.0', 'f/2.8', 
        'f/4.0', 'f/5.6', 'f/8.0', 'f/11', 'f/16', 'f/22'
    ];
    const APERTURE_NUMERIC = [1.2, 1.4, 1.8, 2.0, 2.8, 4.0, 5.6, 8.0, 11, 16, 22];

    const SHUTTER_ARRAY = [
        '1s', '1/2s', '1/4s', '1/8s', '1/15s', '1/30s', '1/60s', 
        '1/125s', '1/250s', '1/500s', '1/1000s', '1/2000s', '1/4000s', '1/8000s'
    ];
    const SHUTTER_SECONDS = [
        1, 0.5, 0.25, 0.125, 1/15, 1/30, 1/60, 
        1/125, 1/250, 1/500, 1/1000, 1/2000, 1/4000, 1/8000
    ];

    const ISO_ARRAY = [
        'ISO 50', 'ISO 100', 'ISO 200', 'ISO 400', 'ISO 800', 
        'ISO 1600', 'ISO 3200', 'ISO 6400', 'ISO 12800', 'ISO 25600'
    ];
    const ISO_NUMERIC = [50, 100, 200, 400, 800, 1600, 3200, 6400, 12800, 25600];

    const MIN_FOCAL_MM = 10;
    const MAX_FOCAL_MM = 100;
    const DEFAULT_FOCAL_MM = 50;

    const maxBlurPx = 26;
    const focalPointDepth = 1;

    // ==========================================
    // 2. MODOS DE DISPARO Y ESTADO
    // ==========================================
    const MODE_INFO = {
        'AUTO': {
            title: 'AUTO (Automático General)',
            desc: 'La cámara lee la luz y decide todo el equilibrio.',
            accent: '#10b981'
        },
        'PORTRAIT': {
            title: '👤 Retrato (Escena)',
            desc: 'Automático, pero la cámara fuerza la máxima apertura de diafragma para desenfocar el fondo.',
            accent: '#ec4899'
        },
        'SPORT': {
            title: '🏃 Deporte / Acción (Escena)',
            desc: 'Automático, pero la cámara fuerza una velocidad de obturación rápida para congelar el movimiento.',
            accent: '#f59e0b'
        },
        'A': {
            title: 'A / Av (Prioridad de Apertura)',
            desc: 'Tú controlas el Diafragma (desenfoque). La cámara ajusta la Velocidad según la luz.',
            accent: '#3b82f6'
        },
        'S': {
            title: 'S / Tv (Prioridad de Velocidad)',
            desc: 'Tú controlas la Velocidad (movimiento). La cámara ajusta el Diafragma según la luz.',
            accent: '#6366f1'
        },
        'M': {
            title: 'M (Manual)',
            desc: 'Control total. Tú ajustas todos los valores.',
            accent: '#3b82f6'
        }
    };

    let currentMode = 'M';
    let isAutoIso = false;

    // Variables de estado de exposición
    let currentApertureEV = 0;
    let currentShutterEV = 0;
    let currentIsoEV = 0;
    let currentAmbientEV = 0;
    let sceneLighting = 100;

    let currentApertureIndex = 6;
    let currentShutterIndex = 7;
    let currentIsoIndex = 3;
    let currentFocalMm = DEFAULT_FOCAL_MM;
    let currentHour = 12.0;

    // ==========================================
    // 3. PALETAS DE HORA DEL DÍA
    // ==========================================
    const TIME_KEYFRAMES = [
        {
            hour: 6.0,
            lighting: 30,
            skyTop: [46, 28, 78],
            skyMid: [155, 75, 122],
            skyBot: [252, 165, 117],
            sunColor: [255, 122, 69],
            sunGlowA: 'rgba(255, 107, 74, 0.85)',
            sunGlowB: 'rgba(255, 140, 0, 0.5)',
            cloudColor: [255, 205, 210, 0.85],
            mountainFar: [72, 68, 107],
            mountainNear: [42, 43, 74],
            treesFar: [28, 56, 54],
            treesNear: [15, 40, 36],
            subjectColor: [245, 166, 35]
        },
        {
            hour: 9.0,
            lighting: 80,
            skyTop: [38, 105, 198],
            skyMid: [85, 160, 245],
            skyBot: [210, 238, 255],
            sunColor: [255, 242, 180],
            sunGlowA: 'rgba(255, 235, 100, 0.8)',
            sunGlowB: 'rgba(255, 215, 0, 0.45)',
            cloudColor: [255, 255, 255, 0.95],
            mountainFar: [62, 85, 148],
            mountainNear: [33, 50, 86],
            treesFar: [30, 72, 42],
            treesNear: [14, 46, 24],
            subjectColor: [251, 191, 36]
        },
        {
            hour: 12.0,
            lighting: 100,
            skyTop: [29, 120, 214],
            skyMid: [76, 167, 248],
            skyBot: [167, 224, 255],
            sunColor: [255, 253, 240],
            sunGlowA: 'rgba(255, 247, 194, 0.9)',
            sunGlowB: 'rgba(255, 215, 0, 0.5)',
            cloudColor: [255, 255, 255, 0.98],
            mountainFar: [59, 89, 152],
            mountainNear: [31, 51, 88],
            treesFar: [30, 74, 44],
            treesNear: [13, 46, 24],
            subjectColor: [251, 191, 36]
        },
        {
            hour: 15.0,
            lighting: 80,
            skyTop: [35, 95, 185],
            skyMid: [95, 155, 235],
            skyBot: [255, 210, 150],
            sunColor: [255, 235, 130],
            sunGlowA: 'rgba(255, 215, 64, 0.8)',
            sunGlowB: 'rgba(255, 179, 0, 0.5)',
            cloudColor: [255, 245, 230, 0.95],
            mountainFar: [70, 75, 135],
            mountainNear: [38, 42, 78],
            treesFar: [38, 68, 38],
            treesNear: [17, 42, 22],
            subjectColor: [248, 175, 30]
        },
        {
            hour: 18.0,
            lighting: 20,
            skyTop: [44, 18, 77],
            skyMid: [184, 59, 94],
            skyBot: [255, 107, 53],
            sunColor: [255, 69, 0],
            sunGlowA: 'rgba(255, 59, 0, 0.85)',
            sunGlowB: 'rgba(217, 72, 15, 0.55)',
            cloudColor: [255, 175, 130, 0.9],
            mountainFar: [92, 42, 74],
            mountainNear: [44, 22, 40],
            treesFar: [46, 32, 28],
            treesNear: [20, 13, 12],
            subjectColor: [255, 140, 26]
        }
    ];

    function lerpChannel(a, b, t) {
        return Math.round(a + (b - a) * t);
    }

    function lerpColorRgb(arrA, arrB, t) {
        return `rgb(${lerpChannel(arrA[0], arrA[0], t)}, ${lerpChannel(arrA[1], arrB[1], t)}, ${lerpChannel(arrA[2], arrB[2], t)})`;
    }

    function lerpColorRgba(arrA, arrB, t) {
        const r = lerpChannel(arrA[0], arrB[0], t);
        const g = lerpChannel(arrA[1], arrB[1], t);
        const b = lerpChannel(arrA[2], arrB[2], t);
        const alpha = (arrA[3] + (arrB[3] - arrA[3]) * t).toFixed(2);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // ==========================================
    // 4. LÓGICA DE MODOS Y CONTROL DE AUTO-EXPOSICIÓN
    // ==========================================

    // Actualiza el aspecto visual (Activo vs Plomo/Bloqueado) de los sliders
    function updateControlsUIState() {
        const isAutoScene = (currentMode === 'AUTO' || currentMode === 'PORTRAIT' || currentMode === 'SPORT');

        // Mostrar u ocultar el interruptor de Auto ISO (solo en A, S, M)
        if (isAutoScene) {
            autoIsoContainer.style.display = 'none';
        } else {
            autoIsoContainer.style.display = 'flex';
        }

        // Estado del Toggle Auto ISO
        autoIsoBadge.textContent = isAutoIso ? 'ON' : 'OFF';
        autoIsoBadge.classList.toggle('on', isAutoIso);
        autoIsoToggle.checked = isAutoIso;

        // Apertura
        const lockAperture = isAutoScene || (currentMode === 'S');
        groupAperture.classList.toggle('control-locked', lockAperture);

        // Velocidad
        const lockShutter = isAutoScene || (currentMode === 'A');
        groupShutter.classList.toggle('control-locked', lockShutter);

        // ISO
        const lockIso = isAutoScene || isAutoIso;
        groupIso.classList.toggle('control-locked', lockIso);
    }

    // Cambiar Modo de Disparo
    function setShootingMode(modeKey) {
        currentMode = modeKey;

        modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-mode') === modeKey);
        });

        // Actualizar descripción didáctica
        const info = MODE_INFO[modeKey];
        if (info) {
            modeDescTitle.textContent = info.title;
            modeDescText.textContent = info.desc;
            modeDescBox.style.borderLeftColor = info.accent;
            modeDescTitle.style.color = info.accent;
        }

        updateControlsUIState();
        runAutoExposureEngine();
    }

    // Toggle de Auto ISO
    function handleAutoIsoToggle(e) {
        isAutoIso = e.target.checked;
        updateControlsUIState();
        runAutoExposureEngine();
    }

    // Algoritmo de Auto-Exposición (Calcula y desplaza los sliders bloqueados programáticamente)
    function runAutoExposureEngine() {
        if (currentMode === 'M' && !isAutoIso) {
            // En Manual puro sin Auto ISO, no se mueve nada automáticamente
            calculateExposure();
            return;
        }

        // 1. MODO RETRATO: Fuerza máxima apertura (f/1.4 - f/1.8 para bokeh)
        if (currentMode === 'PORTRAIT') {
            setApertureByIndex(1); // f/1.4
            // Mantener ISO bajo (ISO 100) si hay suficiente luz
            let targetIsoIdx = 1; // ISO 100
            setIsoByIndex(targetIsoIdx);

            // Resolver Velocidad para equilibrar 0 EV
            let targetShutterEV = - (currentApertureEV + currentIsoEV + currentAmbientEV);
            let sIdx = findClosestShutterIndex(targetShutterEV);
            
            // Si la velocidad necesaria es demasiado lenta (< 1/60s), subir ISO
            if (sIdx < 6) {
                targetIsoIdx = Math.min(ISO_ARRAY.length - 1, 1 + (6 - sIdx));
                setIsoByIndex(targetIsoIdx);
                targetShutterEV = - (currentApertureEV + currentIsoEV + currentAmbientEV);
                sIdx = findClosestShutterIndex(targetShutterEV);
            }
            setShutterByIndex(sIdx);
        }

        // 2. MODO DEPORTE: Fuerza velocidad rápida (1/1000s o superior para congelar)
        else if (currentMode === 'SPORT') {
            setShutterByIndex(10); // 1/1000s
            // Tratar de abrir diafragma a f/2.8
            let targetApIdx = 4; // f/2.8
            setApertureByIndex(targetApIdx);

            // Resolver ISO para compensar la alta velocidad
            let targetIsoEV = - (currentApertureEV + currentShutterEV + currentAmbientEV);
            let isoIdx = findClosestIsoIndex(targetIsoEV);
            setIsoByIndex(isoIdx);

            // Si aún falta luz al máximo ISO, abrir apertura al máximo
            if (isoIdx >= ISO_ARRAY.length - 1 && (currentApertureEV + currentShutterEV + currentIsoEV + currentAmbientEV) < -0.5) {
                targetApIdx = 0; // f/1.2
                setApertureByIndex(targetApIdx);
            }
        }

        // 3. MODO AUTO: Balance general inteligente
        else if (currentMode === 'AUTO') {
            // Preferir diafragma f/4.0 - f/5.6
            let apIdx = (currentAmbientEV >= -1) ? 6 : 4; // f/5.6 o f/2.8 si oscurece
            setApertureByIndex(apIdx);

            let isoIdx = (currentAmbientEV >= -0.5) ? 1 : (currentAmbientEV >= -1.5 ? 3 : 6); // ISO 100, 400 o 3200
            setIsoByIndex(isoIdx);

            let targetShutterEV = - (currentApertureEV + currentIsoEV + currentAmbientEV);
            let sIdx = findClosestShutterIndex(targetShutterEV);
            
            // Seguridad contra trepidación en auto (mantener >= 1/60s)
            if (sIdx < 6) {
                apIdx = Math.max(0, apIdx - 2); // Abrir más diafragma
                setApertureByIndex(apIdx);
                isoIdx = Math.min(ISO_ARRAY.length - 1, isoIdx + 2);
                setIsoByIndex(isoIdx);
                targetShutterEV = - (currentApertureEV + currentIsoEV + currentAmbientEV);
                sIdx = findClosestShutterIndex(targetShutterEV);
            }
            setShutterByIndex(sIdx);
        }

        // 4. MODO A / Av (Prioridad Apertura)
        else if (currentMode === 'A') {
            if (isAutoIso) {
                // Con Auto ISO: fijar ISO 100 de base, resolver velocidad, subir ISO solo si la velocidad cae por debajo de 1/60s
                let isoIdx = 1; // ISO 100
                setIsoByIndex(isoIdx);

                let targetShutterEV = - (currentApertureEV + currentIsoEV + currentAmbientEV);
                let sIdx = findClosestShutterIndex(targetShutterEV);

                if (sIdx < 6) { // Si cae de 1/60s
                    const neededStops = 6 - sIdx;
                    isoIdx = Math.min(ISO_ARRAY.length - 1, 1 + neededStops);
                    setIsoByIndex(isoIdx);
                    targetShutterEV = - (currentApertureEV + currentIsoEV + currentAmbientEV);
                    sIdx = findClosestShutterIndex(targetShutterEV);
                }
                setShutterByIndex(sIdx);
            } else {
                // Auto velocidad con el ISO que el usuario eligió
                let targetShutterEV = - (currentApertureEV + currentIsoEV + currentAmbientEV);
                let sIdx = findClosestShutterIndex(targetShutterEV);
                setShutterByIndex(sIdx);
            }
        }

        // 5. MODO S / Tv (Prioridad Velocidad)
        else if (currentMode === 'S') {
            if (isAutoIso) {
                let isoIdx = 1; // Base ISO 100
                setIsoByIndex(isoIdx);

                let targetApEV = - (currentShutterEV + currentIsoEV + currentAmbientEV);
                let apIdx = findClosestApertureIndex(targetApEV);

                // Si el diafragma no puede abrir más de f/1.2 y falta luz, subir ISO
                if (apIdx === 0 && (currentApertureEV + currentShutterEV + currentIsoEV + currentAmbientEV) < -0.5) {
                    let targetIsoEV = - (currentApertureEV + currentShutterEV + currentAmbientEV);
                    isoIdx = findClosestIsoIndex(targetIsoEV);
                    setIsoByIndex(isoIdx);
                }
                setApertureByIndex(apIdx);
            } else {
                let targetApEV = - (currentShutterEV + currentIsoEV + currentAmbientEV);
                let apIdx = findClosestApertureIndex(targetApEV);
                setApertureByIndex(apIdx);
            }
        }

        // 6. MODO M con Auto ISO
        else if (currentMode === 'M' && isAutoIso) {
            let targetIsoEV = - (currentApertureEV + currentShutterEV + currentAmbientEV);
            let isoIdx = findClosestIsoIndex(targetIsoEV);
            setIsoByIndex(isoIdx);
        }

        calculateExposure();
    }

    // Funciones de búsqueda del índice más cercano para el target EV
    function findClosestShutterIndex(targetEV) {
        let bestIdx = 0;
        let minDiff = 999;
        for (let i = 0; i < SHUTTER_SECONDS.length; i++) {
            const ev = Math.log2(SHUTTER_SECONDS[i] * 125);
            const diff = Math.abs(ev - targetEV);
            if (diff < minDiff) {
                minDiff = diff;
                bestIdx = i;
            }
        }
        return bestIdx;
    }

    function findClosestApertureIndex(targetEV) {
        let bestIdx = 0;
        let minDiff = 999;
        for (let i = 0; i < APERTURE_NUMERIC.length; i++) {
            const ev = 2 * Math.log2(5.6 / APERTURE_NUMERIC[i]);
            const diff = Math.abs(ev - targetEV);
            if (diff < minDiff) {
                minDiff = diff;
                bestIdx = i;
            }
        }
        return bestIdx;
    }

    function findClosestIsoIndex(targetEV) {
        let bestIdx = 0;
        let minDiff = 999;
        for (let i = 0; i < ISO_NUMERIC.length; i++) {
            const ev = Math.log2(ISO_NUMERIC[i] / 400);
            const diff = Math.abs(ev - targetEV);
            if (diff < minDiff) {
                minDiff = diff;
                bestIdx = i;
            }
        }
        return bestIdx;
    }

    // Funciones para aplicar valores e iluminar/animar el slider programáticamente
    function setApertureByIndex(index) {
        currentApertureIndex = Math.min(APERTURE_ARRAY.length - 1, Math.max(0, index));
        focusSlider.value = (currentApertureIndex / (APERTURE_ARRAY.length - 1)) * 100;
        valAperture.textContent = APERTURE_ARRAY[currentApertureIndex];
        currentApertureEV = 2 * Math.log2(5.6 / APERTURE_NUMERIC[currentApertureIndex]);

        // Render Bokeh
        const bokehFactor = (APERTURE_ARRAY.length - 1 - currentApertureIndex) / (APERTURE_ARRAY.length - 1);
        layers.forEach(layer => {
            const layerDepth = parseFloat(layer.getAttribute('data-depth'));
            const distanceInLayers = Math.abs(layerDepth - focalPointDepth);
            let blurAmount = 0;
            if (distanceInLayers > 0) {
                const depthFactor = Math.pow(distanceInLayers / 5, 1.25);
                blurAmount = depthFactor * maxBlurPx * bokehFactor;
            }
            layer.style.filter = blurAmount > 0.1 ? `blur(${blurAmount.toFixed(1)}px)` : 'none';
            layer.style.setProperty('--bokeh-scale', 1 + (blurAmount * 0.0025));
        });
    }

    function setShutterByIndex(index) {
        currentShutterIndex = Math.min(SHUTTER_ARRAY.length - 1, Math.max(0, index));
        shutterSlider.value = (currentShutterIndex / (SHUTTER_ARRAY.length - 1)) * 100;
        valShutter.textContent = SHUTTER_ARRAY[currentShutterIndex];
        currentShutterEV = Math.log2(SHUTTER_SECONDS[currentShutterIndex] * 125);

        // Render Motion Blur
        let motionBlurPx = 0;
        if (currentShutterIndex < 7 && currentSubjectSpeed > 0) {
            const slowProgress = (7 - currentShutterIndex) / 7;
            motionBlurPx = slowProgress * currentSubjectSpeed * 22;
        }
        motionBlurNode.setAttribute('stdDeviation', `${motionBlurPx.toFixed(1)} 0`);
    }

    function setIsoByIndex(index) {
        currentIsoIndex = Math.min(ISO_ARRAY.length - 1, Math.max(0, index));
        isoSlider.value = (currentIsoIndex / (ISO_ARRAY.length - 1)) * 100;
        valIso.textContent = ISO_ARRAY[currentIsoIndex];
        currentIsoEV = Math.log2(ISO_NUMERIC[currentIsoIndex] / 400);

        // Render Ruido
        let grainOpacity = 0;
        if (currentIsoIndex > 1) {
            grainOpacity = Math.pow((currentIsoIndex - 1) / (ISO_ARRAY.length - 2), 1.6);
        }
        grainOverlay.style.opacity = grainOpacity.toFixed(3);
    }

    function mapSliderToIndex(sliderValue, arrayLength) {
        const normalized = parseFloat(sliderValue) / 100;
        const index = Math.round(normalized * (arrayLength - 1));
        return Math.min(arrayLength - 1, Math.max(0, index));
    }

    // ==========================================
    // 5. EVENT LISTENERS DE CONTROLES
    // ==========================================
    function onApertureInput() {
        if (groupAperture.classList.contains('control-locked')) return;
        const idx = mapSliderToIndex(focusSlider.value, APERTURE_ARRAY.length);
        setApertureByIndex(idx);
        runAutoExposureEngine();
    }

    function onShutterInput() {
        if (groupShutter.classList.contains('control-locked')) return;
        const idx = mapSliderToIndex(shutterSlider.value, SHUTTER_ARRAY.length);
        setShutterByIndex(idx);
        runAutoExposureEngine();
    }

    function onIsoInput() {
        if (groupIso.classList.contains('control-locked')) return;
        const idx = mapSliderToIndex(isoSlider.value, ISO_ARRAY.length);
        setIsoByIndex(idx);
        runAutoExposureEngine();
    }

    // Hora del Día
    function updateTimeOfDay() {
        currentHour = parseFloat(timeSlider.value);

        const hourFloor = Math.floor(currentHour);
        const minutes = Math.round((currentHour % 1) * 60);
        valTime.textContent = `${String(hourFloor).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        // Trayectoria del Sol (Arco)
        const p = (currentHour - 6.0) / 12.0;
        const sunX = 8 + (p * 84);
        const sunY = 72 - (60 * Math.sin(p * Math.PI));

        // Interpolación de colores
        let k1 = TIME_KEYFRAMES[0];
        let k2 = TIME_KEYFRAMES[1];

        for (let i = 0; i < TIME_KEYFRAMES.length - 1; i++) {
            if (currentHour >= TIME_KEYFRAMES[i].hour && currentHour <= TIME_KEYFRAMES[i + 1].hour) {
                k1 = TIME_KEYFRAMES[i];
                k2 = TIME_KEYFRAMES[i + 1];
                break;
            }
        }

        const segmentFactor = (currentHour - k1.hour) / (k2.hour - k1.hour);
        const t = segmentFactor * segmentFactor * (3 - 2 * segmentFactor);

        sceneLighting = Math.round(k1.lighting + (k2.lighting - k1.lighting) * t);

        const skyTop = lerpColorRgb(k1.skyTop, k2.skyTop, t);
        const skyMid = lerpColorRgb(k1.skyMid, k2.skyMid, t);
        const skyBot = lerpColorRgb(k1.skyBot, k2.skyBot, t);
        const sunColor = lerpColorRgb(k1.sunColor, k2.sunColor, t);
        const cloudColor = lerpColorRgba(k1.cloudColor, k2.cloudColor, t);
        const mountainFar = lerpColorRgb(k1.mountainFar, k2.mountainFar, t);
        const mountainNear = lerpColorRgb(k1.mountainNear, k2.mountainNear, t);
        const treesFar = lerpColorRgb(k1.treesFar, k2.treesFar, t);
        const treesNear = lerpColorRgb(k1.treesNear, k2.treesNear, t);
        const subjectColor = lerpColorRgb(k1.subjectColor, k2.subjectColor, t);

        const skyGradient = `linear-gradient(180deg, ${skyTop} 0%, ${skyMid} 50%, ${skyBot} 100%)`;
        const sunShadow = `0 0 70px ${k1.sunGlowA}, 0 0 160px ${k1.sunGlowB}`;

        sceneContainer.style.setProperty('--sky-gradient', skyGradient);
        sceneContainer.style.setProperty('--sun-x', `${sunX.toFixed(2)}%`);
        sceneContainer.style.setProperty('--sun-y', `${sunY.toFixed(2)}%`);
        sceneContainer.style.setProperty('--sun-color', sunColor);
        sceneContainer.style.setProperty('--sun-shadow', sunShadow);
        sceneContainer.style.setProperty('--cloud-color', cloudColor);
        sceneContainer.style.setProperty('--mountain-far-color', mountainFar);
        sceneContainer.style.setProperty('--mountain-near-color', mountainNear);
        sceneContainer.style.setProperty('--trees-far-color', treesFar);
        sceneContainer.style.setProperty('--trees-near-color', treesNear);
        sceneContainer.style.setProperty('--subject-color', subjectColor);

        // Influencia ambiental
        currentAmbientEV = Math.log2(sceneLighting / 100);

        // Si estamos en un modo automático, reaccionar a la luz ambiental moviendo los controles
        runAutoExposureEngine();
    }

    // Distancia Focal (Continua en mm: 10mm a 100mm)
    function updateFocalLength() {
        const sliderPct = parseFloat(zoomSlider.value) / 100;
        currentFocalMm = Math.round(MIN_FOCAL_MM + sliderPct * (MAX_FOCAL_MM - MIN_FOCAL_MM));
        currentFocalMm = Math.min(MAX_FOCAL_MM, Math.max(MIN_FOCAL_MM, currentFocalMm));

        valZoom.textContent = `${currentFocalMm}mm`;

        const focalProgress = (currentFocalMm - MIN_FOCAL_MM) / (MAX_FOCAL_MM - MIN_FOCAL_MM);
        const subjectScale = 1.0 + (focalProgress * 2.8);

        const selectedSubject = subjectSelect.value;
        let dollyOrigin = '42% 37%';
        if (selectedSubject === 'running') {
            dollyOrigin = '45% 36%';
        } else if (selectedSubject === 'car') {
            dollyOrigin = '35% 82%';
        }

        layers.forEach(layer => {
            const layerDepth = parseFloat(layer.getAttribute('data-depth'));
            const distanceInLayers = Math.abs(layerDepth - focalPointDepth);
            
            const depthFactor = 1.0 - (distanceInLayers * 0.12);
            const layerScale = 1.0 + (subjectScale - 1.0) * Math.max(0.4, depthFactor);

            layer.style.setProperty('--dolly-origin', dollyOrigin);
            layer.style.setProperty('--dolly-scale', layerScale.toFixed(3));
        });
    }

    // Sujeto
    function updateSubject() {
        const selected = subjectSelect.value;
        currentSubjectSpeed = subjectSpeeds[selected] || 0;

        Object.keys(subjectSvgs).forEach(key => {
            if (subjectSvgs[key]) {
                subjectSvgs[key].style.display = (key === selected) ? 'block' : 'none';
            }
        });

        setShutterByIndex(currentShutterIndex);
        updateFocalLength();
    }

    // ==========================================
    // 6. CÁLCULO DE EXPOSICIÓN FINAL (0 EV)
    // ==========================================
    function calculateExposure() {
        const totalEV = currentApertureEV + currentShutterEV + currentIsoEV + currentAmbientEV;

        const meterRange = 3;
        const visualPos = Math.max(-meterRange, Math.min(meterRange, totalEV));
        const indicatorPercent = ((visualPos + meterRange) / (meterRange * 2)) * 100;
        
        exposureIndicator.style.left = `${indicatorPercent.toFixed(1)}%`;

        if (totalEV < -0.8) {
            exposureStatus.textContent = `Subexpuesta (${totalEV > 0 ? '+' : ''}${totalEV.toFixed(1)} EV)`;
            exposureStatus.style.color = "#ef4444";
            exposureIndicator.style.color = "#ef4444";
        } else if (totalEV > 0.8) {
            exposureStatus.textContent = `Sobreexpuesta (+${totalEV.toFixed(1)} EV)`;
            exposureStatus.style.color = "#ef4444";
            exposureIndicator.style.color = "#ef4444";
        } else {
            exposureStatus.textContent = `Exposición Correcta (${totalEV >= 0 ? '+' : ''}${totalEV.toFixed(1)} EV)`;
            exposureStatus.style.color = "#22c55e";
            exposureIndicator.style.color = "#22c55e";
        }

        const brightnessMultiplier = Math.max(0.06, Math.min(3.2, Math.pow(2, totalEV * 0.75)));
        sceneContainer.style.filter = `brightness(${brightnessMultiplier.toFixed(3)})`;
    }

    // ==========================================
    // 7. INICIALIZACIÓN Y EVENT LISTENERS
    // ==========================================
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setShootingMode(btn.getAttribute('data-mode'));
        });
    });

    if (autoIsoToggle) {
        autoIsoToggle.addEventListener('change', handleAutoIsoToggle);
    }

    focusSlider.addEventListener('input', onApertureInput);
    shutterSlider.addEventListener('input', onShutterInput);
    isoSlider.addEventListener('input', onIsoInput);
    timeSlider.addEventListener('input', updateTimeOfDay);
    zoomSlider.addEventListener('input', updateFocalLength);
    subjectSelect.addEventListener('change', updateSubject);

    // Inicializar estado por defecto en Modo Manual (M)
    setShootingMode('M');
    setApertureByIndex(6); // f/5.6
    setShutterByIndex(7);  // 1/125s
    setIsoByIndex(3);      // ISO 400
    updateSubject();
    updateFocalLength();
    updateTimeOfDay();
});
