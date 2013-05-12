var oldBackboneSync = Backbone.sync;
/*
    Custom barebone sync
    
    Takes url:
    1. takes url from options
    2. if falsy, takes from model/collection (property or method 'url')
    3. if falsy, takes from config.urlRoot, appends model.modelName and id if model has one
    
    Merges queryParams in this order:
    1. config.queryParams (property or method)
    2. model/collection.queryParams || model.collection.queryParams (calls .getForQuery(parent))
    3. options.queryParams

    Maps with barebone.QueryParams.serialize()
    (according to config.queryParamsMap)
    Appends params as querystring to url from first step

    Calls old Backbone.sync with updated options.url
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