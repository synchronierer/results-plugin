
// ARCANUM COIN RESULTS V1
const RESULT_MAX_COINS = 100;

const RESULT_GRADE_THRESHOLDS = [
    { grade: 5, min: 20 },
    { grade: 4, min: 40 },
    { grade: 3, min: 60 },
    { grade: 2, min: 75 },
    { grade: 1, min: 90 }
];

function getGrade(coins) {
    const value = Number(coins) || 0;

    if (value >= 90) return 1;
    if (value >= 75) return 2;
    if (value >= 60) return 3;
    if (value >= 40) return 4;
    if (value >= 20) return 5;

    return 0;
}

function getGradeLabel(grade) {
    return {
        1: "1 (Sehr gut)",
        2: "2 (Gut)",
        3: "3 (Befriedigend)",
        4: "4 (Ausreichend)",
        5: "5 (Mangelhaft)",
        0: "Noch keine Note"
    }[grade] || "Noch keine Note";
}

function getNextGrade(coins) {
    const value = Number(coins) || 0;

    return RESULT_GRADE_THRESHOLDS.find(
        threshold => value < threshold.min
    ) || null;
}

function createGradeScale() {
    const scale = document.createElement("div");
    scale.className = "grade-scale";

    RESULT_GRADE_THRESHOLDS.forEach(entry => {
        const label = document.createElement("span");

        label.className = "grade-label";
        label.textContent = `${entry.min} · Note ${entry.grade}`;
        label.style.left = `${entry.min}%`;

        scale.appendChild(label);
    });

    return scale;
}

// ARCANUM RESULTS LOGBOOK V2

function arcanumResultSubjectName(task) {
    return (
        task?.topic?.subject?.name ??
        task?.subject?.name ??
        task?.subject ??
        ''
    );
}

function arcanumResultLevelLabel(level) {
    return {
        1: 'Starter',
        2: 'Bergsteiger',
        3: 'Gipfelstürmer'
    }[Number(level)] || 'Etappe';
}

