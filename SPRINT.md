# ARC-CODEX-RESULTS-CURRICULUM-1 — Schatzkammer auf Curriculum-Progress umstellen

## Ziel

Stelle ausschließlich die STUDENTEN-Ansicht der Arcanum-Schatzkammer vom bisherigen Legacy-Fortschritt auf den neuen assignment-aware Curriculum-Progress um.

Zielrepository:
synchronierer/results-plugin

Exakte Basis:
72fc9fed69988a762f1bc37a42c817e1bdcc50f4

Kein Deployment.
Kein DEMO.
Kein PROD.
Keine Live-Datenbanken.
Keine Runtime-Dateien verändern.
Keine anderen Repositories verändern.
Keine neuen Backend-Routen.
Keine Permission-Manager-Änderung.
Keine echten Schülerdaten verwenden.

AGENTS.md, CODING_RULES.md und docs/ sind verbindlich.

============================================================
ARCHITEKTURKONTEXT
============================================================

Die zentrale Source of Truth wurde vor diesem Sprint geprüft:

synchronierer/learn-monitor-control
Control-Stand:
e28135fedf582dc8c2b4d292b7820bcc40df3124

Architekturregel:
Ein Sprint verändert genau ein Zielrepository.

Canonical Backend-Kandidat:
c227310dac51d603458cff4a28c0126338055c40

Canonical Permission-Manager-Kandidat:
6069ab3124b1c7bb860f26323e3e2a275b74d451

Nicht selbst andere Repositories verändern.

============================================================
BACKEND-VERTRAG
============================================================

Studentenroute:

POST /my-curriculum-progress

Request für die aktuelle Schatzkammer:

{
  "subjectId": 123
}

semesterId bewusst weglassen.
Das Backend löst das konfigurierte aktuelle Halbjahr auf.

NICHT mitsenden:

- studentId
- teacherId
- classId
- grade

Die Studentidentität stammt ausschließlich aus der Session.

Erfolgsresponse:

{
  "semesterId": 12,
  "centralTokens": 4,
  "flexibleTokens": 6,
  "totalTokens": 10,
  "completedCentralTasks": [
    {
      "id": 101,
      "name": "Zentrale Etappe",
      "tokens": 4,
      "niveau": 1,
      "topicId": 20,
      "topicName": "Thema"
    }
  ],
  "completedFlexibleTasks": [
    {
      "id": 202,
      "name": "Flexible Etappe",
      "tokens": 6
    }
  ]
}

Semantik:

- totalTokens ist autoritativ.
- Werte und Namen entsprechen den aktuellen Definitionen.
- Münzwertänderungen wirken retroaktiv.
- Central und Flexible besitzen getrennte ID-Namensräume.
- central:17 und flexible:17 sind verschiedene Etappen.
- Namen niemals als Identität verwenden.
- Zero-Token-Abschlüsse bleiben im Detailarray.
- Flexible Transfers liefern nur die terminale aktuelle Etappe.
- Kein Award-Snapshot im Client.
- Reguläres Semesterziel: 100 Münzen.
- Backend-Hard-Limit: 105.

Fehler:

409 context_unassigned
= Für Fach/Halbjahr fehlt eine Curriculum-Zuordnung.

409 current_semester_unavailable
= Aktuelles Halbjahr ist nicht konfiguriert.

Beide Fehler dürfen NICHT als 0 Münzen dargestellt werden.

Permission Manager:

POST /my-curriculum-progress
Permission: curriculum_student_progress
Default: exakt STUDENT

Studenten benötigen nicht curriculum_view.

============================================================
AKTUELLER RESULTS-ZUSTAND
============================================================

Die Studenten-Schatzkammer verwendet aktuell noch:

- fetchMyData()
- studentData.completedTasks
- studentData.currentProgress
- Fake-Subject-Objekte aus currentProgress-Namen

Das muss für die Studentenansicht ersetzt werden.

Teacher/Admin-Results sind NICHT Teil dieses Sprints.

============================================================
FÄCHER
============================================================

Studentendaten weiterhin über fetchMyData() laden für:

- Name
- Klasse
- E-Mail
- Avatar
- Profildaten

Effektive Fächer dagegen über die bestehende Core-Funktion fetchMySubjects() bzw. /mysubjects laden.

Keine Fächer mehr aus studentData.currentProgress ableiten.

Keine Fachnamen als IDs verwenden.

