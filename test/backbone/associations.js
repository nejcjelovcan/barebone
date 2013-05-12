/*
    Main backbone-associations features:
    - nested .get
        done with relatedAttribute.childAttribute notation, and relatedAttribute[i] notation for Many relations
        e.g. m.get('a.b') (m's a attribute must be specified as a relation)
        this will nest as far as Model instances go
        common hashes WILL NOT WORK

    - nested .set
        e.g. m.set('a.b', 10) (m's a attribute must be specified as a relation - relatedModel having AssociatedModel prototype !!!!)
        this will nest as far as AssociatedModel instances go @WARNING
        will not work for attribute of non-existing attribute
            e.g. m.set('a.b', 10) will not work if m.attributes.a is undefined
                (BUT this will work: m.set('a', {b: 10}) - creating a new instance)
        when setting a related attribute, function can be passed as value and will be invoked, using return as a new value
            e.g. m.set('a', function () { return {b: 10}; })

    - event bubbling
        changes of child attributes bubble to parent
            parent: { child: { a: 10 } }
            parent.set('child.a', 20)
                - parent!change:child.a     child, val, opts
                - child!change:a            child, val, opts
                - parent!change:child       child, opts
                - child!change              child, opts
            setting a new child object will only trigger parent events

        any event that is triggered on child will be triggered on parent (but with :attrName)
        (from backbone, any model event will be triggered on collection, exactly the same)
            parent: { child: { a: 10 } }
            parent.get('child').trigger('customevent')
                - parent!customevent:child
                - child!customevent

            parent: { children: [ {a: 10}, {b: 20} ] }
            parent.get('children[0]').trigger('customevent')
                - parent!customevent:children
                - children!customevent
                - child!customevent

*/

var Item = Backbone.AssociatedModel.extend({
    defaults: {name: 'Item', a: 10},
    relations: [
        { type: Backbone.One, relatedModel: Item, key: 'subitem'}
    ]
});
var Vanilla = Backbone.Model.extend({defaults: {a: 10, b: 'yuno'}});
var Project = Backbone.AssociatedModel.extend({
    relations: [
        { type: Backbone.One, relatedModel: Item, key: 'item' },
        { type: Backbone.Many, relatedModel: Item, key: 'items' },
        { type: Backbone.One, relatedModel: Item, key: 'foo' },
        { type: Backbone.One, relatedModel: Vanilla, key: 'vanilla' }
    ]
});
var item, prj, v;

var setup = function () {
    item = new Item({ test: { foo: 'bar' } });
    prj = new Project;
    v = new Vanilla;
};

module('Backbone.AssociatedModel', {setup: setup});

test('#get', function () {

    prj.set('item', item);
    prj.set('vanilla', v)

    // test for related AssociatedModel
    equal(prj.get('item.name'), 'Item')

    // test for related Model
    equal(prj.get('vanilla.a'), 10);

    // test fail for common hash
    throws(function () {
        item.get('test.foo');
    }, /Cannot read property 'foo' of undefined/);

});

test('#set', function () {

    // make instance when set with object value
    prj.set('item', {name: 'Meti'});
    equal(prj.get('item').get('a'), 10);
    equal(prj.get('item.name'), 'Meti');

    // do the same with vanilla Model relation
    prj.set('vanilla', {b: 'ohnoudidnt'});
    equal(prj.get('vanilla').get('a'), 10);
    equal(prj.get('vanilla.b'), 'ohnoudidnt');

    // do not set if no instance @WARNING (this is fixed in associated-model fork)
    /* prj = new Project;
    prj.set('item.name', 'Meti');
    equal(prj.get('item'), undefined); */
    prj = new Project;
    prj.set('item.name', 'Meti');
    equal(prj.get('item.name'), 'Meti');

    // IMPORTANT @WARNING

    // nested set on existing instance
    prj.set('item', {});
    prj.set('item.a', 20);
    equal(prj.get('item.a'), 20);

    // not working on vanilla model
    prj.set('vanilla', {});
    prj.set('vanilla.a', 20);
    equal(prj.get('vanilla.a'), 10);

    // related attribute works as _.result
    prj.set('item', function () { return {a: 200}; });
    equal(prj.get('item.a'), 200);
});

