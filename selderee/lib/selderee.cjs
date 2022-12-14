'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var parseley = require('parseley');

function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);
    if (e) {
        Object.keys(e).forEach(function (k) {
            if (k !== 'default') {
                var d = Object.getOwnPropertyDescriptor(e, k);
                Object.defineProperty(n, k, d.get ? d : {
                    enumerable: true,
                    get: function () {
                        return e[k];
                    }
                });
            }
        });
    }
    n['default'] = e;
    return Object.freeze(n);
}

var parseley__namespace = /*#__PURE__*/_interopNamespace(parseley);

var Ast = /*#__PURE__*/Object.freeze({
    __proto__: null
});

var Types = /*#__PURE__*/Object.freeze({
    __proto__: null
});

/**
 * A {@link BuilderFunction} implementation.
 *
 * Produces a string representation of the tree
 * for testing and debug purposes.
 *
 * Only accepts `string` as the associated value type.
 * Map your input collection before creating a {@link DecisionTree}
 * if you want to use it with a different type -
 * the decision on how to stringify the value is up to you.
 *
 * @param nodes - nodes from the root level of the decision tree.
 * @returns the string representation of the tree.
 */
const treeify = (nodes) => '▽\n' + treeifyArray(nodes, thinLines);
const thinLines = [['├─', '│ '], ['└─', '  ']];
const heavyLines = [['┠─', '┃ '], ['┖─', '  ']];
const doubleLines = [['╟─', '║ '], ['╙─', '  ']];
function treeifyArray(nodes, tpl = heavyLines) {
    return prefixItems(tpl, nodes.map(n => treeifyNode(n)));
}
function treeifyNode(node) {
    switch (node.type) {
        case 'terminal': {
            const vctr = node.valueContainer;
            return `◁ #${vctr.index} ${JSON.stringify(vctr.specificity)} ${vctr.value}`;
        }
        case 'tagName':
            return `◻ Tag name\n${treeifyArray(node.variants, doubleLines)}`;
        case 'attrValue':
            return `▣ Attr value: ${node.name}\n${treeifyArray(node.matchers, doubleLines)}`;
        case 'attrPresence':
            return `◨ Attr presence: ${node.name}\n${treeifyArray(node.cont)}`;
        case 'pushElement':
            return `◉ Push element: ${node.combinator}\n${treeifyArray(node.cont, thinLines)}`;
        case 'popElement':
            return `◌ Pop element\n${treeifyArray(node.cont, thinLines)}`;
        case 'variant':
            return `◇ = ${node.value}\n${treeifyArray(node.cont)}`;
        case 'matcher':
            return `◈ ${node.matcher} "${node.value}"${node.modifier || ''}\n${treeifyArray(node.cont)}`;
    }
}
function prefixItems(tpl, items) {
    return items
        .map((item, i, { length }) => prefixItem(tpl, item, i === length - 1))
        .join('\n');
}
function prefixItem(tpl, item, tail = true) {
    const tpl1 = tpl[tail ? 1 : 0];
    return tpl1[0] + item.split('\n').join('\n' + tpl1[1]);
}

var TreeifyBuilder = /*#__PURE__*/Object.freeze({
    __proto__: null,
    treeify: treeify
});

/**
 * CSS selectors decision tree.
 * Data structure that weaves similar selectors together
 * in order to minimize the number of checks required
 * to find the ones matching a given HTML element.
 *
 * Converted into a functioning implementation via plugins
 * tailored for specific DOM ASTs.
 *
 * @typeParam V - the type of values associated with selectors.
 */