Für Curriculum-Anfragen ausschließlich die echte numerische subject.id benutzen.

============================================================
CURRICULUM-PROGRESS
============================================================

Für jedes effektive Fach:

POST /my-curriculum-progress

Payload ausschließlich:

{
  "subjectId": subject.id
}

Keine semesterId mitsenden.

Keine studentId.
Keine teacherId.
Keine classId.
Keine grade.

Die Response-semesterId übernehmen.

Keine Curriculum-Daten in localStorage oder sessionStorage cachen.

Antworten verschiedener Fächer mit unterschiedlichen semesterId dürfen nicht unbemerkt gemeinsam dargestellt werden.

Falls während eines Semesterwechsels unterschiedliche semesterId zurückkommen:

- sauber neu laden
oder
- verständliche Reload-/Fehlermeldung anzeigen.

Kein Semester erraten.

============================================================
VIEW-MODELL
============================================================

Central mindestens normalisieren als:

{
  kind: "central",
  id,
  name,
  tokens,
  niveau,
  topicId,
  topicName
}

Flexible mindestens als:

{
  kind: "flexible",
  id,
  name,
  tokens
}

Central und Flexible niemals über bloße numerische IDs deduplizieren.

Backendarrays sind die autoritative Menge abgeschlossener Etappen.

============================================================
MÜNZEN UND NOTEN
============================================================

Fachmünzen:

coins = progress.totalTokens

Nicht mehr aus studentData.completedTasks berechnen.

Notenschwellen unverändert:

20 -> Note 5
40 -> Note 4
60 -> Note 3
75 -> Note 2
90 -> Note 1

100 bleibt das reguläre Ziel.

105 verändert die Notenskala NICHT.

============================================================
101 BIS 105 MÜNZEN
============================================================

Die bestehende Hauptskala bleibt bei 100 Zielmünzen.

Beispiel 103:

- Score zeigt 103 Münzen.
- Hauptdarstellung zeigt 100 reguläre Zielmünzen.
- zusätzlich sichtbar: +3 Zusatzmünzen.
- Zusatzmünzen dürfen als kleine zusätzliche earned-coin-Gruppe erscheinen.

Nicht "103 von 100 möglichen Münzen" behaupten.

Accessibility entsprechend korrekt gestalten.

Keine neuen Bildassets.
Bestehende PNG-Münze weiterverwenden.

============================================================
ERFOLGSLOGBUCH
============================================================

Pro Fach exakt:

completedCentralTasks
+
completedFlexibleTasks

Central anzeigen mit:

- name
- tokens
- topicName
- niveau:
  1 Starter
  2 Bergsteiger
  3 Gipfelstürmer

Flexible anzeigen mit:

- name
- tokens
- Kennzeichnung als flexible oder zusätzliche Etappe
- kein erfundenes Topic
- kein erfundenes Niveau

Zero-Token-Etappen:

- im Logbuch sichtbar
- zählen bei bestandenen Etappen
- erzeugen keine Earned-Coin-Slots
- +0 darf angezeigt werden

Keine chronologische Reihenfolge behaupten.

============================================================
HEADER-GESAMTMÜNZEN
============================================================

Gesamtmünzen der Studenten-Schatzkammer:

Summe aller erfolgreichen progress.totalTokens der dargestellten Fächer desselben aktuellen Halbjahres.

Nicht mehr aus Legacy completedTasks.

Fehlgeschlagenes Fach niemals als 0 werten.

Wenn mindestens ein Fach nicht geladen werden konnte, muss der Gesamtwert sichtbar als unvollständig gekennzeichnet werden.

Ranking bleibt außerhalb dieses Sprints.

============================================================
FEHLERDARSTELLUNG
============================================================

context_unassigned:

Für das betroffene Fach einen verständlichen Status anzeigen:

"Für dieses Fach ist noch kein SOL-Kontext zugeordnet."

Keine Note.
Keine 0-Münzen-Wertung.

current_semester_unavailable:

Übergreifend anzeigen:

"Das aktuelle Halbjahr ist noch nicht konfiguriert."

Keine Nullwerte berechnen.

401/403 sinnvoll behandeln.

Andere Netzwerk-/Serverfehler sichtbar melden.

Keine SQL-Details, internen IDs oder technischen Rohantworten anzeigen.

============================================================
STAFF-REGRESSION
============================================================

Nur die Studentenansicht migrieren.

