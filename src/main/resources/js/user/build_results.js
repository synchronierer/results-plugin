// Student-only curriculum controller. Staff keeps loadStudentResultView().
function normalizeCurriculumProgress(progress) {
    if (!progress || !Number.isInteger(progress.semesterId) ||
        !Number.isInteger(progress.totalTokens) || progress.totalTokens < 0 ||
        !Array.isArray(progress.completedCentralTasks) ||
        !Array.isArray(progress.completedFlexibleTasks)) {
        throw new Error('invalid_progress');
    }

    const normalizeTask = (task, kind) => {
        if (!task || !Number.isInteger(task.id) || typeof task.name !== 'string' ||
            !Number.isInteger(task.tokens) || task.tokens < 0) {
            throw new Error('invalid_progress');
        }
        const result = { kind, id: task.id, name: task.name, tokens: task.tokens };
        if (kind === 'central') {
            Object.assign(result, {
                niveau: task.niveau, topicId: task.topicId, topicName: task.topicName
            });
        }
        return result;
    };

    return {
        semesterId: progress.semesterId,
        totalTokens: progress.totalTokens,
        tasks: [
            ...progress.completedCentralTasks.map(task => normalizeTask(task, 'central')),
            ...progress.completedFlexibleTasks.map(task => normalizeTask(task, 'flexible'))
        ]
    };
}

async function fetchStudentCurriculumProgress(subject) {
    if (!Number.isInteger(subject?.id)) throw new Error('invalid_subject');
    const response = await fetch('/my-curriculum-progress', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: subject.id })
    });
    if (!response.ok) {
        let body;
        try { body = await response.json(); } catch { /* Never display raw responses. */ }
        const error = new Error('progress_unavailable');
        error.status = response.status;
        if (response.status === 409) error.code = body?.code ?? body?.error;
        throw error;
    }
    return normalizeCurriculumProgress(await response.json());
}

function curriculumErrorMessage(error) {
    if (error?.code === 'context_unassigned') {
        return 'Für dieses Fach ist noch kein SOL-Kontext zugeordnet.';
    }
    if (error?.code === 'current_semester_unavailable') {
        return 'Das aktuelle Halbjahr ist noch nicht konfiguriert.';
    }
    if (error?.status === 401) return 'Bitte melde dich erneut an, um deine Ergebnisse zu sehen.';
    if (error?.status === 403) return 'Du hast keine Berechtigung, diese Ergebnisse anzusehen.';
    return 'Die Ergebnisse konnten nicht geladen werden. Bitte lade die Seite erneut.';
}

function curriculumStatusCard(title, message) {
    const card = document.createElement('article');
    card.className = 'arcanum-result-card arcanum-result-error';
    card.setAttribute('role', 'status');
    const heading = document.createElement('h3');
    heading.textContent = title;
    const text = document.createElement('p');
    text.textContent = message;
    card.appendChild(heading);
    card.appendChild(text);
    return card;
}

async function loadCurriculumResultView() {
    const charts = document.getElementById('charts');
    const total = document.getElementById('total-coins');
    // Preserve loading/error qualifiers from the legacy numeric counter animation.
    if (total) total.dataset.arcanumCounted = 'true';
    arcanumResultsSetText('total-coins', 'Wird geladen …');
    charts?.replaceChildren();

    const profilePromise = (async () => {
        try {
            arcanumResultsPopulateHeader(await fetchMyData(), 'Wird geladen …');
            return null;
        } catch (error) {
            return curriculumStatusCard('Schülerprofil', curriculumErrorMessage(error));
        }
    })();
    const settingsPromise = (async () => {
        try {
            const config = await fetchPluginConfig('results_plugin');
            return config?.values || {};
        } catch { return {}; }
    })();

    try {
        const subjects = await fetchMySubjects();
        if (!Array.isArray(subjects) || subjects.some(subject =>
            !Number.isInteger(subject?.id) || typeof subject.name !== 'string')) {
            throw new Error('invalid_subjects');
        }
        const results = await Promise.all(subjects.map(async subject => {
            try { return { subject, progress: await fetchStudentCurriculumProgress(subject) }; }
            catch (error) { return { subject, error }; }
        }));
        const [profileError, resultSettings] = await Promise.all([profilePromise, settingsPromise]);
        if (profileError) charts?.appendChild(profileError);
        const semesterError = results.find(result =>
            result.error?.code === 'current_semester_unavailable');
        const semesters = new Set(results.filter(result => result.progress)
            .map(result => result.progress.semesterId));
        if (semesterError || semesters.size > 1) {
            arcanumResultsSetText('total-coins', 'Nicht verfügbar');
            charts?.appendChild(curriculumStatusCard('Schatzkammer', semesterError
                ? curriculumErrorMessage(semesterError.error)
                : 'Das Halbjahr hat sich während des Ladens geändert. Bitte lade die Seite erneut.'));
            return;
        }

        let sum = 0;
        let successful = 0;
        for (const result of results) {
            if (result.error) {
                charts?.appendChild(curriculumStatusCard(result.subject.name,
                    curriculumErrorMessage(result.error)));
            } else {
                sum += result.progress.totalTokens;
                successful += 1;
                const card = createBarChart(result.subject, result.subject.name,
                    null, resultSettings, result.progress);
                card.dataset.semesterId = String(result.progress.semesterId);
                charts?.appendChild(card);
            }
        }
        arcanumResultsSetText('total-coins', successful === results.length
            ? sum : successful > 0 ? `${sum} · unvollständig` : 'Nicht verfügbar · unvollständig');
        if (subjects.length === 0) {
            charts?.appendChild(curriculumStatusCard('Schatzkammer', 'Dir sind noch keine Fächer zugeordnet.'));
        }
    } catch (error) {
        const profileError = await profilePromise;
        if (profileError) charts?.appendChild(profileError);
        arcanumResultsSetText('total-coins', 'Nicht verfügbar · unvollständig');
        charts?.appendChild(curriculumStatusCard('Schatzkammer', curriculumErrorMessage(error)));
    }
}

document.addEventListener('DOMContentLoaded', loadCurriculumResultView);