class DecisionTree {
    /**
     * Create new DecisionTree object.
     *
     * @param input - an array containing all selectors
     * paired with associated values.
     *
     * @typeParam V - the type of values associated with selectors.
     */
    constructor(input) {
        this.branches = weave(toAstTerminalPairs(input));
    }
    /**
     * Turn this decision tree into a usable form.
     *
     * @typeParam R - return type defined by the builder function.
     *
     * @param builder - the builder function.
     *
     * @returns the decision tree in a form ready for use.
     */
    build(builder) {
        return builder(this.branches);
    }
}
function toAstTerminalPairs(array) {
    const len = array.length;
    const results = new Array(len);
    for (let i = 0; i < len; i++) {
        const [selectorString, val] = array[i];
        const ast = preprocess(parseley__namespace.parse1(selectorString));
        results[i] = {
            ast: ast,
            terminal: {
                type: 'terminal',
                valueContainer: { index: i, value: val, specificity: ast.specificity }
            }
        };
    }
    return results;
}
function preprocess(ast) {
    reduceSelectorVariants(ast);
    parseley__namespace.normalize(ast);
    return ast;
}
function reduceSelectorVariants(ast) {
    const newList = [];
    ast.list.forEach(sel => {
        switch (sel.type) {
            case 'class':
                newList.push({
                    matcher: '~=',
                    modifier: null,
                    name: 'class',
                    namespace: null,
                    specificity: sel.specificity,
                    type: 'attrValue',
                    value: sel.name,
                });
                break;
            case 'id':
                newList.push({
                    matcher: '=',
                    modifier: null,
                    name: 'id',
                    namespace: null,
                    specificity: sel.specificity,
                    type: 'attrValue',
                    value: sel.name,
                });
                break;
            case 'combinator':
                reduceSelectorVariants(sel.left);
                newList.push(sel);
                break;
            case 'universal':
                // skip it
                break;
            default:
                newList.push(sel);
                break;
        }
    });
    ast.list = newList;
}
function weave(items) {
    const branches = [];
    while (items.length) {
        const topKind = findTopKey(items, (sel) => true, getSelectorKind);
        const { matches, nonmatches, empty } = breakByKind(items, topKind);
        items = nonmatches;
        if (matches.length) {
            branches.push(branchOfKind(topKind, matches));
        }
        if (empty.length) {
            branches.push(...terminate(empty));
        }
    }
    return branches;
}
function terminate(items) {
    const results = [];
    for (const item of items) {
        const terminal = item.terminal;
        if (terminal.type === 'terminal') {
            results.push(terminal);
        }
        else { // popElement - lift contained terminals
            const { matches, rest } = partition(terminal.cont, (node) => node.type === 'terminal');
            matches.forEach((node) => results.push(node));
            if (rest.length) {
                terminal.cont = rest;
                results.push(terminal);
            }
        }
    }
    return results;
}
function breakByKind(items, selectedKind) {
    const matches = [];
    const nonmatches = [];
    const empty = [];
    for (const item of items) {
        const simpsels = item.ast.list;
        if (simpsels.length) {
            const isMatch = simpsels.some(node => getSelectorKind(node) === selectedKind);
            (isMatch ? matches : nonmatches).push(item);
        }
        else {
            empty.push(item);
        }
    }
    return { matches, nonmatches, empty };
}
function getSelectorKind(sel) {
    switch (sel.type) {
        case 'attrPresence':
            return `attrPresence ${sel.name}`;
        case 'attrValue':
            return `attrValue ${sel.name}`;
        case 'combinator':
            return `combinator ${sel.combinator}`;
        default:
            return sel.type;
    }
}
function branchOfKind(kind, items) {
    if (kind === 'tag') {
        return tagNameBranch(items);
    }
    if (kind.startsWith('attrValue ')) {
        return attrValueBranch(kind.substring(10), items);
    }
    if (kind.startsWith('attrPresence ')) {
        return attrPresenceBranch(kind.substring(13), items);
    }
    if (kind === 'combinator >') {
        return combinatorBranch('>', items);
    }
    if (kind === 'combinator +') {
        return combinatorBranch('+', items);
    }
    throw new Error(`Unsupported selector kind: ${kind}`);
}
function tagNameBranch(items) {
    const groups = spliceAndGroup(items, (x) => x.type === 'tag', (x) => x.name);
    const variants = Object.entries(groups).map(([name, group]) => ({
        type: 'variant',
        value: name,
        cont: weave(group.items)
    }));
    return {
        type: 'tagName',
        variants: variants
    };
}
function attrPresenceBranch(name, items) {
    for (const item of items) {
        spliceSimpleSelector(item, (x) => (x.type === 'attrPresence') && (x.name === name));
    }
    return {
        type: 'attrPresence',
        name: name,
        cont: weave(items)
    };
}
function attrValueBranch(name, items) {
    const groups = spliceAndGroup(items, (x) => (x.type === 'attrValue') && (x.name === name), (x) => `${x.matcher} ${x.modifier || ''} ${x.value}`);
    const matchers = [];
    for (const group of Object.values(groups)) {
        const sel = group.oneSimpleSelector;
        const predicate = getAttrPredicate(sel);
        const continuation = weave(group.items);
        matchers.push({
            type: 'matcher',
            matcher: sel.matcher,
            modifier: sel.modifier,
            value: sel.value,
            predicate: predicate,
            cont: continuation
        });
    }
    return {
        type: 'attrValue',
        name: name,
        matchers: matchers
    };
}
function getAttrPredicate(sel) {
    if (sel.modifier === 'i') {
        const expected = sel.value.toLowerCase();
        switch (sel.matcher) {
            case '=':
                return (actual) => expected === actual.toLowerCase();
            case '~=':
                return (actual) => actual.toLowerCase().split(/[ \t]+/).includes(expected);
            case '^=':
                return (actual) => actual.toLowerCase().startsWith(expected);
            case '$=':
                return (actual) => actual.toLowerCase().endsWith(expected);
            case '*=':
                return (actual) => actual.toLowerCase().includes(expected);
            case '|=':
                return (actual) => {
                    const lower = actual.toLowerCase();
                    return (expected === lower) || (lower.startsWith(expected) && lower[expected.length] === '-');
                };
        }
    }
    else {
        const expected = sel.value;
        switch (sel.matcher) {
            case '=':
                return (actual) => expected === actual;
            case '~=':
                return (actual) => actual.split(/[ \t]+/).includes(expected);
            case '^=':
                return (actual) => actual.startsWith(expected);
            case '$=':
                return (actual) => actual.endsWith(expected);
            case '*=':
                return (actual) => actual.includes(expected);
            case '|=':
                return (actual) => (expected === actual) || (actual.startsWith(expected) && actual[expected.length] === '-');
        }
    }
}
function combinatorBranch(combinator, items) {
    const groups = spliceAndGroup(items, (x) => (x.type === 'combinator') && (x.combinator === combinator), (x) => parseley__namespace.serialize(x.left));
    const leftItems = [];
    for (const group of Object.values(groups)) {
        const rightCont = weave(group.items);
        const leftAst = group.oneSimpleSelector.left;
        leftItems.push({
            ast: leftAst,
            terminal: { type: 'popElement', cont: rightCont }
        });
    }
    return {
        type: 'pushElement',
        combinator: combinator,
        cont: weave(leftItems)
    };
}
function spliceAndGroup(items, predicate, keyCallback) {
    const groups = {};
    while (items.length) {
        const bestKey = findTopKey(items, predicate, keyCallback);
        const bestKeyPredicate = (sel) => predicate(sel) && keyCallback(sel) === bestKey;
        const hasBestKeyPredicate = (item) => item.ast.list.some(bestKeyPredicate);
        const { matches, rest } = partition1(items, hasBestKeyPredicate);
        let oneSimpleSelector = null;
        for (const item of matches) {
            const splicedNode = spliceSimpleSelector(item, bestKeyPredicate);
            if (!oneSimpleSelector) {
                oneSimpleSelector = splicedNode;
            }
        }
        if (oneSimpleSelector == null) {
            throw new Error('No simple selector is found.');
        }
        groups[bestKey] = { oneSimpleSelector: oneSimpleSelector, items: matches };
        items = rest;
    }
    return groups;
}
function spliceSimpleSelector(item, predicate) {
    const simpsels = item.ast.list;
    const matches = new Array(simpsels.length);
    let firstIndex = -1;
    for (let i = simpsels.length; i-- > 0;) {
        if (predicate(simpsels[i])) {
            matches[i] = true;
            firstIndex = i;
        }
    }
    if (firstIndex == -1) {
        throw new Error(`Couldn't find the required simple selector.`);
    }
    const result = simpsels[firstIndex];
    item.ast.list = simpsels.filter((sel, i) => !matches[i]);
    return result;
}
function findTopKey(items, predicate, keyCallback) {
    const candidates = {};
    for (const item of items) {
        const candidates1 = {};
        for (const node of item.ast.list.filter(predicate)) {
            candidates1[keyCallback(node)] = true;
        }
        for (const key of Object.keys(candidates1)) {
            if (candidates[key]) {
                candidates[key]++;
            }
            else {
                candidates[key] = 1;
            }
        }
    }
    let topKind = '';
    let topCounter = 0;
    for (const entry of Object.entries(candidates)) {
        if (entry[1] > topCounter) {
            topKind = entry[0];
            topCounter = entry[1];
        }
    }
    return topKind;
}
function partition(src, predicate) {
    const matches = [];
    const rest = [];
    for (const x of src) {
        if (predicate(x)) {
            matches.push(x);
        }
        else {
            rest.push(x);
        }
    }
    return { matches, rest };
}
function partition1(src, predicate) {
    const matches = [];
    const rest = [];
    for (const x of src) {
        if (predicate(x)) {
            matches.push(x);
        }
        else {
            rest.push(x);
        }
    }
    return { matches, rest };
}

