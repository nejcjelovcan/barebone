// Yes, what we do here is already done, this is for clarity


var M, C, c, m;
var setup = function () {
        M = Backbone.Model.extend({ url: 'test' });
        C = Backbone.Collection.extend({ url: 'test' });
        c = new C([{id: 1}, {id: 2}, {id: 3}, {id: 4}]);
        m = c.first();
    };
var debugEvents = function (instance, text) {
    instance.on('all', function (event) {
        console.log(text, event, _(arguments).toArray().slice(1));
    });
};

Backbone.sync = function (method, model, options) {

    var methodMap = {
        'create': 'POST',
        'update': 'PUT',
        'patch':  'PATCH',
        'delete': 'DELETE',
        'read':   'GET'
      };

    var params = {type: methodMap[method], dataType: 'json'};
    if (!options.noxhr) { // testing
        var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
    } else {
        setTimeout(function () {
            options.success(options.response || {});
        }, 100);
    }
    model.trigger('request', model, xhr, options);
    return xhr;
};

module('Backbone', {setup: setup});

test('view auto cleanup', function () {
    expect(1);

    var v = new Backbone.View({model: m});
    v.listenTo(m, 'change', function () {
        ok(true);
    });

    m.set('a', 10);

    v.remove();
    m.set('a', 20);
});


module('Backbone.Events', { setup: setup });

test('change model events', function () {
    expect(6);

    // events should buble
    c.on('change:a', function (model, val, options) {
        equal(model, m);
        equal(val, 10);
    });
    m.on('change:a', function (model, val, options) {
        equal(model, m)
        equal(val, 10);
    });
    c.on('change', function (model, val, options) {
        equal(model, m);
    });
    m.on('change', function (model, val, options) {
        equal(model, m);
    });

    m.set('a', 10);
    /* Events will be triggered in this order:
    c!change:a  model, val, options
    m!change:a  model, val, options
    c!change    model, options
    m!change    model, options
    */
});

test('destroy model events', function () {
    expect(11);

    // debugEvents(c, 'COLLECTION');
    // debugEvents(m, 'MODEL');

    // destroy triggers three events on collection
    c.on('request', function (model, xhr, options) {
        equal(model, m);
    });
    m.on('request', function (model, xhr, options) {
        equal(model, m);
    });
    var cb = function (model, collection, options) {
        equal(model, m);
        equal(collection, c);
    };
    c.on('remove', cb);
    c.on('destroy', cb);
    m.on('remove', cb);
    m.on('destroy', cb);
    m.on('error', function (model, xhr, options) {
        equal(model, m);
        start();
    });

    m.destroy();
    stop();
    /* Events will be triggered in this order:
    c!request   model, xhr, options
    m!request   model, xhr, options
    c!remove    model, collection, options
    m!remove    model, collection, options
    c!destroy   model, collection, options
    m!destroy   model, collection, options
    m!error     model, xhr, options         WOULD BE m!sync IF REQUEST IS SUCCESSFUL

    WARNING!!!
    in this case, error and sync events do not bubble - since model is already removed from collection beforehand
    */
});


// only mimics default Backbone.sync (since we override it above)
test('sync collection events', function () {
    expect(5);

    // debugEvents(c, 'COLLECTION');
    // debugEvents(m, 'MODEL');

    c.on('request', function (collection, xhr, options) {
        equal(collection, c);
        ok(options.noxhr);
    });
    c.on('sync', function (collection, response, options) {
        equal(collection, c);
        ok(options.noxhr);
        equal(response, options.response);
        start();
    });

    c.fetch({noxhr: true, response: [{id: 1}, {id: 2}, {id: 3}, {id: 4}]});
    stop();
    /* Events will be triggered in this order:
    c!request   collection, xhr, options
    - here comes .update() and triggers add, remove and change events, if any
        !!!! NO MOAR RESET SINCE 1.0.0 -- c!reset     collection, options
    c!sync      collection, response, options

    IF REQUEST FAILS:
    c!request
    c!error
    */

});

test('sync model events', function () {
    //debugEvents(c, 'COLLECTION');
    //debugEvents(m, 'MODEL');
    expect(20);

    var cb_request = function (model, xhr, options) {
        equal(model, m);
        ok(options.noxhr);
    }
    c.on('request', cb_request);
    m.on('request', cb_request);

    var cb_change1 = function (model, val, options) {
        equal(model, m);
        equal(val, 'lalala');
        ok(options.noxhr);
    }
    c.on('change:test', cb_change1);
    m.on('change:test', cb_change1);

    var cb_change2 = function (model, options) {
        equal(model, m);
        ok(options.noxhr);
    }
    c.on('change', cb_change2);
    m.on('change', cb_change2);

    var cb_sync = function (model, response, options) {
        equal(model, m);
        ok(options.noxhr);
        equal(response, options.response);
    }
    c.on('sync', cb_sync);
    m.on('sync', function (model, response, options) { cb_sync(model, response, options); start(); });

    m.fetch({noxhr: true, response: {id: m.get('id'), test: 'lalala'}});
    stop();
    /* Events will be triggered in this order:
    c!request       model, xhr, options
    m!request       model, xhr, options
    c!change:test   model, val, options
    m!change:test   model, val, options
    c!change        model, options
    m!change        model, options
    c!sync          model, response, options
    m!sync          model, response, options

    IF REQUEST FAILS:
    c!request
    m!request
    c!error
    m!error
    */
});

module('Backbone.Collection', {setup: setup});

test('#set', function () {
    var m_last = c.last();
    expect(6);

    // debugEvents(c, 'COLLECTION');
    // debugEvents(m, 'MODEL');

    c.on('remove', function (model, collection, options) {
        equal(model, m_last);
        console.log('MODEL', model, m);
        equal(collection, c);
    });

    var cb_change = function (model, val, options) {
        equal(model, m);
        equal(val, 'lalala');
    }
    c.on('change:test', cb_change);
    m.on('change:test', cb_change);

    c.set([{id: 1, test: 'lalala'}, {id: 2}, {id: 3}]);
    /* Events will be triggered in this order:
    c!remove        model, collection, options  (removed model id=4)
    c!change:test   model, val, options
    m!change:test   model, val, options
    c!change        model, options
    m!change        model, options
    */
 
});

