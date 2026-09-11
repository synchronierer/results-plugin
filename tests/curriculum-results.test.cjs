const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');

const sharedPath = 'src/main/resources/js/site/student-database.js';
const studentPath = 'src/main/resources/js/user/build_results.js';
const staffPath = 'src/main/resources/js/teacher/build_results.js';
const base = '72fc9fed69988a762f1bc37a42c817e1bdcc50f4';
class Element {
    constructor(tag) {
        this.tagName = tag; this.children = []; this.textContent = ''; this.dataset = {};
        this.attributes = {}; this.style = { setProperty() {} }; this.className = '';
        this.classList = { add: (...names) => { this.className += ' ' + names.join(' '); } };
        this.listeners = {};
    }
    appendChild(child) { this.children.push(child); return child; }
    replaceChildren(...children) { this.children = children; }
    setAttribute(key, value) { this.attributes[key] = value; }
    addEventListener(event, callback) { this.listeners[event] = callback; }
}
const all = element => [element, ...element.children.flatMap(all)];
const byClass = (element, name) => all(element).filter(e => e.className.split(' ').includes(name));
const text = element => all(element).map(e => e.textContent).join(' ');
const progress = (overrides = {}) => ({ semesterId: 12, totalTokens: 10,
    completedCentralTasks: [{ id: 17, name: 'Aktueller Name', tokens: 4, niveau: 1,
        topicId: 20, topicName: 'Aktuelles Thema' }],
    completedFlexibleTasks: [{ id: 17, name: 'Aktueller Name', tokens: 6 }], ...overrides });
function setup({ subjects = [{ id: 123, name: 'Testfach' }], responses = [], staff = false,
    config = {}, storageThrows = false } = {}) {
    const elements = Object.fromEntries(['charts', 'total-coins', 'student-name', 'student-class',
        'student-email', 'student-initials', 'student-avatar', 'student-rank', 'student-graduation',
        'studentId', 'download-student-results-csv'].map(id => [id, new Element('div')]));
    const calls = []; const events = []; const storageReads = [];
    const profile = { id: 99, firstName: 'Test', lastName: 'Profil', email: 'test@example.invalid',
        schoolClass: { label: 'Testklasse' }, completedTasks: [{ id: 1, name: 'Legacy', tokens: 80,
            topic: { subject: { name: 'Legacyfach' } } }], currentProgress: { Legacyfach: 80 } };
    const context = vm.createContext({ console, document: { readyState: 'loading',
        documentElement: new Element('html'), createElement: tag => new Element(tag),
        getElementById: id => elements[id], querySelectorAll: () => [],
        addEventListener: (event, callback) => events.push(callback) },
        window: { setTimeout() {}, localStorage: { getItem(key) {
            storageReads.push(key); if (storageThrows) throw Error('storage blocked');
            return '/arcanum-avatar-2.png';
        } } }, MutationObserver: class { observe() {} disconnect() {} },
        sessionStorage: { getItem: () => '99' },
        fetchMyData: async () => { calls.push('profile'); return profile; },
        fetchMySubjects: async () => { calls.push('subjects'); return subjects; },
        fetchPluginConfig: async () => { if (config === null) throw Error('forbidden'); return { values: config }; },
        fetchStudentData: async id => { calls.push(['staff', id]); return profile; },
        postDataAndDownload: (...args) => calls.push(['csv', ...args]),
        fetch: async (url, options) => { calls.push({ url, options });
            const response = responses.shift() ?? { ok: true, data: progress() };
            if (response instanceof Error) throw response;
            return { ...response, json: async () => response.data };
        }
    });
    vm.runInContext(fs.readFileSync(sharedPath, 'utf8'), context);
    let staffView;
    if (staff) {
        const load = context.loadStudentResultView;
        context.loadStudentResultView = (...args) => (staffView = load(...args));
    }
    vm.runInContext(fs.readFileSync(staff ? staffPath : studentPath, 'utf8'), context);
    return { context, elements, calls, profile, storageReads,
        run: async () => {
            if (!staff) return context.loadCurriculumResultView();
            await events.at(-1)();
            await staffView;
        } };
}