Teacher/Admin bleiben vorerst auf dem bisherigen Results-Pfad.

Daher:

- teacher/build_results.js funktionsfähig lassen
- Staff niemals /my-curriculum-progress verwenden lassen
- CSV-Verhalten nicht verändern
- gemeinsame Helper abwärtskompatibel halten oder Student-Pfad sauber trennen

Teacher/Admin Curriculum-Results folgen später separat.

============================================================
DESIGN
============================================================

Bestehende Schatzkammer-Gestaltung erhalten.

Bestehende Settings respektieren, insbesondere show_current_grade.

Keine SVG-Ersatzgrafiken.
Keine komplette Neugestaltung.

CSS nur ergänzen, wo nötig für:

- Flexible Etappen
- Zusatzmünzen 101–105
- Fehler-/Statuskarten

============================================================
TESTS
============================================================

Belastbare automatisierte Tests ergänzen.

Bevorzugt Node-Bordmittel ohne große neue Testbibliothek.

Mindestens testen:

1. Studentenansicht lädt Fächer über fetchMySubjects bzw. /mysubjects.
2. numerische subject.id wird verwendet.
3. Request enthält keinen studentId.
4. Request enthält keinen teacherId.
5. Request enthält keinen classId.
6. Request enthält keinen grade.
7. totalTokens steuert die Fachmünzen.
8. Header basiert auf Curriculum-Progress.
9. Central wird korrekt normalisiert.
10. Flexible wird korrekt normalisiert.
11. central:17 und flexible:17 bleiben getrennt.
12. identische Namen bleiben getrennte Etappen.
13. Zero-Token-Etappe bleibt im Logbuch.
14. Zero-Token erzeugt keine Earned-Coin-Slots.
15. aktueller Taskname wird angezeigt.
16. aktueller topicName wird angezeigt.
17. aktuelle tokens werden angezeigt.
18. Niveau 1/2/3 korrekt.
19. Flexible erfindet kein Topic oder Niveau.
20. 100 Münzen regulär.
21. 101–105 als Zusatzmünzen sichtbar.
22. Notenschwellen 20/40/60/75/90 unverändert.
23. context_unassigned nicht als 0.
24. current_semester_unavailable nicht als 0.
25. unbekannter Fehler nicht als 0.
26. semesterId wird übernommen.
27. verschiedene semesterId werden nicht unbemerkt gemischt.
28. currentProgress-Fachnamen werden nicht mehr als IDs benutzt.
29. Teacher-Pfad bleibt funktional.
30. Staff ruft Self-Service-Route nicht auf.
31. CSV bleibt unverändert.
32. Avatar/Header bleiben funktionsfähig.
33. keine neuen HTTP-Routen.
34. keine Backend-/PM-Logik lokal duplizieren.

Neue JS-Tests dauerhaft in scripts/check aufnehmen.

Pflichtprüfungen:

scripts/check
git diff --check

============================================================
DOKUMENTATION
============================================================

Ergänze:

docs/CURRICULUM_RESULTS.md

Dokumentiere kompakt:

- /mysubjects als Fachquelle
- /my-curriculum-progress als Fortschrittsquelle
- Current-Semester-Auflösung im Backend
- 100 Ziel / 105 Toleranz
- getrennte Central/Flexible-ID-Räume
- context_unassigned
- current_semester_unavailable
- kein Award-Snapshot
- kein Progress-Cache
- Staff bleibt zunächst auf Legacy-Pfad

============================================================
NICHT TEIL DIESES SPRINTS
============================================================

Nicht umsetzen:

- Teacher/Admin Curriculum-Results
- CSV-Neuberechnung
- Ranking
- Dashboard außerhalb Results
- Backend
- Permission Manager
- Overlay
- Attendance
- Deployment
- Datenmigration
- automatische Kontextzuweisung

============================================================
ABSCHLUSSBERICHT
============================================================

Berichte:

- exakte Basis
- geänderte Dateien
- neue/angepasste Funktionen
- Fachquelle
- Progressquelle
- Mapping Central/Flexible
- ID-Trennung
- Darstellung 100/105
- Header-Gesamtsumme
- Fehlerdarstellung
- Staff-Regressionsschutz
- Testanzahl
- scripts/check Ergebnis
- git diff --check Ergebnis
- verbleibende Risiken
- kein Deployment
- DEMO unverändert
- PROD unverändert
- keine anderen Repositories verändert
