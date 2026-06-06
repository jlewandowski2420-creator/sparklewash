"""
SparkleWash Facebook Post Rotator — Professional Edition
Returns the next post in the 12-post cycle based on stored index.
No emoji, clean professional tone. Polish groups + Dutch group.
"""
import os

INDEX_FILE = os.path.expanduser("~/.sparklewash-post-index")

POSTS = [
    {
        "id": 1,
        "title": "Poznaj nas",
        "groups": "Grupa 1+2: Polacy w Limburgii (obie grupy)",
        "lang": "PL",
        "text": """Twoja tapicerka wyglada gorzej niz powinna? A moze po prostu chcesz odswiezyc to, na czym siedzisz kazdego dnia?

Nazywam sie Jaxob i razem z ekipa SparkleWash przywracamy meblom drugie zycie. Profesjonalne pranie ekstrakcyjne — nie szukaj dalej.

Co nas wyroznia:
- Karcher SE 4001 — sprzet klasy przemyslowej, nie zabawka z marketu
- Dojezdzamy do Ciebie — nie musisz nigdzie dzwigac mebli
- Chemia bezpieczna dla dzieci i zwierzat
- Mowimy po polsku, niderlandzku, niemiecku i angielsku

Dzialamy w calej Limburgii oraz po niemieckiej stronie granicy: Aachen, Koln, Duren.

Pierwsza wycena za darmo i bez zobowiazan. Napisz, pogadamy.
sparklewash.nl"""
    },
    {
        "id": 2,
        "title": "Efekty prania sofy",
        "groups": "Grupa 3+4: POLACY W AACHEN + Polacy w Aachen i okolicach",
        "lang": "PL",
        "text": """Tak wyglada sofa po profesjonalnym praniu ekstrakcyjnym. Nie po odkurzaniu. Nie po przetarciu wilgotna szmatka. Po pelnym cyklu ekstrakcji goraca woda pod cisnieniem.

Roznica jest widoczna golym okiem — brud, kurz, roztocza i alergeny usuniete z warstw, do ktorych domowe metody po prostu nie docieraja.

Kazdy material jest inny — dlatego przed kazda usluga robimy inspekcje i dobieramy odpowiednia chemie. Bez eksperymentow. Bez ryzyka.

Przygotuj swoja sofe na nowy sezon.
sparklewash.nl"""
    },
    {
        "id": 3,
        "title": "Porada: plama z wina",
        "groups": "Grupa 1+5: Polacy w Limburgii-Maastricht + Aachen Ogloszenia",
        "lang": "PL",
        "text": """Plama z czerwonego wina na tapicerce? Wiekszosc osob od razu lapie za ciepla wode i szmatke — i wlasnie wtedy utrwala plame na dobre.

Zasady pierwszej pomocy dla tapicerki:
1. Sol kuchenna — wysyp obficie na swieza plame, wyciaga wilgoc
2. Nie trzyj — kazdy ruch rozciera barwnik glebiej we wlokna, odsaczaj papierowym recznikiem
3. Zimna woda + soda oczyszczona — dopiero potem delikatnie tamponuj

To dziala na wiekszosc swiezych plam z wina, kawy i sokow. Ale jesli plama zdazyla wyschnac albo domowe metody nie daja rady — napisz do nas. Mamy chemie, ktorej nie kupisz w supermarkecie.

sparklewash.nl"""
    },
    {
        "id": 4,
        "title": "Cennik i oferta (NL)",
        "groups": "Grupa 6: Kleine Ondernemers Zuid Limburg",
        "lang": "NL",
        "text": """Professionele meubelreiniging in Zuid-Limburg — eerlijke prijzen, geen verborgen kosten.

2-Zits Bank: €49
3-Zits Bank: €69
Hoekbank: €79
Vloerkleed (tot 6m²): €39
Matras (beide zijden): €35
Auto Interieur: €59

Elke prijs is inclusief voorreiniging, extractie met warm water onder druk, en droogtijd. Wij komen naar u toe in heel Limburg en de Duitse grensregio.

Nieuwe klanten ontvangen 10% korting op hun eerste afspraak met code FIRST10.

sparklewash.nl"""
    },
    {
        "id": 5,
        "title": "Alergie i roztocza",
        "groups": "Grupa 2+3: Polacy w Limburgii + POLACY W AACHEN",
        "lang": "PL",
        "text": """Budzisz sie z zatkanym nosem? Kichasz w sypialni wiecej niz w innych pomieszczeniach? To prawdopodobnie nie pylki — to Twoj materac.

W przecietnym materacu zyje od 100 tysiecy do 2 milionow roztoczy. Ich odchody to jeden z najsilniejszych alergenow domowych — szczególnie u dzieci.

Pranie ekstrakcyjne usuwa je calkowicie. Goraca woda + cisnienie + natychmiastowe odsysanie — zadna chemia nie zostaje w materiale. Materac jest suchy w kilka godzin, gotowy do spania tego samego dnia.

Koszt: 35 euro od materaca. Obie strony. Zero filozofii.

sparklewash.nl"""
    },
    {
        "id": 6,
        "title": "Wnetrze auta",
        "groups": "Grupa 4+5: Polacy w Aachen + Aachen Ogloszenia",
        "lang": "PL",
        "text": """Wnetrze samochodu to jedno z najbardziej zaniedbywanych miejsc jesli chodzi o higiene. Fotele, dywaniki, podsufitka — wszystko lapie kurz, bakterie i zapachy, ktorych zwykle odkurzanie nie rusza.

Oferujemy pelne pranie ekstrakcyjne wnetrza auta:
- Fotele i tapicerka — pranie w glab wlokien
- Dywaniki i podloga — usuwanie zaschnietego brudu
- Podsufitka — czyszczenie bez przemoczenia kleju

Cena: 59 euro za calosc. Czas: okolo 1-1.5 godziny. Przyjezdzamy pod wskazany adres.

sparklewash.nl"""
    },
    {
        "id": 7,
        "title": "Pielegnacja mebli (NL)",
        "groups": "Grupa 6: Kleine Ondernemers Zuid Limburg",
        "lang": "NL",
        "text": """Een stoffen bank gaat jaren mee — als je er goed voor zorgt. Vijf onderhoudstips van iemand die dagelijks met meubelstoffen werkt:

1. Wekelijks stofzuigen met meubelborstel — ook tussen de kussens en in de naden
2. Kussens maandelijks draaien — voorkomt kuilvorming
3. Huisdieren van de bank houden, of gebruik een plaid die je wekelijks wast
4. Vlekken direct behandelen — hoe langer je wacht, hoe dieper het intrekt
5. Een keer per jaar professioneel laten reinigen — extractie verwijdert wat je stofzuiger laat zitten

Professionele reiniging is geen luxe. Het is onderhoud. Net als olie verversen bij je auto.

sparklewash.nl"""
    },
    {
        "id": 8,
        "title": "Nasz sprzet",
        "groups": "Grupa 1+2: Polacy w Limburgii (obie grupy)",
        "lang": "PL",
        "text": """Kiedys probeuje sie myc tapicerke recznie — wiadro, szmatka, moze jakis zapozyczony od sasiada odkurzacz pioracy. Efekt? Mokra kanapa przez trzy dni i plamy, ktore wracaja po tygodniu.

Profesjonalne pranie ekstrakcyjne to zupelnie inna liga. Nasz zestaw:

Karcher SE 4001 — jednostka ekstrakcyjna. Wtryskuje goraca wode z detergentem pod cisnieniem i natychmiast ja odsysa razem z brudem. Nie zostawia wilgoci w materiale.

Chemia Global — srodowiskowa, biodegradowalna, bez wybielaczy i agresywnych rozpuszczalnikow. Bezpieczna dla welny, bawelny, mikrofibry i wszystkich typowych tkanin obiciowych.

Do tego wiertarka z miekkimi nakladkami do tapicerki — tam gdzie rekaw nie daje rady, wchodzi maszynowo.

Nie jestesmy Januszami z mopem. Robimy to zawodowo.

sparklewash.nl"""
    },
    {
        "id": 9,
        "title": "Opinia klienta",
        "groups": "Grupa 3+4: POLACY W AACHEN + Polacy w Aachen i okolicach",
        "lang": "PL",
        "text": """Dostalismy wiadomosc od Marii z Heerlen. Opublikowana za jej zgoda.

"Zamowilam pranie sofy 3-osobowej w SparkleWash po tym, jak moje dzieci zostawily slady sokow, czekolady i kredek na tapicerce. Przyjechali punktualnie, dokladnie obejrzeli material przed rozpoczeciem pracy i wytlumaczyli caly proces. Efekt? Nie przesadzam — sofa wyglada jak w dniu zakupu. Zero chemicznego zapachu, material miekki i swiezy."

Dziekujemy za zaufanie. Kazda taka opinia to dla nas potwierdzenie, ze warto robic swoje porzadnie.

Chcesz sprawdzic nasze uslugi? Pierwsza wycena jest darmowa.
sparklewash.nl"""
    },
    {
        "id": 10,
        "title": "Dywan transformacja",
        "groups": "Grupa 1+3: Polacy w Limburgii-Maastricht + POLACY W AACHEN",
        "lang": "PL",
        "text": """Dywany zbieraja wszystko — kurz, siersc zwierzat, okruchy, a czasem rzeczy, o ktorych wolisz nie wiedziec. Odkurzacz wyciaga tylko to, co na wierzchu. Reszta zostaje.

Pranie ekstrakcyjne dywanu:
- Woda + detergent wtryskiwane pod cisnieniem prosto w runo
- Natychmiastowe odsysanie razem z brudem
- Zero szorowania, zero ryzyka uszkodzenia wlokien

Po praniu dywan jest suchy w kilka godzin. Kolory wracaja do pierwotnego stanu. Zapachy znikaja.

Koszt: od 39 euro (dywan do 6m²). Wieksze formaty — wycena indywidualna.

sparklewash.nl"""
    },
    {
        "id": 11,
        "title": "Dla firm (NL)",
        "groups": "Grupa 6: Kleine Ondernemers Zuid Limburg",
        "lang": "NL",
        "text": """De staat van uw bedrijfsruimte zegt meer over uw onderneming dan uw website.

Wij reinigen:
- Bureaustoelen en kantoormeubilair — tot in de naden
- Tapijttegels en vloerbedekking — extractie reiniging
- Wachtruimtes, ontvangstbalies, representatieve ruimtes

Wij komen buiten kantoortijden — uw bedrijf draait door, wij werken om de hinder heen. Geen gedoe, geen uitval.

Vraag een offerte op maat aan. Binnen 24 uur reactie.
sparklewash.nl"""
    },
    {
        "id": 12,
        "title": "Promocja / wolny termin",
        "groups": "Grupa 2+5: Polacy w Limburgii + Aachen Ogloszenia",
        "lang": "PL",
        "text": """Mamy ostatnie wolne sloty na ten tydzien — Heerlen i okolice.

Sofa 2-osobowa: 49 EUR
Sofa 3-osobowa: 69 EUR
Naroznik: 79 EUR
Dywan do 6m²: 39 EUR
Materac: 35 EUR
Wnetrze auta: 59 EUR

Dla pierwszych trzech osob, ktore zarezerwuja termin w tym tygodniu — gratisy dodatek: dezodoryzacja i neutralizacja zapachow w cenie uslugi.

Napisz teraz albo zadzwon. Terminy znikaja szybciej niz myslisz.
sparklewash.nl | +31 6 84067379"""
    },
]


def get_next_post():
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
    print(f"POST #{post['id']} | {post['title']} | {post['lang']}")
    print(f"Grupy: {post['groups']}")
    print(f"Cykl: {current_num}/12 -> nastepny: #{POSTS[next_num % len(POSTS)]['id']}")
    print("=" * 55)
    print()
    print(post['text'])
    print()
    print("---")
    print("Post na: fanpage + powyzsze grupy + sparklewash.nl")
    print("Zdjecie: dolacz grafike z szablonu lub zdjecie przed/po")
