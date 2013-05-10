
module('core');
test('console.log', function () {
    equal(typeof console.log, 'function');
});
test('Object.create', function () {
    var p = {a: 1}, o = Object.create(p);
    equal(o.a, 1);
    p.a = 2;
    equal(o.a, 2);
});