test('student uses effective subjects, numeric ID and exactly subjectId in self-service request', async () => {
    const s = setup(); await s.run();
    assert.ok(s.calls.includes('subjects')); assert.ok(s.calls.includes('profile'));
    const request = s.calls.find(call => call.url);
    assert.equal(request.url, '/my-curriculum-progress');
    assert.equal(request.options.method, 'POST');
    assert.deepEqual(JSON.parse(request.options.body), { subjectId: 123 });
    assert.equal(request.options.credentials, 'same-origin');
    assert.doesNotMatch(text(s.elements.charts), /Legacyfach|Legacy/);
});
for (const id of ['Fachname', '123', undefined, NaN]) {
    test(`invalid subject ID ${id} sends no progress request and never scores zero`, async () => {
        const s = setup({ subjects: [{ id, name: 'Test' }] }); await s.run();
        assert.equal(s.calls.filter(call => call.url).length, 0);
        assert.match(s.elements['total-coins'].textContent, /Nicht verfügbar/);
    });
}
test('normalization preserves kinds, equal IDs/names, current definitions and zero-token completions', () => {
    const s = setup(); const p = progress();
    p.completedCentralTasks.push({ id: 18, name: 'Ohne Münzen', tokens: 0, niveau: 2, topicName: 'Thema' });
    const model = s.context.normalizeCurriculumProgress(p);
    assert.equal(model.semesterId, 12); assert.equal(model.tasks.length, 3);
    assert.deepEqual(JSON.parse(JSON.stringify(model.tasks[0])), { kind: 'central', ...p.completedCentralTasks[0] });
    assert.deepEqual(JSON.parse(JSON.stringify(model.tasks[2])), { kind: 'flexible', ...p.completedFlexibleTasks[0] });
    assert.equal(s.context.arcanumResultCoinSources(model.tasks).length, 10);
    const card = s.context.createBarChart({}, 'Test', null, {}, model);
    assert.equal(byClass(card, 'arcanum-log-entry').length, 3);
    assert.match(text(card), /3 bestandene Etappen/); assert.match(text(card), /Ohne Münzen/);
    assert.match(text(card), /Aktueller Name/); assert.match(text(card), /Aktuelles Thema/);
    assert.match(text(card), /\+0/); assert.match(text(card), /\+4/); assert.match(text(card), /\+6/);
    const flexible = byClass(card, 'arcanum-log-entry--flexible')[0];
    assert.match(text(flexible), /Flexible \/ zusätzliche Etappe/);
    assert.doesNotMatch(text(flexible), /Starter|Bergsteiger|Gipfelstürmer|Thema/);
    assert.equal(byClass(card, 'arcanum-logbook__list')[0].tagName, 'ul');
});
for (const [level, label] of [[1, 'Starter'], [2, 'Bergsteiger'], [3, 'Gipfelstürmer']]) {
    test(`central level ${level}: ${label}`, () => {
        const s = setup(); const p = progress(); p.completedCentralTasks[0].niveau = level;
        assert.match(text(s.context.arcanumResultCreateLogbook(s.context.normalizeCurriculumProgress(p).tasks)), new RegExp(label));
    });
}
test('authoritative totalTokens controls card and header, independent of detail sum and legacy data', async () => {
    const s = setup({ responses: [{ ok: true, data: progress({ totalTokens: 42 }) }] }); await s.run();
    assert.equal(s.elements['total-coins'].textContent, '42');
    assert.equal(byClass(s.elements.charts, 'arcanum-result-score')[0].children[1].textContent, '42');
    assert.equal(byClass(s.elements.charts, 'arcanum-result-coin--earned').length, 42);
    assert.equal(s.elements.charts.children[0].dataset.semesterId, '12');
    assert.equal(s.elements['total-coins'].dataset.arcanumCounted, 'true');
});
for (const coins of [0, 100, 101, 102, 103, 104, 105]) {
    test(`${coins} coins retain 100 regular slots and accessible target/extra wording`, () => {
        const s = setup(); const card = s.context.createBarChart({}, 'Test', null, {},
            s.context.normalizeCurriculumProgress(progress({ totalTokens: coins })));
        assert.equal(byClass(card, 'arcanum-result-coin').length, 100);
        assert.equal(byClass(card, 'arcanum-result-coin--earned').length, Math.min(100, coins));
        assert.equal(byClass(card, 'arcanum-result-coin--open').length, 100 - Math.min(100, coins));
        assert.equal(byClass(card, 'arcanum-result-extra').length, coins > 100 ? 1 : 0);
        if (coins > 100) assert.ok(text(card).includes(`+${coins - 100} Zusatzmünzen`));
        assert.equal(byClass(card, 'arcanum-coin-stacks')[0].attributes['aria-label'], `${coins} Münzen; reguläres Ziel: 100 Münzen`);
    });
}
test('unchanged grade boundaries', () => {
    const { context: c } = setup();
    for (const [coins, grade] of [[0,0],[19,0],[20,5],[39,5],[40,4],[59,4],[60,3],[74,3],[75,2],[89,2],[90,1],[100,1],[105,1]]) {
        assert.equal(c.getGrade(coins), grade);
    }
});
for (const [status, code, message] of [[409,'context_unassigned','noch kein SOL-Kontext'],
    [409,'current_semester_unavailable','Halbjahr ist noch nicht konfiguriert'],
    [401,null,'erneut an'],[403,null,'keine Berechtigung'],[500,'SQL secret','nicht geladen']]) {
    test(`HTTP ${status} ${code} displays safe status without score or grade`, async () => {
        const s = setup({ responses: [{ ok: false, status, data: { error: code } }] }); await s.run();
        assert.match(text(s.elements.charts), new RegExp(message));
        assert.equal(byClass(s.elements.charts, 'arcanum-result-score').length, 0);
        assert.equal(byClass(s.elements.charts, 'arcanum-result-grade').length, 0);
        assert.match(s.elements['total-coins'].textContent, /Nicht verfügbar/);
        assert.doesNotMatch(text(s.elements.charts), /SQL secret/);
    });
}
test('network error leaves partial header visibly incomplete', async () => {
    const s = setup({ subjects: [{id:1,name:'A'},{id:2,name:'B'}],
        responses: [{ ok: true, data: progress() }, Error('network secret')] }); await s.run();
    assert.equal(s.elements['total-coins'].textContent, '10 · unvollständig');
    assert.doesNotMatch(text(s.elements.charts), /network secret/);
});
test('shared semester sum includes every successful subject', async () => {
    const s = setup({ subjects: [{id:1,name:'A'},{id:2,name:'B'}] }); await s.run();
    assert.equal(s.elements['total-coins'].textContent, '20');
});
for (const response of [{ ok: true, data: progress({ semesterId: 13 }) },
    { ok: false, status: 409, data: { code: 'current_semester_unavailable' } }]) {
    test('semester conflict/unavailable blocks all otherwise successful scores', async () => {
        const s = setup({ subjects: [{id:1,name:'A'},{id:2,name:'B'}],
            responses: [{ ok:true, data:progress() }, response] }); await s.run();
        assert.equal(byClass(s.elements.charts, 'arcanum-result-score').length, 0);
        assert.equal(s.elements['total-coins'].textContent, 'Nicht verfügbar');
        assert.match(text(s.elements.charts), /Halbjahr/);
    });
}
test('missing progress data is an error, never an invented zero', async () => {
    const s = setup({ responses: [{ ok:true, data:{} }] }); await s.run();
    assert.match(s.elements['total-coins'].textContent, /Nicht verfügbar/);
});
test('profile/avatar preserved and no curriculum cache used', async () => {
    const s = setup(); await s.run();
    assert.equal(s.elements['student-name'].textContent, 'Test Profil');
    assert.equal(s.elements['student-class'].textContent, 'Testklasse');
    assert.equal(s.elements['student-email'].textContent, 'test@example.invalid');
    assert.equal(s.elements['student-initials'].hidden, true);
    assert.deepEqual(s.storageReads, ['arcanum-avatar:student:99']);
    assert.doesNotMatch(fs.readFileSync(studentPath, 'utf8'), /localStorage|sessionStorage/);
});
test('blocked avatar storage retains profile and results', async () => {
    const s = setup({ storageThrows:true }); await s.run();
    assert.equal(s.elements['student-initials'].textContent, 'TP');
    assert.equal(s.elements['total-coins'].textContent, '10');
});
test('profile failure does not suppress curriculum results', async () => {
    const s = setup(); s.context.fetchMyData = async () => { throw Error('failed'); }; await s.run();
    assert.equal(s.elements['total-coins'].textContent, '10');
    assert.match(text(s.elements.charts), /Schülerprofil/);
});
test('subject failure does not suppress profile and cannot become zero', async () => {
    const s = setup(); s.context.fetchMySubjects = async () => { throw Error('failed'); }; await s.run();
    assert.equal(s.elements['student-name'].textContent, 'Test Profil');
    assert.match(s.elements['total-coins'].textContent, /unvollständig/);
});
for (const config of [{show_current_grade:false}, null]) {
    test(`settings respected with safe fallback: ${JSON.stringify(config)}`, async () => {
        const s = setup({ config }); await s.run();
        assert.equal(byClass(s.elements.charts, 'arcanum-result-grade').length, config ? 0 : 1);
    });
}
test('staff entry and CSV behavior retained; no student self-service calls', async () => {
    const s = setup({ staff:true }); await s.run();
    assert.equal(s.calls.filter(call => call.url).length, 0); assert.ok(!s.calls.includes('subjects'));
    assert.equal(s.elements['total-coins'].textContent, '80');
    assert.match(text(s.elements.charts), /Legacyfach/);
    assert.equal(s.elements.studentId.value, 99);
    await s.elements['download-student-results-csv'].listeners.submit({ preventDefault() {},
        target: { studentId: { value: '99' } } });
    assert.deepEqual(s.calls.at(-1), ['csv','/student-results-csv','{"studentId":99}','schueler_ergebnisse_99.csv']);
    assert.equal(fs.readFileSync(staffPath, 'utf8'), execFileSync('git', ['show', `${base}:${staffPath}`], {encoding:'utf8'}));
});
test('HTTP route metadata, backend and plugin permission configuration unchanged', () => {
    for (const path of ['src/main/resources/meta/paths/get_paths.json',
        'src/main/resources/plugin.yml', 'src/main/java/de/igslandstuhl/database/results/ResultsPlugin.java',
        'src/main/java/de/igslandstuhl/database/results/ResultsPluginConfig.java']) {
        assert.equal(fs.readFileSync(path, 'utf8'), execFileSync('git', ['show', `${base}:${path}`], {encoding:'utf8'}));
    }
});
