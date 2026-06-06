# SparkleWash

Professionele tapijt- en meubelreiniging
Limburg & Grensregio Duitsland

🌐 [sparklewash.nl](https://sparklewash.nl)

---

## Before/After Gallery — Placeholder vervangen met echte foto's

De gallery-sectie (#gallery) bevat interactieve before/after sliders met placeholder-afbeeldingen (gradients met emoji). Volg onderstaande stappen om deze te vervangen door echte foto's.

### 1. Structuur begrijpen

Elke slider heeft deze HTML-structuur in `index.html`:

```html
<div class="ba-slider" data-ba="sofa">
  <div class="ba-img ba-img-after">
    <!-- "Na" afbeelding -->
  </div>
  <div class="ba-img ba-img-before">
    <!-- "Voor" afbeelding -->
  </div>
  <div class="ba-handle" tabindex="0" role="slider">
    <div class="ba-handle-line"></div>
    <div class="ba-handle-circle">⟷</div>
  </div>
</div>
```

### 2. Placeholder vervangen door <img>

Vervang in elk `.ba-item` de `.ba-placeholder` divs door echte `<img>` tags.

**Voorbeeld — kafeltje 1 (Sofa/Bank):**

```html
<!-- VERVANG dit: -->
<div class="ba-img ba-img-after">
  <div class="ba-placeholder ba-placeholder-after"><span>🛋️</span></div>
</div>
<div class="ba-img ba-img-before">
  <div class="ba-placeholder ba-placeholder-before"><span>🛋️</span></div>
</div>

<!-- DOOR dit: -->
<div class="ba-img ba-img-after">
  <img src="images/gallery/sofa-na.jpg" alt="Bank na reiniging" style="width:100%;height:100%;object-fit:cover;">
</div>
<div class="ba-img ba-img-before">
  <img src="images/gallery/sofa-voor.jpg" alt="Bank voor reiniging" style="width:100%;height:100%;object-fit:cover;">
</div>
```

### 3. Aanbevolen bestandsstructuur

```
sparklewash/
├── images/
│   └── gallery/
│       ├── sofa-voor.jpg
│       ├── sofa-na.jpg
│       ├── carpet-voor.jpg
│       ├── carpet-na.jpg
│       ├── car-voor.jpg
│       └── car-na.jpg
```

### 4. Foto specificaties

- **Formaat**: JPG of WebP (aanbevolen)
- **Resolutie**: minimaal 600×400px, ideaal 800×600px
- **Verhouding**: 4:3 of 3:2 (liggend)
- **Grootte**: < 500KB per bestand voor snelle laadtijd
- **Bestandsnaam**: `{dienst}-{voor|na}.jpg`

### 5. Drie kafeltjes om aan te passen

| data-ba   | Dienst            | Voorbeeld bestanden                     |
|-----------|-------------------|-----------------------------------------|
| `sofa`    | Bank & Fauteuil   | `sofa-voor.jpg`, `sofa-na.jpg`          |
| `carpet`  | Tapijt & Dywan    | `carpet-voor.jpg`, `carpet-na.jpg`      |
| `car`     | Auto Interieur    | `car-voor.jpg`, `car-na.jpg`            |

### 6. Betrouwbare free stock foto's

Gebruik gratis stockfoto's van:
- [Unsplash](https://unsplash.com/) — zoek naar "dirty sofa", "clean carpet", "car interior"
- [Pexels](https://pexels.com/) — zelfde zoektermen
- **Maak zelf foto's** van een echte reiniging voor het meest overtuigende resultaat!

---

## Technische details

- **Slider JS**: `js/slider.js` — init bij DOMContentLoaded, ondersteunt mouse, touch en keyboard (pijltjestoetsen / Home / End).
- **Slider CSS**: `css/style.css` — `.ba-slider`, `.ba-handle`, `.ba-img-before/after` met `clip-path`.
- **i18n keys**: `gallery-title`, `gallery-subtitle`, `gallery-item-sofa`, `gallery-item-sofa-desc`, etc. in alle 4 talen (NL/DE/EN/PL).