function arcanumResultCompletedTasks(studentData, subjectName) {
    const seen = new Set();

    return (studentData?.completedTasks || []).filter(task => {
        if (arcanumResultSubjectName(task) !== subjectName) {
            return false;
        }

        const key = String(
            task?.id ??
            `${task?.topic?.id ?? 'topic'}:${task?.name ?? 'task'}`
        );

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function arcanumResultCoinSources(tasks) {
    const sources = [];

    tasks.forEach(task => {
        const tokens = Math.max(0, Number(task?.tokens) || 0);

        for (let index = 0; index < tokens; index += 1) {
            sources.push(task);
        }
    });

    return sources;
}

function arcanumResultCreateCoinStacks(tasks, coins) {
    const container = document.createElement('div');
    container.className = 'arcanum-coin-stacks';
    container.setAttribute(
        'aria-label',
        `${coins} Münzen; reguläres Ziel: ${RESULT_MAX_COINS} Münzen`
    );

    const sources = arcanumResultCoinSources(tasks);
    const coinsPerStack = 5;
    const stackCount = Math.ceil(RESULT_MAX_COINS / coinsPerStack);

    for (
        let stackIndex = 0;
        stackIndex < stackCount;
        stackIndex += 1
    ) {
        const pile = document.createElement('span');
        pile.className = 'arcanum-coin-pile';

        const firstCoin = stackIndex * coinsPerStack + 1;
        const slots = Math.min(
            coinsPerStack,
            RESULT_MAX_COINS - stackIndex * coinsPerStack
        );

        for (let slot = 0; slot < slots; slot += 1) {
            const coinNumber = firstCoin + slot;
            const coin = document.createElement('span');
            const earned = coinNumber <= coins;
            const source = sources[coinNumber - 1];

            coin.className = 'arcanum-result-coin';
            coin.classList.add(
                earned
                    ? 'arcanum-result-coin--earned'
                    : 'arcanum-result-coin--open'
            );

            coin.style.bottom = `${slot * 4}px`;
            coin.style.zIndex = String(slot + 1);

            if (earned && source) {
                const taskName =
                    source?.name || 'Abgeschlossene Etappe';
                const reward =
                    Math.max(0, Number(source?.tokens) || 0);

                coin.title =
                    `${taskName} · ${reward} Münzen`;
            } else if (earned) {
                coin.title = `Erreichte Münze ${coinNumber}`;
            } else {
                coin.title =
                    `Münze ${coinNumber} noch nicht erreicht`;
            }

            pile.appendChild(coin);
        }

        container.appendChild(pile);
    }

    return container;
}

function arcanumResultCreateLogbook(tasks) {
    const logbook = document.createElement('section');
    logbook.className = 'arcanum-logbook';

    const heading = document.createElement('h4');
    heading.className = 'arcanum-logbook__heading';
    heading.textContent = 'Erfolgslogbuch';

    logbook.appendChild(heading);

    if (tasks.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'arcanum-logbook__empty';
        empty.textContent =
            'In diesem Fach wurde noch keine Etappe abgeschlossen.';

        logbook.appendChild(empty);
        return logbook;
    }

    const list = document.createElement(tasks.some(task => task.kind) ? 'ul' : 'ol');
    list.className = 'arcanum-logbook__list';

    tasks.forEach(task => {
        const entry = document.createElement('li');
        entry.className = 'arcanum-log-entry';

        const coin = document.createElement('img');
        coin.className = 'arcanum-log-entry__coin';
        coin.src = '/arcanum-coin.png';
        coin.alt = '';

        const content = document.createElement('div');
        content.className = 'arcanum-log-entry__content';

        const title = document.createElement('strong');
        title.className = 'arcanum-log-entry__title';
        title.textContent =
            task?.name || 'Abgeschlossene Etappe';

        const meta = document.createElement('span');
        meta.className = 'arcanum-log-entry__meta';

        const metaParts = [];

        if (task.kind === 'flexible') {
            entry.classList.add('arcanum-log-entry--flexible');
            metaParts.push('Flexible / zusätzliche Etappe');
        } else if (task?.topicName || task?.topic?.name) {
            metaParts.push(task.topicName || task.topic.name);
        }

        if (task.kind !== 'flexible' && task?.niveau != null) {
            metaParts.push(
                arcanumResultLevelLabel(task.niveau)
            );
        }

        meta.textContent = metaParts.join(' · ');

        const reward = document.createElement('strong');
        reward.className = 'arcanum-log-entry__reward';
        reward.textContent =
            `+${Math.max(0, Number(task?.tokens) || 0)}`;

        content.appendChild(title);

        if (meta.textContent) {
            content.appendChild(meta);
        }

        entry.appendChild(coin);
        entry.appendChild(content);
        entry.appendChild(reward);
        list.appendChild(entry);
    });

    logbook.appendChild(list);
    return logbook;
}

function createBarChart(subject, subjectName, studentData, settings, curriculumProgress = null) {
    const chart = document.createElement('article');
    chart.className = 'bar-chart arcanum-result-card';

    const tasks = curriculumProgress?.tasks ?? arcanumResultCompletedTasks(
        studentData,
        subjectName
    );

    const coins = curriculumProgress?.totalTokens ?? tasks.reduce(
        (sum, task) =>
            sum + Math.max(0, Number(task?.tokens) || 0),
        0
    );

    const grade = getGrade(coins);
    const nextGrade = getNextGrade(coins);

    const header = document.createElement('header');
    header.className = 'arcanum-result-card__header';

    const heading = document.createElement('div');

    const title = document.createElement('h3');
    title.className = 'arcanum-result-card__title';
    title.textContent = subjectName;

    const stageCount = document.createElement('span');
    stageCount.className = 'arcanum-result-card__stage-count';
    stageCount.textContent =
        `${tasks.length} bestandene ` +
        `${tasks.length === 1 ? 'Etappe' : 'Etappen'}`;

    heading.appendChild(title);
    heading.appendChild(stageCount);

    const score = document.createElement('div');
    score.className = 'arcanum-result-score';

    const scoreCoin = document.createElement('img');
    scoreCoin.src = '/arcanum-coin.png';
    scoreCoin.alt = '';

    const scoreNumber = document.createElement('strong');
    scoreNumber.textContent = String(coins);

    const scoreLabel = document.createElement('span');
    scoreLabel.textContent = 'Münzen';

    score.appendChild(scoreCoin);
    score.appendChild(scoreNumber);
    score.appendChild(scoreLabel);

    header.appendChild(heading);
    header.appendChild(score);
    chart.appendChild(header);

    const status = document.createElement('div');
    status.className = 'arcanum-result-status';

    if (!settings || settings.show_current_grade !== false) {
        const gradeInfo = document.createElement('span');
        gradeInfo.className = 'arcanum-result-grade';
        gradeInfo.textContent =
            `Aktuelle Note: ${getGradeLabel(grade)}`;

        status.appendChild(gradeInfo);
    }

    const nextInfo = document.createElement('span');
    nextInfo.className = 'arcanum-result-next';

    if (nextGrade) {
        nextInfo.textContent =
            `${nextGrade.min - coins} Münzen bis ` +
            `Note ${nextGrade.grade}`;
    } else {
        nextInfo.textContent =
            'Höchste Notenstufe erreicht';
    }

    status.appendChild(nextInfo);
    chart.appendChild(status);

    const coinSection = document.createElement('section');
    coinSection.className = 'arcanum-result-coins';

    const coinHeading = document.createElement('strong');
    coinHeading.className = 'arcanum-result-coins__heading';
    coinHeading.textContent =
        `${coins} Münzen · Ziel: ${RESULT_MAX_COINS} Münzen`;

    coinSection.appendChild(coinHeading);
    if (coins > RESULT_MAX_COINS) {
        const extra = document.createElement('p');
        extra.className = 'arcanum-result-extra';
        extra.textContent = `+${coins - RESULT_MAX_COINS} Zusatzmünzen`;
        coinSection.appendChild(extra);
    }
    coinSection.appendChild(
        arcanumResultCreateCoinStacks(tasks, coins)
    );
    coinSection.appendChild(
        createGradeScale()
    );

    chart.appendChild(coinSection);
    chart.appendChild(
        arcanumResultCreateLogbook(tasks)
    );

    return chart;
}


// ARCANUM TREASURY HEADER V1

const ARCANUM_RESULTS_AVATAR_VERSION = "20260720-2";

function arcanumResultsEntityId(value) {
    if (
        typeof value === "string" ||
        typeof value === "number"
    ) {
        return value;
    }

    return value?.id ?? value?.value ?? null;
}

function arcanumResultsInitials(firstName, lastName) {
    return `${String(firstName || "").charAt(0)}${
        String(lastName || "").charAt(0)
    }`.toUpperCase() || "?";
}

function arcanumResultsUniqueCompletedTasks(studentData) {
    const seen = new Set();

    return (studentData?.completedTasks || []).filter(task => {
        const key = String(
            task?.id ??
            `${task?.topic?.id ?? "topic"}:${task?.name ?? "task"}`
        );

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

function arcanumResultsSetText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = String(value ?? "–");
    }
}

function arcanumResultsPopulateHeader(studentData, curriculumTotal = null) {
    const firstName = studentData?.firstName || "";
    const lastName = studentData?.lastName || "";
    const fullName =
        `${firstName} ${lastName}`.trim() || "Schülerprofil";

    arcanumResultsSetText("student-name", fullName);
    arcanumResultsSetText(
        "student-class",
        studentData?.schoolClass?.label || "–"
    );
    arcanumResultsSetText(
        "student-email",
        studentData?.email || "–"
    );
    arcanumResultsSetText(
        "student-initials",
        arcanumResultsInitials(firstName, lastName)
    );
    arcanumResultsSetText("student-rank", "noch offen");

    const graduation = studentData?.graduationLevel;

    if (
        typeof graduation === "string" &&
        graduation.trim()
    ) {
        arcanumResultsSetText(
            "student-graduation",
            graduation
        );
    }

    const completedTasks =
        curriculumTotal === null ? arcanumResultsUniqueCompletedTasks(studentData) : [];

    const totalCoins = completedTasks.reduce(
        (sum, task) =>
            sum + Math.max(0, Number(task?.tokens) || 0),
        0
    );

    arcanumResultsSetText("total-coins", curriculumTotal ?? totalCoins);

    const studentId =
        arcanumResultsEntityId(studentData?.id);

    if (studentId !== null) {
        const storageKey =
            `arcanum-avatar:student:${studentId}`;

        let avatarPath = null;
        try {
            avatarPath = window.localStorage.getItem(storageKey);
        } catch {
            // The profile initials remain usable when browser storage is disabled.
        }

        if (
            avatarPath &&
            /^\/arcanum-avatar-\d+\.png$/.test(avatarPath)
        ) {
            const avatar =
                document.getElementById("student-avatar");

            const initials =
                document.getElementById("student-initials");

            avatar?.style.setProperty(
                "background-image",
                `url("${avatarPath}?v=${
                    ARCANUM_RESULTS_AVATAR_VERSION
                }")`,
                "important"
            );

            avatar?.style.setProperty(
                "background-size",
                "cover",
                "important"
            );

            avatar?.style.setProperty(
                "background-position",
                "center",
                "important"
            );

            avatar?.classList.add("has-selected-avatar");

            if (initials) {
                initials.hidden = true;
            }
        }
    }

    document.title = `Schatzkammer – ${fullName}`;
}

async function loadStudentResultView(studentData) {
    // /get-plugin is not accessible to student accounts.
    // Use safe defaults and override them only when configuration is readable.
    const resultSettings = {
        show_prognosis: true,
        show_current_progress: true,
        show_current_grade: true
    };

    try {
        const config = await fetchPluginConfig('results_plugin');

        if (config && config.values) {
            Object.assign(resultSettings, config.values);
        }
    } catch (error) {
        console.warn(
            'Results Plugin: Konfiguration für diese Rolle nicht abrufbar; Standardwerte werden verwendet.',
            error
        );
    }

    arcanumResultsPopulateHeader(studentData);

    // Get all subjects from progress keys
    const subjectNames = Object.keys(studentData.currentProgress || {});
    // If you have subject objects, map them here; else, use names as fallback
    // For demo: create fake subject objects
    const subjects = subjectNames.map(name => ({ id: name, name }));

    const charts = document.getElementById('charts');
    subjects.forEach(subject => {
        charts.appendChild(createBarChart(subject, subject.name, studentData, resultSettings));
    });
}

/* ARCANUM TREASURY ANIMATION V4 */
(() => {
    "use strict";

    let scheduled = false;
    let rounds = 0;

    function animateEarnedCoins() {
        const coins = [
            ...document.querySelectorAll(
                ".arcanum-result-coin--earned"
                + ":not([data-arcanum-animated])"
            )
        ];

        coins.forEach((coin, index) => {
            coin.dataset.arcanumAnimated = "true";
            coin.style.setProperty(
                "--arcanum-coin-delay",
                `${Math.min(index * 42, 2100)}ms`
            );
            coin.classList.add("arcanum-coin-arrival");
        });
    }

    function animateNumber(element) {
        if (
            !element
            || element.dataset.arcanumCounted === "true"
        ) {
            return;
        }

        const value = Number.parseInt(
            element.textContent.trim(),
            10
        );

        if (!Number.isFinite(value) || value < 1) {
            return;
        }

        element.dataset.arcanumCounted = "true";
        element.classList.add("arcanum-total-counting");

        const duration = 720;
        const start = performance.now();

        function frame(now) {
            const progress = Math.min(
                (now - start) / duration,
                1
            );
            const eased =
                1 - Math.pow(1 - progress, 3);

            element.textContent = String(
                Math.round(value * eased)
            );

            if (progress < 1) {
                requestAnimationFrame(frame);
            } else {
                element.textContent = String(value);
            }
        }

        requestAnimationFrame(frame);
    }

    function animateCounters() {
        document.querySelectorAll(
            ".arcanum-result-score strong, "
            + ".arcanum-profile__score strong, "
            + ".arcanum-profile__metrics strong, "
            + "#total-coins, "
            + "#student-total-coins"
        ).forEach(animateNumber);
    }

    function run() {
        scheduled = false;
        animateEarnedCoins();
        animateCounters();
        rounds += 1;
    }

    function schedule() {
        if (scheduled) {
            return;
        }

        scheduled = true;
        window.setTimeout(run, 80);
    }

    if (document.readyState === "loading") {
        document.addEventListener(
            "DOMContentLoaded",
            schedule,
            { once: true }
        );
    } else {
        schedule();
    }

    const observer = new MutationObserver(() => {
        if (rounds < 12) {
            schedule();
        }
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });

    window.setTimeout(
        () => observer.disconnect(),
        5000
    );
})();
/* /ARCANUM TREASURY ANIMATION V4 */
