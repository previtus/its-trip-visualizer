 -==============================================-
|                     README                     |
 -==============================================-

/------------------------------
1.) Schematicke znazorneni logiky
  \------------------------------
Viz prilozeny obrazek => 1_schematicky_obrazek.png


/------------------------------
2.) Struktura souboru - client
  \------------------------------

Kazdy soubor obsahuje na zacatku zakomentovany popisek, co zhruba obsahuje.

[Client side]
- index.html
  + javascript files:
	- mapFunc.js
	- statsFunc.js
	- graphFunc.js
	- helperFunc.js
	- jQueryVisuals.js
	- leafletStyles.js
	(a ostatni patrici k ruznym js frameworkum)

Hlavnim soubor client-side uzivatelskeho rozhrani je [index.html] - obsahuje zakladni strukturu tagu. Pouziva javascript, ktery je rozclenen do nekolika dalsich souboru podle logickych celku a pozadavku na umisteni kodu (napr. do jQuery segmentu $(document).ready).

Soubor [mapFunc.js] obsahuje funkce pracujici s mapou - jeji inicializaci, prace s gridem prekreslujicim mapu, reakci na kliknuti a highligtovani prvku na mape, vykreslovani jednotlivych tripu na mapu. Tez obsahuje navazani ovladacich prvku mapy na pozadovane funkce - mimo jine i pokyn k precteni stavu formulare (collectDataFromForm), sestaveni AJAX volani na server (getMultipleTrips) a nasledne zpracovani ziskaneho JSON objektu (processMultipleTripsData).

Soubor [statsFunc.js] obsahuje zakladni inicializaci objektu potrebnych pro zpracovani statistik - vytvori prazdne objekty s nulovymi pocty vyskytu jednotlivych hodnot. Tyto hodnoty jsou navysovany behem zpracovani JSON dat ze serveru (v mapFunc.js a funkci processMultipleTripsData). Pro statistiky, ktere rozdeluji tripy/legy do casovych kategorii zde jsou funkce, ktere k casu vrati kategorii (timeCategoryFromTime), pripadne ke kategorii nazev pro grafy (categoryNameFromCat). Zmenou "numberOfTimeCategories" a "numberOfLegTimeCategories" lze ovladat pocty kategorii ve statistikach.

Soubor [graphFunc.js] obsahuje pouhe vykresleni grafu (z dat objektu STATS vytvoreneho v statsFunc.js a naplneneho v mapFunc.js pri zpracovavani v processMultipleTripsData). Vyuziva js knihovnu pro kresleni grafu - http://www.highcharts.com/.

Soubor [helperFunc.js] obsahuje funkce, ktere neni nutno navazat na $(document).ready a ktere slouzi jako pomocne pro ostatni skripty. Konverze casu na lidsky citelny retezec, bezne matematicke vypocty pouzivane ve statistice, generovani nahodnych barev.

Soubor [jQueryVisuals.js] je naopak nutne obalen $(document).ready a obsahuje volani, ktera upravuji vzhled stranky pomoci jQuery selektoru a funkci (accordion, buttonset) a binding eventu na nektera tlacitka/posuvniky.

Drobny soubor [leafletStyles.js] obsahuje nastaveni vizualizace (tloustku, pruhlednost) zobrazenych tripu a je izolovan pro snadnou konfigurovatelnost.

/------------------------------
3.) Struktura souboru - server
  \------------------------------

[Server side]
- getFilteredData.jsp
  + helper classes:
	- src\java\tripVisualizerPkg\connection.java
	- src\java\tripVisualizerPkg\helperClass.java

Hlavnim souborem jest [getFilteredData.jsp] ktery je (jak je videt ve schematickem obrazku) volan AJAXem, sestavuje pomoci PreparedStatement query pro databazi a pote zpracuje odpoved a vraci ji v podobe JSON objektu.

Pro pripojeni do DB se pouziva soubor [connection.java] ktery obsahuje pouze prihlasovaci udaje. V pripade publikace kodu je vhodne tento soubor vlozit do .gitignore (hlavni idea tohoto rozdeleni).

Soubor [helperClass.java] obsahuje nektere funkce, ktere jsou vyuzity v getFilteredData.jsp pro parsovani dat z POST requestu (a zmenseni mnozstvi opakovaneho kodu).

/------------------------------
4.) Vyvojove prostredi
  \------------------------------

Jako vyvojove prostredi bylo zvoleno NetBeans IDE 8.0, ktere obsahuje vestaveny Tomcat server (na localhostu pracuji s Apache Tomcat 8.0.3.0, nicmene vse funguje i s Tomcatem 7 na its.felk.cvut.cz) a ulehcuje spusteni projektu a automaticky kompiluje pripadne zmeny do .war souboru.

/------------------------------
5.) Vyuzite frameworky
  \------------------------------

jQuery v1.11.0
jQuery UI v1.11.0 (s custom theme)

Bootstrap v3.2.0
+ Font Awesome 4.1.0
+ bootstrap-multiselect.js (https://github.com/davidstutz/bootstrap-multiselect)

Leaflet 0.8-dev (bf1ee0a)

Highcharts v4.0.3

Underscore.js 1.6.0

A nasledne scripty:
SeedRandom (https://github.com/davidbau/seedrandom)
jStat (https://github.com/jstat/jstat)