
// util for tests with controlled config
function withConfig(config, func) {
    return function () {
        var old = {};
        for (var name in config) {
            old[name] = barebone.config[name];
            barebone.config[name] = config[name];
        }
        func();
        for (var name in config) {
            barebone.config[name] = old[name];
        }
    };
}

module('barebone.QueryParams');
var qp;

test('#initialize', function () {
    expect(1);
    var p = {fetch: function () { ok(true); }};
    qp = new barebone.QueryParams({serializer:'minimal'}, {parent: p});
    qp.set('serializer', 'default');
});

test('#getForQuery', function () {
    qp = new barebone.QueryParams({count:100, pageSize:10});
    deepEqual(qp.getForQuery(), {pageSize:10});
    deepEqual(qp.getForQuery(true), {});
});

test('#getPages', function () {
    qp = new barebone.QueryParams({pageSize: 11, count: 100, page: 1});
    equal(qp.getPages(), 10);
});

module('barebone.TQueried');
var CQ = Backbone.Collection.extend(barebone.TQueried),
    c;

test('#setQueryParams', function () {
    expect(2);
    c = new CQ([]);
    c.initQueryParams({queryParams: {a: 1}});
    c.fetch = function (options) { ok(true); };
    equal(c.queryParams.get('a'), 1);
    c.setQueryParams('a', 2);
    c.setQueryParams({a: 3}, {silent:true});
    c.setQueryParams('count', 10);
});

test('#parse', function () {
    c = new CQ([]);
    c.parse({results: [{id: 1}, {id: 2}], count: 10});
    equal(c.queryParams.get('count'), 10);
});

module('barebone.MSchemed');

var types = {'integer': {setter: function (val) { return parseInt(val, 10); }, getter: function (val) { return '0'+val; }}},
    MS;
withConfig({types: types}, function () {
    MS = barebone.Model.extend({schema: {a: {type: 'integer'}}});
})();
test('barebone.expandSchema', withConfig({types: types}, function () {
    var expanded = barebone.expandSchema({a: {type: 'integer'}});
    equal(expanded.a.getter, types.integer.getter);
    equal(expanded.a.setter, types.integer.setter);
}));

test('#get', function () {
    m = new MS({a: 10});
    equal(m.get('a'), '010');
});

test('#set', function () {
    m = new MS({a: 10});
    m.set('a', '020');
    equal(m.attributes.a, 20);
});

module('barebone.Model');

test('#construct', function () {
    var instance = new barebone.Model;
    ok(Backbone.AssociatedModel ? Backbone.AssociatedModel.prototype.isPrototypeOf(instance)
            : true, 'Is prototype of AssociatedModel (if loaded)');
});

test('#onceSet', function () {
    expect(6);
    var instance = new barebone.Model;
    instance.onceSet('a', function (inst, val) {
        equal(inst, instance);
        equal(val, 10);
    });
    instance.set('a', 10);
    instance.set('a', 20);

    var Item = barebone.Model.extend({});
    var Model = barebone.Model.extend({
        defaults: {a: 10},
        relations: [ {type: Backbone.One, key: 'item', relatedModel: Model} ]
    });
    var m = new Model();

    // test already set
    m.onceSet('a', function (inst, val) {
        equal(inst, m);
        equal(val, 10);
    });

    // test with relations
    m.onceSet('item', function (inst, val) {
        equal(inst, m);
        equal(val, m.get('item'));
    });
    m.set('item', {b: 20});
});

