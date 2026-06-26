(function () {
  "use strict";

  if (document.getElementById("tab-pets-bar")) return;

  const BAR_HEIGHT = 44;
  const PET_SIZE = 28;
  const TWO_PI = Math.PI * 2;
  const REACT_DURATION = 1500;
  const SYNC_INTERVAL = 1000;
  const SIT_DURATION = 2000;

  function makeSprite(rows, palette) {
    const canvas = document.createElement("canvas");
    canvas.width = rows[0].length;
    canvas.height = rows.length;
    const ctx = canvas.getContext("2d");
    rows.forEach((row, y) =>
      [...row].forEach((ch, x) => {
        const color = palette[ch];
        if (color) { ctx.fillStyle = color; ctx.fillRect(x, y, 1, 1); }
      })
    );
    return canvas.toDataURL();
  }

  /* Resolve asset paths via chrome.runtime.getURL */
  const assetURL = (name) => chrome.runtime.getURL(`src/assets/${name}.png`);

  const PET_CONFIG = (() => {
    const cc = { C: "#E8B882", k: "#2D1B0E", p: "#FF8FAB", w: "#FFF8DC" };
    const dc = { D: "#C68642", k: "#2D1B0E", n: "#1A1A1A", t: "#FF6B81" };
    const bc = { B: "#5B9BD5", Y: "#FFD700", k: "#1A1A1A" };
    const rc = { R: "#E0E0E0", k: "#1A1A1A", p: "#FF8FAB" };
    const hc = { H: "#DFB075", k: "#1A1A1A", w: "#FFFFFF" };

    return [
      {
        label: "cat", speed: 3.0, bounceAmp: 3, bounceFreq: 0.18,
        idleImage: assetURL("cat"),
        reactSprite: makeSprite([
          "C......C", "CCCCCCCC", "CkCCCkCC",
          "CCC.p.CC", "CCCCCCCC", ".CCCCCC.",
          ".CC..CC.", ".CC..CC.",
        ], cc),
      },
      {
        label: "dog", speed: 1.8, bounceAmp: 4, bounceFreq: 0.13,
        idleImage: assetURL("dog"),
        reactSprite: makeSprite([
          "DD....DD", "DDDDDDDD", ".DkDDkD.",
          ".DDDnDD.", ".DDDDDD.", "..DDDD..",
          "..D..D..", "........",
        ], dc),
      },
      {
        label: "bird", speed: 0.8, bounceAmp: 5, bounceFreq: 0.08,
        idleImage: assetURL("bird"),
        reactSprite: makeSprite([
          "...BBB..", "..BBBBB.", ".YBBkBB.",
          ".YBBBBB.", "..BBBBB.", "...BBB..",
          "....B...", "........",
        ], bc),
      },
      {
        label: "rabbit", speed: 2.2, bounceAmp: 4.5, bounceFreq: 0.16,
        idleImage: assetURL("rabbit"),
        reactSprite: makeSprite([
          "R......R", "RR....RR", "RRRRRRRR", "RkRRRkRR",
          "RRR.p.RR", "RRRRRRRR", ".RRRRRR.", ".RR..RR.",
        ], rc),
      },
      {
        label: "hamster", speed: 1.2, bounceAmp: 2.5, bounceFreq: 0.22,
        idleImage: assetURL("hamster"),
        reactSprite: makeSprite([
          "H......H", "HHHHHHHH", "HkHHHHkH",
          "HHH.w.HH", "HHHHHHHH", ".HHHHHH.", "..H..H..",
        ], hc),
      },
    ];
  })();

  const randBetween = (min, max) => Math.random() * (max - min) + min;
  const randDir = () => (Math.random() < 0.5 ? 1 : -1);

  const styleEl = document.createElement("style");
  styleEl.id = "tab-pets-styles";
  styleEl.textContent = `
    #tab-pets-bar {
      background: transparent !important;
    }
    .tab-pets-glow-ring {
      position: absolute;
      border-radius: 50%;
      pointer-events: none;
      transform: translate(-50%, -50%) scale(0.4);
      opacity: 1;
      transition: transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.55s ease;
    }
    .tab-pets-glow-ring.pop {
      transform: translate(-50%, -50%) scale(2.8);
      opacity: 0;
    }
    .tab-pets-pixel-overlay {
      position: absolute;
      pointer-events: none;
      image-rendering: pixelated;
      animation: tab-pets-pixel-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
    }
    @keyframes tab-pets-pixel-in {
      0%   { transform: scale(2.4) rotate(18deg);  filter: brightness(2.8) saturate(0.5); }
      55%  { transform: scale(0.9) rotate(-6deg);  filter: brightness(1.1) saturate(1); }
      100% { transform: scale(1)   rotate(0deg);   filter: brightness(1)   saturate(1); }
    }
  `;
  document.head.appendChild(styleEl);

  const bar = document.createElement("div");
  bar.id = "tab-pets-bar";
  Object.assign(bar.style, {
    position:      "fixed",
    top:           "0",
    left:          "0",
    width:         "100%",
    height:        `${BAR_HEIGHT}px`,
    zIndex:        "2147483647",
    overflow:      "visible",
    boxSizing:     "border-box",
    pointerEvents: "none",
    background:    "transparent",
  });

  document.body.prepend(bar);
  document.documentElement.style.marginTop = `${BAR_HEIGHT}px`;

  const lightMQ = window.matchMedia("(prefers-color-scheme: light)");
  const glowColor = () =>
    lightMQ.matches ? "rgba(109,40,217,0.80)" : "rgba(255,210,60,0.90)";

  function spawnGlowBurst(petEl) {
    const petRect = petEl.getBoundingClientRect();
    const barRect = bar.getBoundingClientRect();
    const cx = petRect.left + petRect.width  / 2 - barRect.left;
    const cy = petRect.top  + petRect.height / 2 - barRect.top;
    const ring = document.createElement("div");
    ring.className = "tab-pets-glow-ring";
    Object.assign(ring.style, {
      left:       `${cx}px`,
      top:        `${cy}px`,
      width:      "54px",
      height:     "54px",
      background: `radial-gradient(circle, ${glowColor()} 0%, transparent 70%)`,
    });
    bar.appendChild(ring);
    requestAnimationFrame(() => requestAnimationFrame(() => ring.classList.add("pop")));
    setTimeout(() => ring.remove(), 600);
  }

  function spawnPawPrint(x, y, direction) {
    const paw = document.createElement("img");
    paw.src = chrome.runtime.getURL("src/assets/paw.png");
    Object.assign(paw.style, {
      position: "absolute",
      left: `${x}px`,
      top: `${y}px`,
      width: "12px",
      height: "12px",
      opacity: "0.55",
      pointerEvents: "none",
      transform: `scaleX(${direction}) rotate(${direction * 15}deg)`,
      transition: "opacity 1.2s ease, transform 1.2s ease",
    });
    bar.appendChild(paw);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        paw.style.opacity = "0";
        paw.style.transform = `scaleX(${direction}) translate(0, -4px) scale(0.8) rotate(${direction * 30}deg)`;
      });
    });
    setTimeout(() => paw.remove(), 1200);
  }

  function showPixelReact(pet) {
    const img = document.createElement("img");
    img.src = pet.reactSprite;
    img.className = "tab-pets-pixel-overlay";
    const topPx = BAR_HEIGHT / 2 - PET_SIZE / 2;
    Object.assign(img.style, {
      left:   `${pet.posX}px`,
      top:    `${topPx}px`,
      width:  `${PET_SIZE}px`,
      height: `${PET_SIZE}px`,
    });
    bar.appendChild(img);
    return img;
  }

  let pets = [];
  let rafId = null;

  let currentSettings = {
    enabled:      true,
    petCount:     3,
    selectedPets: ["cat", "dog", "bird"],
    speed:        2,
  };

  const getSpeedMultiplier = (s) => {
    if (s === 1) return 0.5;
    if (s === 3) return 1.5;
    return 1.0;
  };

  /* Create pet as an <img> element using the 3D realistic PNG */
  function createPetEl(cfg) {
    const el = document.createElement("img");
    el.src = cfg.idleImage;
    el.alt = cfg.label;
    el.title = `Click the ${cfg.label}!`;
    el.draggable = false;
    Object.assign(el.style, {
      position:      "absolute",
      width:         `${PET_SIZE}px`,
      height:        `${PET_SIZE}px`,
      objectFit:     "contain",
      userSelect:    "none",
      display:       "inline-block",
      cursor:        "pointer",
      pointerEvents: "auto",
      willChange:    "transform, filter, left, top",
    });
    bar.appendChild(el);
    return el;
  }

  function initPets(savedPositions) {
    for (const p of pets) p.el.remove();
    pets = [];
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }

    if (!currentSettings.enabled || !currentSettings.selectedPets || !currentSettings.selectedPets.length) {
      bar.style.display = "none";
      document.documentElement.style.marginTop = "0px";
      return;
    }

    bar.style.display = "block";
    document.documentElement.style.marginTop = `${BAR_HEIGHT}px`;

    const trackWidth = bar.clientWidth - PET_SIZE;
    const speedMult = getSpeedMultiplier(currentSettings.speed);

    const allowedConfigs = PET_CONFIG.filter(cfg => currentSettings.selectedPets.includes(cfg.label));
    if (!allowedConfigs.length) return;

    const activeConfigs = [];
    for (let i = 0; i < currentSettings.petCount; i++) {
      activeConfigs.push(allowedConfigs[i % allowedConfigs.length]);
    }

    pets = activeConfigs.map((cfg, i) => {
      const saved = savedPositions?.[i] ?? null;
      const el = createPetEl(cfg);

      const pet = {
        el,
        label:         cfg.label,
        idleImage:     cfg.idleImage,
        reactSprite:   cfg.reactSprite,
        posX:          saved?.posX        ?? randBetween(0, trackWidth),
        direction:     saved?.direction   ?? randDir(),
        speed:         cfg.speed * speedMult,
        bounceAmp:     cfg.bounceAmp,
        bounceFreq:    cfg.bounceFreq,
        bouncePhase:   saved?.bouncePhase ?? randBetween(0, TWO_PI),
        nextFlipAt:    performance.now() + randBetween(3000, 5000),
        sitting:       false,
        sitUntil:      0,
        sitFloatPhase: 0,
        nextSitAt:     performance.now() + randBetween(8000, 15000),
        reacting:      false,
        reactTimer:    null,
        reactOverlay:  null,
        glowing:       false,
        lastPawX:      -999,
      };

      el.addEventListener("click", () => {
        if (pet.reacting) return;
        console.log(`[Tab Pets] 🖱️ Clicked the ${pet.label}! (pos: ${Math.round(pet.posX)}px)`);

        pet.reacting = true;
        pet.sitting  = false;

        el.style.visibility = "hidden";
        pet.reactOverlay = showPixelReact(pet);

        spawnGlowBurst(el);
        for (let j = 0; j < 3; j++) {
          setTimeout(() => {
            const petRect = el.getBoundingClientRect();
            const barRect = bar.getBoundingClientRect();
            const cx = petRect.left + petRect.width / 2 - barRect.left - 6 + randBetween(-10, 10);
            const cy = petRect.top + petRect.height / 2 - barRect.top - 6;
            spawnPawPrint(cx, cy, randDir());
          }, j * 120);
        }

        pet.glowing = true;
        setTimeout(() => { pet.glowing = false; }, 550);

        pet.reactTimer = setTimeout(() => {
          if (pet.reactOverlay) { pet.reactOverlay.remove(); pet.reactOverlay = null; }
          el.style.visibility = "visible";
          pet.reacting  = false;
          pet.nextSitAt = performance.now() + randBetween(8000, 15000);
        }, REACT_DURATION);
      });

      return pet;
    });

    console.log(savedPositions ? "[Tab Pets] 📦 Positions restored." : "[Tab Pets] 🆕 Fresh positions.");
    rafId = requestAnimationFrame(animate);
  }

  function buildFilter(pet, bobY, isSitting) {
    if (pet.glowing) return "";
    const shadowY    = 2 + bobY * 0.4;
    const shadowBlur = 5 + bobY * 0.8;
    const alpha      = lightMQ.matches ? 0.20 : 0.35;
    const shadow = `drop-shadow(0 ${shadowY.toFixed(1)}px ${shadowBlur.toFixed(1)}px rgba(0,0,0,${alpha}))`;
    if (isSitting) {
      return `${shadow} drop-shadow(0 0 8px rgba(167,139,250,0.60))`;
    }
    return shadow;
  }

  function animate(timestamp) {
    const trackWidth = bar.clientWidth - PET_SIZE;
    const barCenterY = BAR_HEIGHT / 2;

    for (const pet of pets) {

      if (pet.reacting) {
        if (pet.reactOverlay) {
          pet.reactOverlay.style.left = `${pet.posX}px`;
          pet.reactOverlay.style.top  = `${barCenterY - PET_SIZE / 2}px`;
          pet.reactOverlay.style.transform = `scaleX(${pet.direction === 1 ? 1 : -1})`;
        }
        continue;
      }

      if (!pet.sitting && timestamp >= pet.nextSitAt) {
        pet.sitting       = true;
        pet.sitUntil      = timestamp + SIT_DURATION;
        pet.sitFloatPhase = 0;
      }

      if (pet.sitting) {
        if (timestamp >= pet.sitUntil) {
          pet.sitting   = false;
          pet.nextSitAt = timestamp + randBetween(8000, 15000);
        } else {
          pet.sitFloatPhase += 0.038;
          const floatY = Math.sin(pet.sitFloatPhase) * 3.5;
          const topPx  = barCenterY - PET_SIZE / 2 - floatY;
          pet.el.style.left      = `${pet.posX}px`;
          pet.el.style.top       = `${topPx}px`;
          pet.el.style.transform = `scaleX(${pet.direction === 1 ? 1 : -1}) rotate(0deg)`;
          if (!pet.glowing) pet.el.style.filter = buildFilter(pet, floatY, true);
          continue;
        }
      }

      if (timestamp >= pet.nextFlipAt) {
        pet.direction  *= -1;
        pet.nextFlipAt  = timestamp + randBetween(3000, 5000);
      }

      pet.posX += pet.speed * pet.direction;
      if (pet.posX >= trackWidth) { pet.posX = trackWidth; pet.direction = -1; }
      if (pet.posX <= 0)          { pet.posX = 0;          pet.direction =  1; }

      // Spawn paw print trail as they walk
      const topPx = barCenterY - PET_SIZE / 2;
      if (pet.lastPawX === -999 || Math.abs(pet.posX - pet.lastPawX) > 35) {
        pet.lastPawX = pet.posX;
        spawnPawPrint(pet.posX + (PET_SIZE / 2) - 6, topPx + PET_SIZE - 8, pet.direction);
      }

      pet.bouncePhase += pet.bounceFreq;
      if (pet.bouncePhase > TWO_PI) pet.bouncePhase -= TWO_PI;

      const bobY   = Math.abs(Math.sin(pet.bouncePhase)) * pet.bounceAmp;
      const petTopPx = barCenterY - PET_SIZE / 2 - bobY;
      const tilt   = pet.direction * 7 * Math.sin(pet.bouncePhase);
      const scaleX = pet.direction === 1 ? 1 : -1;

      pet.el.style.left      = `${pet.posX}px`;
      pet.el.style.top       = `${petTopPx}px`;
      pet.el.style.transform = `scaleX(${scaleX}) rotate(${tilt}deg)`;
      if (!pet.glowing) pet.el.style.filter = buildFilter(pet, bobY, false);
    }

    rafId = requestAnimationFrame(animate);
  }

  function getSnapshot() {
    return pets.map((p) => ({
      posX:        p.posX,
      direction:   p.direction,
      bouncePhase: p.bouncePhase,
    }));
  }

  function startPositionSync() {
    setInterval(() => {
      if (!pets.length) return;
      chrome.runtime.sendMessage(
        { type: "TAB_PETS_POSITIONS_UPDATE", positions: getSnapshot() },
        () => { void chrome.runtime.lastError; }
      );
    }, SYNC_INTERVAL);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    switch (msg.type) {
      case "TAB_PETS_RESET":
        initPets(null);
        break;
      case "TAB_PETS_SETTINGS_UPDATE":
        console.log("[Tab Pets] ⚙️ Settings update:", msg.settings);
        currentSettings = msg.settings;
        initPets(null);
        break;
    }
  });

  let booted = false;

  function boot(positions) {
    if (booted) return;
    booted = true;
    chrome.storage.local.get("tabPetsSettings", (result) => {
      if (result.tabPetsSettings) {
        currentSettings = result.tabPetsSettings;
      }
      initPets(positions);
      startPositionSync();
    });
  }

  const bootTimeout = setTimeout(() => {
    console.warn("[Tab Pets] ⚠️ SW timeout — starting fresh.");
    boot(null);
  }, 1500);

  chrome.runtime.sendMessage({ type: "TAB_PETS_INIT" }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("[Tab Pets] SW error:", chrome.runtime.lastError.message);
    }
    clearTimeout(bootTimeout);
    boot(response?.positions ?? null);
  });

  console.log("[Tab Pets] 🐾 Content script loaded.");

})();

