# Applicant's Pre-work

An interactive pre-work page for the UPLB Data Science Guild applicants. Participants open the link days before the session, move through fourteen slides, walk the seven-stage life cycle map, pass a sequence check and a three-question self-check, read what the hands-on asks of them, and write one question to bring.

Static HTML, CSS, and JavaScript. No build step, no dependencies, no network calls. All progress stays in the visitor's browser (`localStorage`).

Navigation: the Prev and Next buttons, the arrow keys (Home and End jump to the ends), and a horizontal swipe on touch. The band shows the slide readout and fills one tick per stage visited. Slides are sized to the screen; on phones a slide scrolls inside itself only when its content is taller than the screen.