/**
 * Simple wrapper around the matcher function.
 * Recommended return type for builder plugins.
 *
 * @typeParam L - the type of HTML Element in the targeted DOM AST.
 * @typeParam V - the type of associated values.
 */
class Picker {
    /**
     * Create new Picker object.
     *
     * @typeParam L - the type of HTML Element in the targeted DOM AST.
     * @typeParam V - the type of associated values.
     *
     * @param f - the function that matches an element
     * and returns all associated values.
     */
    constructor(f) {
        this.f = f;
    }
    /**
     * Run the selectors decision tree against one HTML Element
     * and return all matched associated values
     * along with selector specificities.
     *
     * Client code then decides how to further process them
     * (sort, filter, etc).
     *
     * @param el - an HTML Element.
     *
     * @returns all associated values along with
     * selector specificities for all matched selectors.
     */
    pickAll(el) {
        return this.f(el);
    }
    /**
     * Run the selectors decision tree against one HTML Element
     * and choose the value from the most specific mached selector.
     *
     * @param el - an HTML Element.
     *
     * @param preferFirst - option to define which value to choose
     * when there are multiple matches with equal specificity.
     *
     * @returns the value from the most specific mached selector
     * or `null` if nothing matched.
     */
    pick1(el, preferFirst = false) {
        const results = this.f(el);
        const len = results.length;
        if (len === 0) {
            return null;
        }
        if (len === 1) {
            return results[0].value;
        }
        const comparator = (preferFirst)
            ? comparatorPreferFirst
            : comparatorPreferLast;
        let result = results[0];
        for (let i = 1; i < len; i++) {
            const next = results[i];
            if (comparator(result, next)) {
                result = next;
            }
        }
        return result.value;
    }
}
function comparatorPreferFirst(acc, next) {
    const diff = parseley.compareSpecificity(next.specificity, acc.specificity);
    return diff > 0 || (diff === 0 && next.index < acc.index);
}
function comparatorPreferLast(acc, next) {
    const diff = parseley.compareSpecificity(next.specificity, acc.specificity);
    return diff > 0 || (diff === 0 && next.index > acc.index);
}

exports.Ast = Ast;
exports.DecisionTree = DecisionTree;
exports.Picker = Picker;
exports.Treeify = TreeifyBuilder;
exports.Types = Types;
