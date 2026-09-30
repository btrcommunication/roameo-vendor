// Exercise the actual form handlers with mocked native controls and HTTP responses.
// Run with: node scripts/test-coupon-edit.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function compile(file) {
    return ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
}

function mount({ editing = true, loadFails = false, token = 'test-token' } = {}) {
    const state = [];
    const dependencies = [];
    const effects = [];
    const requests = [];
    const navigations = [];
    const alerts = [];
    let cursor = 0;
    let locationRequests = 0;
    let tree;
    let failLoad = loadFails;
    let failSave = false;
    let ignorePrice = false;
    const coupon = {
        id: 42, title: 'Saved coupon', description: 'Saved description',
        category_id: 3, city: 'Saved city', price: '25.00', max_quantity: 2,
        is_active: '0', vendor_id: 77, campaign_type: 'special',
        valid_from: '2026-09-01 10:30:00', valid_until: '2026-10-30 21:45:00',
        banner_image_url: '/uploads/coupons/existing.jpg',
    };
    const response = (ok, data) => ({
        ok, status: ok ? 200 : 400,
        headers: { get: () => 'application/json' },
        json: async () => data,
        text: async () => JSON.stringify(data),
    });
    const react = {
        useState(initial) {
            const index = cursor++;
            if (!(index in state)) state[index] = initial;
            return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
        },
        useRef(initial) {
            const index = cursor++;
            if (!(index in state)) state[index] = { current: initial };
            return state[index];
        },
        useEffect(effect, deps) {
            const index = cursor++;
            if (!dependencies[index] || deps.some((value, i) => value !== dependencies[index][i])) {
                dependencies[index] = deps;
                effects.push(effect);
            }
        },
    };
    const jsx = (type, props) => ({ type, props });
    const native = {
        Platform: { OS: 'web' }, StyleSheet: { create: styles => styles },
        Alert: { alert: (...args) => alerts.push(args) },
    };
    for (const name of ['ActivityIndicator', 'Image', 'ScrollView', 'Switch', 'Text', 'TextInput', 'TouchableOpacity', 'View']) native[name] = name;
    const priceModule = { exports: {} };
    vm.runInNewContext(compile('src/utils/couponPricing.ts'), priceModule);
    const themeModule = { exports: {} };
    vm.runInNewContext(compile('src/constants/theme.ts'), themeModule);
    const mocks = {
        react,
        'react/jsx-runtime': { jsx, jsxs: jsx },
        'react-native': native,
        'react-native-safe-area-context': { SafeAreaView: 'SafeAreaView' },
        '@expo/vector-icons': { Feather: 'Feather', FontAwesome: 'FontAwesome' },
        '@react-native-async-storage/async-storage': { __esModule: true, default: { getItem: async key => key === 'vendorToken' ? token : JSON.stringify({ id: 77 }) } },
        '@react-native-community/datetimepicker': { __esModule: true, default: 'DateTimePicker', DateTimePickerAndroid: {} },
        'expo-router': { useRouter: () => ({ replace: value => navigations.push(value), back() {} }) },
        'expo-image-picker': { MediaTypeOptions: { Images: 'images' } },
        'expo-location': { requestForegroundPermissionsAsync: async () => { locationRequests++; return { status: 'denied' }; } },
        '@/utils/couponPricing': priceModule.exports,
        '@/constants/theme': themeModule.exports,
    };
    const context = {
        exports: {}, AbortController, FormData,
        console: { log() {}, warn() {}, error() {} },
        require: name => {
            assert.ok(name in mocks, `Unmocked dependency: ${name}`);
            return mocks[name];
        },
        fetch: async (url, options = {}) => {
            requests.push({ url, options });
            if (url.endsWith('/categories')) return response(true, { status: 'success', data: [{ id: 3, category_name: 'Food' }] });
            if (!options.method) return failLoad
                ? response(false, { status: 'error', message: 'Coupon not found' })
                : response(true, { status: 'success', data: coupon });
            if (failSave) return response(false, { status: 'error', message: 'Unable to save coupon' });
            const fields = Object.fromEntries(options.body.entries());
            if (ignorePrice) delete fields.price;
            return response(true, { status: 'success', data: { ...coupon, ...fields } });
        },
    };
    vm.runInNewContext(compile('src/components/coupon-form.tsx'), context);
    const render = () => {
        cursor = 0;
        tree = context.exports.default(editing ? { couponId: '42' } : {});
        while (effects.length) effects.shift()();
    };
    const nodes = () => {
        const all = [];
        const visit = node => {
            if (Array.isArray(node)) return node.forEach(visit);
            if (!node || typeof node !== 'object') return;
            all.push(node);
            visit(node.props?.children);
        };
        visit(tree);
        return all;
    };
    const find = predicate => {
        const node = nodes().find(predicate);
        assert.ok(node, 'Expected form control was rendered');
        return node;
    };
    const flush = async () => { await new Promise(setImmediate); render(); };
    render();
    return {
        requests, navigations, alerts, flush, render, find,
        get locationRequests() { return locationRequests; },
        get writes() { return requests.filter(r => r.options.method); },
        price: () => find(n => n.props?.accessibilityLabel === 'Coupon price in dollars'),
        save: () => find(n => n.props?.accessibilityLabel === (editing ? 'Save Changes' : 'Publish Coupon')),
        set failLoad(value) { failLoad = value; },
        set failSave(value) { failSave = value; },
        set ignorePrice(value) { ignorePrice = value; },
    };
}