test('change model events', function () {

    expect(8);

    /*prj.once('change:item', function () {
        debugEvents(prj.get('item'), 'ITEM');
    });*/

    prj.on('change:item', function (model, val, options) {
        equal(model, prj);
        equal(val, prj.get('item'));
    });
    prj.set('item', {a: 100});
    /* Events will be triggered in this order:
    prj!change:item
    prj!change
    */
    prj.off('change:item');

    var cb_change1 = function (model, val, options) {
        equal(model, prj.get('item'));
        equal(val, 200);
    }
    prj.on('change:item.a', cb_change1);
    prj.get('item').on('change:a', cb_change1);

    var cb_change2 = function (model, options) {
        equal(model, prj.get('item'));
    }
    prj.on('change:item', cb_change2);
    prj.get('item').on('change', cb_change2);

    prj.set('item.a', 200);
    /* Events will be triggered in this order:
    prj!change:item.a   item, val, options
    item!change:a       item, val, options
    prj!change:item     item, options
    item!change         item, options
    */
});

test('collection change, add, remove events', function () {
    expect(11);
    //debugEvents(prj, 'PROJECT');

    prj.on('change:items', function (model, val, options) {
        equal(model, prj);
        equal(val, model.get('items'));
    });
    prj.on('change', function (model, options) {
        equal(model, prj);
    });
    prj.set('items', [{id: 2, a: 20}, {id: 3, a: 30}, {id: 4, a: 40}]);
    /* Events wil be triggered in this order:
    prj!change:items
    prj!change
    */

    //debugEvents(prj.get('items'), 'ITEMS');

    var cb_add = function (model, collection, options)  {
        equal(model.get('id'), 5);
        equal(collection, prj.get('items'));
    }
    prj.on('add:items', cb_add);
    prj.get('items').on('add', cb_add);
    prj.get('items').add({id: 5, a: 50});
    /* Events will be triggered in this order:
    prj!add:items   item, items, options
    items!add       item, items, options
    */

    var it = prj.get('items[0]');
    var cb_remove = function (model, collection, options) {
        equal(model, it);
        equal(collection, prj.get('items'));
    }
    prj.on('remove:items', cb_remove);
    it.on('remove', cb_remove);
    prj.get('items').remove(it);
    /* Events will be triggered in this order
    prj!remove:items    item, items, options
    items!remove        item, items, options
    */
});

test('collection other events', function () {
    expect(6);

    prj.set('items', [{id: 2, a: 20}, {id: 3, a: 30}, {id: 4, a: 40}]);
    console.log('PRJ', prj.get('items'));

    // prj.set('items', []) WILL NOT DO THE SAME (it will call reset) @TODO update associations library??
    prj.get('items').set([{id: 2, a: 30}, {id: 3, a: 30}, {id: 5, a: 50}]);
    
    /* Events will be triggered in this order
    prj!remove:items        item, collection, options
    items!remove            item, collection, options
    prj!change:items[0].a   item, val, options
    items!change:a          item, val, options
    prj!change:items[0]     item, options
    items!change            item, options
    prj!add:items           item, collection, options
    items!add               item, collection, options
    */

    //debugEvents(prj, 'PROJECT');
    //debugEvents(prj.get('item'), 'ITEM');
    //debugEvents(prj.get('items[0]'), 'ITEM');

    var cb_customevent = function (a, b) {
        equal(a, 10);
        equal(b, 20);
    }
    prj.on('customevent:items', cb_customevent);
    prj.get('items').on('customevent', cb_customevent);
    prj.get('items[0]').on('customevent', cb_customevent);

    prj.get('items[0]').trigger('customevent', 10, 20);
    /* Events will be triggered in this order
    prj!customevent:items   10, 20
    items!customevent       10, 20
    item!customevent        10, 20
    */

});