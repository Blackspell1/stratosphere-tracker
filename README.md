# Stratosphere Balloon Tracker 🎈

Eine interaktive Web-Simulation zur Verfolgung eines Stratosphärenballons. Dieses Projekt visualisiert den kompletten Flugzyklus (Aufstieg, Platzen der Hülle, Abstieg) auf einer interaktiven Karte und liefert dazu simulierte Live-Telemetriedaten in einem modernen Dashboard.

## ✨ Features

* **Hochauflösende Karte:** Integriert Satellitenbilder (Esri World Imagery) über die Leaflet.js-Bibliothek.
* **Flüssige Animationen:** Pulsierende Custom-Marker und weiches Kamera-Tracking (Auto-Panning) halten den Ballon immer im Fokus.

## 🛠️ Technologien

* **Frontend:** HTML5, CSS3 (inkl. CSS Variables, Grid, Flexbox & Keyframe Animations für den Marker)
* **Logik:** Vanilla JavaScript
* **Karten-Bibliothek:** [Leaflet.js](https://leafletjs.com/) (v1.9.4)

## 🚀 Installation & Nutzung

Das Projekt benötigt keinen Build-Step oder lokalen Server. 

1. Lade die Projektdateien (`index.html`, `style.css`, `app.js`) in einen gemeinsamen Ordner herunter.
2. Öffne die Datei `index.html` in einem modernen Webbrowser deiner Wahl.
3. Klicke im Mission Control Panel auf **Simulate Flight**, um den Aufstieg zu starten.
4. Mit dem **Reset**-Button kann der Flug jederzeit abgebrochen und der Ballon auf seine Startposition (Nähe Frankfurt) zurückgesetzt werden.
