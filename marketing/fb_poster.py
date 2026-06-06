"""
SparkleWash Facebook Post Rotator
Returns the next post in the 12-post cycle based on stored index.
Reads index from ~/.sparklewash-post-index, increments it.
"""
import os
from datetime import datetime

INDEX_FILE = os.path.expanduser("~/.sparklewash-post-index")

# ── All 12 posts ──────────────────────────────────────────────
POSTS = [
    {
        "id": 1,
        "title": "Poznaj nas",
        "groups": "1+2: Polacy w Limburgii (obie grupy)",
        "lang": "PL",
        "text": """🧼 Poznaj SparkleWash — Twoje meble znów jak nowe!

Hej! Jesteśmy lokalną firmą z Heerlen, która profesjonalnie pierze meble tapicerowane, dywany, materace i wnętrza aut.

✅ Pranie ekstrakcyjne Kärcherem — głęboko w strukturę tkaniny
✅ Usuwamy plamy, zapachy, roztocza i alergeny
✅ Przyjeżdżamy do Ciebie — zero dźwigania mebli
✅ Mówimy po polsku, niderlandzku, niemiecku i angielsku
✅ Działamy w całej Limburgii NL + Aachen, Köln, Düren

📩 Darmowa wycena w 24h → sparklewash.nl
📞 WhatsApp: +31 6 84067379

#SparkleWash #PranieTapicerki #Limburg #Heerlen #PolacyWHolandii"""
    },
    {
        "id": 2,
        "title": "Before/After sofa",
        "groups": "3+4: POLACY W AACHEN + Polacy w Aachen & okolicach",
        "lang": "PL",
        "text": """✨ Przed i po — efekty mówią same za siebie!

Ta sofa przeszła gruntowne pranie ekstrakcyjne. Różnica? Sami oceńcie 👆

🔹 Brud, kurz i alergeny usunięte z głębokich włókien
🔹 Plamy z kawy i codziennego użytkowania — zniknęły
🔹 Świeży zapach bez chemii

To nie magia — to profesjonalny sprzęt i doświadczenie 💪

👉 Masz sofę do odświeżenia? Napisz do nas!
📩 sparklewash.nl | 📞 WhatsApp: +31 6 84067379

#PrzedIPo #CzyszczenieSofy #SparkleWash #Aachen #PolacyWAachen"""
    },
    {
        "id": 3,
        "title": "Porada: plama z wina",
        "groups": "1+5: Polacy w Limburgii-Maastricht + Aachen Ogłoszenia",
        "lang": "PL",
        "text": """🍷 Plama z czerwonego wina? Nie panikuj — działaj!

3 kroki które ratują tapicerkę:
1. Natychmiast posyp solą — wyciąga wilgoć z plamy
2. NIE trzyj! — tylko odsączaj papierowym ręcznikiem
3. Zimna woda + soda oczyszczona — delikatnie tamponuj

⚠️ Nigdy nie używaj ciepłej wody — utrwala plamę!

A jeśli domowe sposoby nie dają rady — my przyjedziemy z Kärcherem i profesjonalną chemią 💪

📩 Darmowa wycena → sparklewash.nl

#PoradaDomowa #Czyszczenie #Plamy #SparkleWash #Limburg"""
    },
    {
        "id": 4,
        "title": "Cennik + FIRST10 (NL)",
        "groups": "6: Kleine Ondernemers Zuid Limburg",
        "lang": "NL",
        "text": """💰 Onze prijzen — eerlijk en transparant

2-Zits Bank: €49
3-Zits Bank: €69
Hoekbank: €79
Vloerkleed (tot 6m²): €39
Matras: €35
Auto Interieur: €59

🎉 ACTIE: FIRST10 — 10% korting voor nieuwe klanten met code FIRST10!

📩 Gratis offerte → sparklewash.nl
📞 WhatsApp: +31 6 84067379

#SparkleWash #Aanbieding #Limburg #Ondernemen #ZuidLimburg"""
    },
    {
        "id": 5,
        "title": "Alergie i roztocza",
        "groups": "2+3: Polacy w Limburgii + POLACY W AACHEN",
        "lang": "PL",
        "text": """🤧 Kichasz w domu? To może być Twój materac!

W materacu może żyć nawet 2 MILIONY roztoczy. Ich odchody to jeden z głównych alergenów w domu.

Profesjonalne pranie ekstrakcyjne:
✅ Zabija roztocza i usuwa alergeny
✅ Eliminuje bakterie i grzyby
✅ Świeży materac = lepszy sen

🛏️ Cena: tylko €35/materac (obie strony)

📩 Umów pranie → sparklewash.nl

#Alergia #Materac #Roztocza #ZdrowyDom #SparkleWash"""
    },
    {
        "id": 6,
        "title": "Wnętrze auta przed/po",
        "groups": "4+5: Polacy w Aachen & okolicach + Ogłoszenia",
        "lang": "PL",
        "text": """🚗 Twoje auto zasługuje na drugie życie!

Wnętrze auta to siedlisko kurzu, bakterii i zapachów. Standardowe odkurzanie nie daje rady — dopiero ekstrakcja parowa dociera tam gdzie trzeba.

💺 Fotele, dywaniki, podsufitka — wszystko świeże i pachnące
⏱️ Czas: ok. 1-1.5h
💰 Cena: €59

📩 Zarezerwuj termin → sparklewash.nl
📞 WhatsApp: +31 6 84067379

#CarInterior #AutoDetailing #PranieAuta #SparkleWash"""
    },
    {
        "id": 7,
        "title": "5 tips voor bank (NL)",
        "groups": "6: Kleine Ondernemers Zuid Limburg",
        "lang": "NL",
        "text": """🛋️ 5 tips om je bank langer mooi te houden

1. Stofzuig wekelijks — ook tussen de kussens!
2. Draai kussens maandelijks om
3. Houd huisdieren van stoffen banken (of gebruik een plaid)
4. Behandel vlekken meteen — hoe langer je wacht, hoe dieper het intrekt
5. Laat eens per jaar professioneel reinigen

💡 Wist je dat professionele extractiereiniging tot 99% van de bacteriën verwijdert?

📩 Offerte aanvragen → sparklewash.nl

#Onderhoud #BankReinigen #WoonTips #SparkleWash #Limburg"""
    },
    {
        "id": 8,
        "title": "Nasz sprzęt",
        "groups": "1+2: Polacy w Limburgii (obie grupy)",
        "lang": "PL",
        "text": """🔧 Czym robimy magię? Sprzęt ma znaczenie!

Nasz zestaw:
🧪 Kärcher SE 4001 — ekstrakcja gorącą wodą pod ciśnieniem
🧴 Profesjonalna chemia Global — bezpieczna dla tkanin
🪥 Wiertarka z nakładkami do tapicerki
💧 Czysta woda + odsysanie — zero chemii zostaje w meblach

Nie używamy agresywnych detergentów — wszystko bezpieczne dla dzieci i zwierząt 🐶👶

📩 sparklewash.nl

#ProfesjonalnySprzet #Karcher #Ekstrakcja #SparkleWash"""
    },
    {
        "id": 9,
        "title": "Opinia klienta",
        "groups": "3+4: POLACY W AACHEN + Polacy w Aachen & okolicach",
        "lang": "PL",
        "text": """⭐ "Moja sofa wygląda jak nowa!"

— Maria K., Heerlen

"Zamówiłam pranie sofy 3-osobowej po tym jak dzieci zostawiły po sobie ślady soków i kredek. Ekipa SparkleWash przyjechała na czas, wszystko wytłumaczyła i efekt przerósł moje oczekiwania. Sofa jak z salonu!"

Dziękujemy Maria! ❤️

👉 Też chcesz odświeżyć meble? Pisz śmiało!
📩 sparklewash.nl

#OpiniaKlienta #ZadowolonyKlient #PranieSofy #SparkleWash"""
    },
    {
        "id": 10,
        "title": "Dywan transformacja",
        "groups": "1+3: Polacy w Limburgii-Maastricht + POLACY W AACHEN",
        "lang": "PL",
        "text": """🟫 Dywan przeszedł transformację!

Ten dywan nie widział profesjonalnego prania od lat. Efekt po naszej ekstrakcji:
✨ Kolory znów żywe
✨ Zero zapachów
✨ Włókna odświeżone i puszyste

Cena: od €39 (do 6m²)

📩 sparklewash.nl | 📞 +31 6 84067379

#PranieDywanow #Transformacja #CzystyDom #SparkleWash"""
    },
    {
        "id": 11,
        "title": "Voor bedrijven (NL)",
        "groups": "6: Kleine Ondernemers Zuid Limburg",
        "lang": "NL",
        "text": """🏢 Ook voor bedrijven — schone indruk begint bij de entree

Wij reinigen:
🪑 Bureaustoelen & kantoormeubilair
🟫 Tapijttegels en vloerbedekking
🛋️ Wachtruimtes & ontvangstruimtes

Flexibele tijden — we komen buiten kantoortijden zodat uw bedrijf doordraait.

📩 Offerte op maat → sparklewash.nl

#Zakelijk #KantoorReinigen #Ondernemen #Limburg #SparkleWash"""
    },
    {
        "id": 12,
        "title": "Last minute / promocja",
        "groups": "2+5: Polacy w Limburgii + Aachen Ogłoszenia",
        "lang": "PL",
        "text": """⚡ Mamy wolny termin w ten weekend!

Ostatni slot na sobotę/niedzielę w Heerlen i okolicach. Jeśli masz sofę, dywan lub materac do odświeżenia — napisz teraz!

🎉 Dla pierwszych 3 osób: DARMOWA dezodoryzacja (usuwanie zapachów) gratis do każdej usługi!

📩 sparklewash.nl | 📞 +31 6 84067379

#OstatniTermin #Promocja #Weekend #SparkleWash"""
    },
]


def get_next_post():
    """Read index, return next post, increment index."""
    try:
        with open(INDEX_FILE) as f:
            idx = int(f.read().strip())
    except (FileNotFoundError, ValueError):
        idx = 0

    post = POSTS[idx % len(POSTS)]
    next_idx = (idx + 1) % len(POSTS)

    with open(INDEX_FILE, 'w') as f:
        f.write(str(next_idx))

    return post, idx + 1, next_idx


if __name__ == "__main__":
    post, current_num, next_num = get_next_post()

    print("=" * 55)
    print(f"📌 POST #{post['id']} — {post['title']}")
    print(f"🗣  Język: {post['lang']}")
    print(f"👥 Grupy: {post['groups']}")
    print(f"📅 Cykl: {current_num}/12 → następny będzie #{POSTS[next_num % len(POSTS)]['id']}")
    print("=" * 55)
    print()
    print(post['text'])
    print()
    print("---")
    print("📎 Wrzuć na strony: sparklewash.nl + FB fanpage + powyższe grupy")
    print("🖼  Dołącz zdjęcie (przed/po, sprzęt, lub grafika)")