(async () => {
    const edit = mount();
    await edit.flush();
    assert.equal(edit.price().props.value, '25.00');
    assert.equal(edit.locationRequests, 0, 'Editing must preserve the saved location');
    assert.equal(edit.find(n => n.type === 'Switch').props.value, false);
    edit.price().props.onChangeText('30.5');
    edit.render();
    const save = edit.save().props.onPress;
    await Promise.all([save(), save()]);
    assert.equal(edit.writes.length, 1, 'Prevent duplicate submissions');
    assert.equal(edit.writes[0].url.endsWith('/coupons/42'), true);
    assert.equal(edit.writes[0].options.method, 'PUT');
    assert.equal(edit.writes[0].options.headers.Authorization, 'Bearer test-token');
    assert.deepEqual(Object.fromEntries(edit.writes[0].options.body.entries()), { price: '30.50' }, 'Price-only edits preserve dates, owner, image, campaign and other fields');
    assert.deepEqual(edit.navigations, ['/listings']);

    const free = mount();
    await free.flush();
    free.price().props.onChangeText('0');
    free.render();
    await free.save().props.onPress();
    assert.equal(free.writes[0].options.body.get('price'), '0.00');

    const invalid = mount();
    await invalid.flush();
    invalid.price().props.onChangeText('-1');
    invalid.render();
    await invalid.save().props.onPress();
    assert.equal(invalid.writes.length, 0);

    const failed = mount();
    await failed.flush();
    failed.price().props.onChangeText('40');
    failed.render();
    failed.failSave = true;
    await failed.save().props.onPress();
    failed.render();
    assert.equal(failed.price().props.value, '40');
    assert.equal(failed.navigations.length, 0);
    assert.ok(failed.alerts.some(a => a[1] === 'Unable to save coupon'));
    failed.failSave = false;
    failed.ignorePrice = true;
    await failed.save().props.onPress();
    assert.equal(failed.navigations.length, 0, 'Ignored prices must not be reported as saved');

    const retry = mount({ loadFails: true });
    await retry.flush();
    retry.failLoad = false;
    retry.find(n => n.type === 'TouchableOpacity' && n.props.accessibilityRole === 'button').props.onPress();
    retry.render();
    await retry.flush();
    assert.equal(retry.price().props.value, '25.00');

    const create = mount({ editing: false });
    await create.flush();
    assert.equal(create.locationRequests, 1);
    create.find(n => n.type === 'TextInput' && n.props.placeholder?.startsWith('e.g. Summer')).props.onChangeText('New coupon');
    create.price().props.onChangeText('10');
    create.find(n => n.type === 'input' && n.props['aria-label'] === 'Valid From').props.onChange({ currentTarget: { value: '2026-09-01' } });
    create.find(n => n.type === 'input' && n.props['aria-label'] === 'Valid Until').props.onChange({ currentTarget: { value: '2026-10-01' } });
    create.render();
    await create.save().props.onPress();
    assert.equal(create.writes[0].options.method, 'POST');
    assert.equal(create.writes[0].options.body.get('price'), '10.00');
    assert.equal(create.writes[0].options.body.get('vendor_id'), '77');
    console.log('Coupon form checks passed: prefill, PUT price edit, preserved fields, zero/invalid prices, duplicate prevention, save failure, ignored price, load retry, and POST creation.');
})().catch(error => { console.error(error); process.exitCode = 1; });
