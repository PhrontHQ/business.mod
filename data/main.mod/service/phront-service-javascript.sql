-- From https://rymc.io/blog/2016/a-deep-dive-into-plv8/

CREATE EXTENSION IF NOT EXISTS plv8;

-- V8 is synonymous with Node.js for many developers, and inevitably the question of importing modules comes up. There is no baked-in module system, but we can simulate one using some of the features of PL/v8. It's important to note that while this works, we're in a sandboxed environment - modules involving network calls or browser-related functionality won't work. We'll be simulating the CommonJS module.exports API though, so many modules should "just work" right off npm.
-- The first thing we'll need is a table to store our module source(s) in. We really only need two columns to start: the module name (module), and the source code (source). To sweeten the deal we'll add an autoload column (autoload) that we'll use to dictate whether a module should be transparently available at all times.

create table plv8_js_modules (
    module text unique primary key,
    autoload bool default true,
    source text
);


-- We'll need a function to handle wrapping the require() API, and ideally we'll want a cache for module loading so we're not pulling from a database table every time we require a module. The global plv8 object has a few things we'll make use of here - it brings important functionality like executing statements, subtransactions, logging and more to the table. We'll be eval()ing the source for each module, but we wrap it in a function to ensure nothing leaks into the global scope. Our autoloading of certain modules also takes place in this function, just to prime the module cache for later use.

create or replace function plv8_require()
returns void as $$
    moduleCache = {};

    load = function(key, source) {
        var module = {exports: {}};
        eval("(function(module, exports) {" + source + "; })")(module, module.exports);

        // store in cache
        moduleCache[key] = module.exports;
        return module.exports;
    };

    require = function(module) {
        if(moduleCache[module])
            return moduleCache[module];

        var rows = plv8.execute(
            "select source from plv8_js_modules where module = $1",
            [module]
        );

        if(rows.length === 0) {
            plv8.elog(NOTICE, 'Could not load module: ' + module);
            return null;
        }

        return load(module, rows[0].source);
    };

    // Grab modules worth auto-loading at context start and let them cache
    var query = 'select module, source from plv8_js_modules where autoload = true';
    plv8.execute(query).forEach(function(row) {
        load(row.module, row.source);
    });
$$ language plv8;


-- Now in terms of using this, we have that dangling context problem to consider - how do we make sure that require() is available to each PL/v8 function that needs it? Well, it just so happens that PL/v8 supports setting a specific function to run before any other functions run. We can use this hook to bootstrap our environment - while ordinarily you could set it in your config files, you don't have access to those on Compose. We can, however, SET this value every time we open a connection. As long as you do this prior to any function call (including CREATE FUNCTION itself) you'll have access to require().

-- PL/v8 supports a "start proc" variable that can act as a bootstrap
-- function. Note the lack of quotes!
SET plv8.start_proc = plv8_require;


-- Let's try it out by throwing together a module that implements the Fisher-Yates shuffle algorithm - we'll name the module "shuffle", to keep things simple, and go ahead and set it to autoload.

insert into plv8_js_modules (module, autoload, source) values ('shuffle', true, '
    module.exports = function(arr) {
        var length = arr.length,
            shuffled = Array(length);

        for(var i = 0, rand; i < length; i++) {
            rand = Math.floor(Math.random() * (i + 1));
            if(rand !== i)
                shuffled[i] = shuffled[rand];
            shuffled[rand] = arr[i];
        }

        return shuffled;
    };
');

-- Now we should be able to require() this! We can try it immediately - a simple table of people and a super readable random_person() function works well.

create or replace function random_person()
returns json as $$
    var shuffle = require('shuffle'),
        people = plv8.execute('select id, firstName from "Person"');

    return shuffle(people);
$$ language plv8;

select random_person();

-- Example Response:
-- [{
--     "id": 3,
--     "firstName": "Andrew"
-- }, {
--     "id": 1,
--     "firstName": "Ryan"
-- }, {
--     "id": 4,
--     "firstName": "Sam"
-- }, {
--     "id": 2,
--     "firstName": "Daniel"
-- }]