/*
module('barebone.api.Model');

test('.extend, #url', function () {
    var Model;
    throws(function () {
        console.log('WILL THROW');
        Model = barebone.api.Model.extend();
    }, /No url property specified when extending api.Model/,
    'Should throw error if extended without modelName or url property');

    var meta = {fields: {b: 'B'}};
    Model = barebone.api.Model.extend({modelName: 'model', meta: meta});
    equal(Model.meta, meta, 'Auto assign meta property to constructor (instead of prototype)');
    notEqual(Model.prototype.meta, meta, 'Prototype should not have meta property assigned');

    var instance = new Model({a: 1, id: 2}, {serializer: 'testserializer'});
    equal(instance.url(), '/site/api/model/2?serializer=testserializer', 'Url returns as expected');
});

test('.setMeta, .getFieldMeta', function () {
    var Model = barebone.api.Model.extend({modelName: 'Model'});
    Model.setMeta({fields: {a: 'A'}});
    equal(Model.getFieldMeta('a', 'display'), 'A', 'Get field display from meta');
});

test('#initialize', function () {
    var instance = new barebone.api.Model({}, { serializer: 'testserializer' });
    equal(instance.serializer, 'testserializer', 'Picks options')
});

test('#getQueryParameters', function () {
    var instance = new barebone.api.Model({}, { serializer: 'testserializer' });
    deepEqual(instance.getQueryParameters({a: 1}), {serializer: 'testserializer', a: 1}, 'Query parameters match');
});

module('barebone.Collection');

module('barebone.api.Collection');

test('.extend, #url', function () {
    var Collection, Model;
    throws(function () {
        Collection = barebone.api.Collection.extend();
    }, /No url property specified when extending api.Collection/,
    'Should throw error if extended without model, modelName or url property');

    Model = barebone.api.Model.extend({modelName: 'model'});
    Collection = barebone.api.Collection.extend({model: Model});
    var instance = new Collection([], {paginate: true, ordering: '-id'});
    instance.setFilter('a', 1);
    equal(instance.url(), '/site/api/model/?page_size=50&page=1&a=1&ordering=-id', 'Url returns as expected');
});

test('#initialize', function () {
    var options = { serializer: 'testserializer', ordering: 'order', paginate: true };
    var instance = new barebone.api.Collection([], options);
    deepEqual(_(instance).pick('serializer', 'ordering', 'paginate'), options, 'Picks options');
    ok(barebone.api.Pagination.prototype.isPrototypeOf(instance.pagination), 'Pagination instantiated');
});

test('#getQueryParameters', function () {
    var options = { serializer: 'testserializer', ordering: 'order', paginate: true, filters: {b: 2} };
    var instance = new barebone.api.Collection([], options);
    instance.pagination.set({page: 10, pageSize: 50});
    deepEqual(instance.getQueryParameters({a: 1}), {a: 1, page_size: 50, page: 10, ordering: 'order', serializer: 'testserializer', b: 2},
        'Query parameters match');
});

test('#setFilter, :filtered', function () {
    var instance = new barebone.api.Collection([], {});
    instance.setFilter('a', 1);
    deepEqual(instance.filters, {a: 1}, 'Filter set');

    var a = 0;
    instance.on('filtered', function (filterName, filterVal) {
        a+=1;
        var r = {}; r[filterName] = filterVal;
        deepEqual(r, {a: 2}, 'Event "filtered" fired');
    });
    instance.setFilter('a', 2);
    instance.setFilter('a', 2);
    equal(a, 1, 'Event "filtered" not fired since same value was set')

});

test('#setOrdering, :ordered', function () {
    var instance = new barebone.api.Collection([], {});
    instance.setOrdering('-id,-time');
    deepEqual(instance.ordering, '-id,-time', 'Ordering set');

    var a = 0;
    instance.on('ordered', function (order) {
        a+=1;
        deepEqual(order, '-id,time', 'Event "ordered" fired');
    });
    instance.setOrdering('-id,time');
    instance.setOrdering('-id,time');
    equal(a, 1, 'Event "ordered" not fired since same value was set');
});

asyncTest('#_on_pagination_changed, :paginated', function () {
    var instance = new barebone.api.Collection([], {paginate: true});
    
    var a = 0;
    instance.on('paginated', function (page, pageSize) {
        a += 1;
        deepEqual({page: page, pageSize: pageSize}, {page: 2, pageSize: 20}, 'Event "paginated" fired');
        start();
    });
    instance.pagination.set({page: 2, pageSize: 20}); // this is where pagination goes defer!
});

test('#parse', function () {
    // @TODO change barebone.api.config
    var instance = new barebone.api.Collection([], {paginate: true});

    instance.pagination.set('pageSize', 10);
    var data = instance.parse({results: [{a: 1}], count: 50, next: 'next.link', previous: 'prev.link'});
    deepEqual(data, [{a: 1}], 'Data parsed from response');

    deepEqual(_(instance.pagination.attributes).pick('count', 'next', 'previous'), {count: 50, next: 'next.link', previous: 'prev.link'}, 'Pagination parsed from response');
});
*/