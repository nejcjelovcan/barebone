var oldBackboneSync = Backbone.sync;
/*
    Deprecated
    @see: REST api :P
*/
barebone.sync_db = function (method, model, options) {
    var finalParams = _({}).extend(_(barebone.config).result('queryParams')),
        isModel = Backbone.Model.prototype.isPrototypeOf(model),
        modelName = isModel ? model.modelName : (model.model && model.model.modelName); // if collection, take from model
    if (method == 'read') {
        barebone.sync_db.getClient(function (err, client, done) {
            if (err && _.isFunction(options.error)) {
                options.error(err);
            } else {
                
            }
        });
        model.queryParams.get('where')
    }

    if (model.queryParams) { _(finalParams).extend(model.queryParams.getForQuery()); }
    else if (isModel && model.collection && model.collection.queryParams) {
        _(finalParams).extend(model.queryParams.getForQuery(true));
    }
    _(finalParams).extend(options.queryParams || {});
    options.url = options.url || _(model).result('url') || ((barebone.config.urlRoot + modelName + '/') + (isModel && model.has('id') ? model.get('id') : ''));
    options.url += '?' + $.param(barebone.QueryParams.serialize(finalParams));

    console.log('BACKBONE.SYNC', method, model, options);
    return oldBackboneSync(method, model, options);
};

barebone.sync_db.getClient = function (callback) {
    if (barebone.config.dbClient) {
        return callback(null, barebone.config.dbClient, barebone.sync_db.done);
    } else {
        pg.connect(barebone.config.dbString, function (err, client, done) {
            if (barebone.sync_db.done) { barebone.sync_db.done(); }
            barebone.sync_db.done = function () { done(); barebone.sync_db.done = null; barebone.config.dbClient = null; };
            barebone.condig.dbClient = client;
            callback(err, client, barebone.sync_db.done);
        });
    }
};