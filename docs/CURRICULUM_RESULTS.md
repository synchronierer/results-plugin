# Studenten-Schatzkammer: Curriculum-Progress

Basis des Sprints ARC-CODEX-RESULTS-CURRICULUM-1:
`72fc9fed69988a762f1bc37a42c817e1bdcc50f4`.

## Quellen und Zuständigkeit

Die Studentenansicht lädt Profildaten weiterhin über `fetchMyData()`.
Effektive Fächer kommen ausschließlich aus `fetchMySubjects()` (`/mysubjects`),
niemals aus Legacy-`currentProgress`. Der vorhandene Host-Helper muss ein Array
von Fachobjekten mit numerischer `id` und `name` liefern.

`fetchStudentCurriculumProgress(subject)` ruft pro Fach
`POST /my-curriculum-progress` mit ausschließlich `{ "subjectId": subject.id }`
auf. Die Identität kommt aus der Sitzung; `studentId`, `teacherId`, `classId`,
`grade` und `semesterId` werden nicht gesendet. Die Auflösung des aktuellen
Halbjahrs liegt im Backend. Es werden keine neuen HTTP-Routen registriert.

`normalizeCurriculumProgress()` übernimmt die zurückgegebene `semesterId`.
`loadCurriculumResultView()` wartet vor der Darstellung auf alle Fachantworten.
Bei verschiedenen Semester-IDs erscheint eine Aufforderung zum Neuladen statt
vermischter Ergebnisse. Erfolgreiche Fachkarten tragen die Semester-ID im
Darstellungsmodell und als DOM-Datensatz; interne IDs werden nicht als Text gezeigt.

## Etappen und Münzen

Central wird als `{ kind: "central", id, name, tokens, niveau, topicId, topicName }`
normalisiert, Flexible als `{ kind: "flexible", id, name, tokens }`.
Die beiden ID-Räume bleiben getrennt: `central:17` und `flexible:17` sind
verschiedene Etappen. Weder IDs noch Namen werden zum fachübergreifenden oder
artenübergreifenden Deduplizieren verwendet. Die Backendarrays werden vollständig
im Logbuch angezeigt, ohne eine chronologische Reihenfolge zu behaupten.

Central zeigt das aktuelle Thema und Niveau (1 Starter, 2 Bergsteiger,
3 Gipfelstürmer). Flexible wird als zusätzliche/flexible Etappe gekennzeichnet
und erhält kein erfundenes Thema oder Niveau. Zero-Token-Abschlüsse bleiben
sichtbar, zählen als bestandene Etappen und erzeugen keine Münzquellen.

`totalTokens` ist für Fachscore und Header autoritativ; die Detailsumme ersetzt
es nicht. Definitionen und Münzwerte sind aktuell und wirken retroaktiv.
Es gibt keinen Award-Snapshot, keine Transferberechnung und keinen Progress-Cache
in localStorage oder sessionStorage. Der bestehende Avatar-Verweis bleibt nutzbar.

100 Münzen bleiben das reguläre Ziel; die Backend-Toleranz bis 105 ändert keine
Notenschwelle (20/40/60/75/90). Die Hauptdarstellung enthält 100 Münzslots;
101–105 erscheinen als voller Score und zusätzlich als `+1` bis `+5 Zusatzmünzen`.
Auch die Accessibility-Beschriftung nennt 100 als Ziel, nicht als Maximalwert.
Die vorhandene PNG-Münze und die Unterscheidung verdient/offen bleiben erhalten.
`show_current_grade` wird respektiert; nicht abrufbare Settings nutzen Defaults.

## Fehler und Gesamtsumme

- `409 context_unassigned`: Fachstatus „Für dieses Fach ist noch kein SOL-Kontext
  zugeordnet.“ ohne Münzwertung oder Note.
- `409 current_semester_unavailable`: übergreifend „Das aktuelle Halbjahr ist
  noch nicht konfiguriert.“; keine Fachscores oder Nullwerte.
- 401 fordert erneute Anmeldung, 403 meldet fehlende Berechtigung.
- Netzwerk-, Server- und ungültige Datenantworten erhalten eine allgemeine
  Fehlermeldung ohne technische Rohantworten.

Der Header summiert erfolgreiche Fachwerte im gemeinsamen Halbjahr. Sobald ein
Fach fehlschlägt, ist die Teilsumme sichtbar „unvollständig“; ohne erfolgreiche
Antwort steht „Nicht verfügbar · unvollständig“. Semesterkonflikte sperren die
Summe vollständig. Die numerische Header-Animation ist im Studentenpfad deaktiviert,
damit sie diesen Status nicht überschreibt. Profilfehler blockieren die unabhängig
ladbaren Fachwerte nicht. Ohne effektive Fächer erscheint ein eigener Leerzustand.

## Staff und Prüfungen

Teacher/Admin bleiben auf `loadStudentResultView()` und dem Legacy-Results-Pfad.
Der Teacher-Einstieg und sein CSV-Request sind unverändert. Die optionalen Argumente
von `createBarChart()` und `arcanumResultsPopulateHeader()` wählen die neue
Datenquelle nur für den Studentenaufrufer. Ranking bleibt unverändert.

`node --test tests/*.test.cjs` ist dauerhaft in `scripts/check` integriert.
36 Tests mit synthetischen Daten prüfen Request-Vertrag, Normalisierung, Etappen,
Münzen/Noten, Fehler/Semester, Profil/Avatar, Settings, Staff/CSV sowie unveränderte
Routen und Backenddateien. Ein kleiner DOM-Testadapter prüft Struktur und Texte;
er ersetzt keine Browserprüfung für Layout und Animation.

Die Tests bestanden mit Node 22.14.0, lokal unter `.gradle/sprint-tools/node`
bereitgestellt (offizieller Download mit SHA-256-Abgleich). Der vollständige
Gradle-Build bleibt ohne konfigurierte `student-database.jar` blockiert.
Eine Browserprüfung auf Tablet und Desktop sowie ein synthetischer Integrationstest
mit den im Sprint genannten Backend-/Permission-Kandidaten stehen aus.
