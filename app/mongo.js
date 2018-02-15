const conf = require('../config');
var md5 = require('md5');
var mongoose = require('mongoose');


var conn;

function initMongo(){
	
    mongoose.set('debug', conf.database.mongooseDebug);
	mongoose.Promise = global.Promise;
    
	logMsg("ptp:mongo:():initMongo:OK:(mongo initialized)");
}

function openConnection(callback){
   /*var conn = mongoose.createConnection(conf.database.name, function(err) {
        if (err) { 
            console.log(`(${conf.database.name}) : ${err}`)
            callback(null,err);
            //throw `Impossible de se connecter à la base ${conf.dev.database} : ${err}`; 
        }else{
            console.log('vvvvvvvvvvvv - connection opened - vvvvvvvvvvvv');
            callback(conn,null);
        }
    });  */ 
    if(!conn){
		var options = { server: { socketOptions: { keepAlive: 300000, connectTimeoutMS: 30000 } }, 
                replset: { socketOptions: { keepAlive: 300000, connectTimeoutMS : 30000 } } };       
        var address = getAddress();
        conn = mongoose.createConnection(address, options, function(err) {
           if(!err){
               callback(null);
			   logMsg("ptp:mongo:():openConnection:OK:(mongo connected to "+address+" )");
           }else{
			   callback(err);
			   logMsg("ptp:mongo:():openConnection:ERR:(mongo is unable to connect to "+address+" )");
			   return;
		   }
        })
		
    } else{
        callback(null);
    }
}

function closeConnection(conn){
   // conn.close();
   // console.log('^^^^^^^^^^^^ - connection closed - ^^^^^^^^^^^^');
    // TODO quesque c'est les histoires
}

function logMsg(msg){
	if(conf.database.verbose){
		console.log(msg);
	}
}

function getAddress(){

    var address= process.env.DB_PREFIX || conf.database.defaultAddress.prefix;
    address+='://';
    if(process.env.DB_USER && process.env.DB_PASSWORD){
     address+=process.env.DB_USER+':'+md5(process.env.DB_PASSWORD+conf.database.salt)+'@';
    }
    address += process.env.DB_NAME || conf.database.defaultAddress.name;
    address+='/';
    address += process.env.DB_DATABASE || conf.database.defaultAddress.database;
    // console.log(address);
    return address;
}

/*********
function are always :
function X(schema, callback, ...., .... )
callback are always : (err,result)
**********/


function addObject(schema, callback, object){   
    openConnection(function(coErr){
        if(conn){
            var model = conn.model(schema.collection,schema.schema);
            var objectFromModel = new model(object);
            objectFromModel.save(function (err) {
                if (err) { 
                    callback(err, null);
                    closeConnection();
					return;
                }else{
                    logMsg("ptp:mongo:():addObject:OK:(Object added to "+schema.collection+")");
                    callback(null, 'Insert ok');
                    closeConnection();
					return;
                }
            });      
        }else{
            callback(coErr, null);
        }
    })
}


function findObject(schema, callback, jsonRequest){
    openConnection(function(coErr){
        if(conn){
            var model = conn.model(schema.collection,schema.schema);
            model.find(jsonRequest, function (err, result) {
                if(err) { 
                    closeConnection();
                    callback(err, null);
					return;
                }
                logMsg("ptp:mongo:():findObject:OK:("+result.length+" object found in "+schema.collection+")");
                closeConnection();
                callback(null, result);
				return;
            });
        }else{
            callback(coErr, null);
        }
    })
}

function findObjectWithOptions(schema,callback, jsonRequest, limit, sort, offset){
    openConnection(function(coErr){
        if(conn){
			if(!offset || offset < 0) offset = 0;
            var model = conn.model(schema.collection,schema.schema);
            model.find(jsonRequest, function (err, result) {
                if(err) { 
                    closeConnection();
                    callback(err, null);
					return;
                }
                logMsg("ptp:mongo:():findObjectWithOptions:OK:("+result.length+" object found in "+schema.collection+")");
                closeConnection();
                callback(null, result);
				return;
            })
            .limit(limit)
            .sort(sort)
			.skip(offset)
			;
        }else{
            callback(coErr, null);
        }
    })
}

function findOne(schema, callback, jsonRequest){
    openConnection(function(coErr){
        if(conn){
            var model = conn.model(schema.collection,schema.schema);
            model.findOne(jsonRequest, function (err, result) {
                if(err) { 
                    closeConnection();
                    callback(err, null);
					return;
                }
                logMsg("ptp:mongo:():findOne:OK:(object found in "+schema.collection+")");
                closeConnection()
                callback(null, result);
				return;
            });
        }else{
            callback(coErr, null);
        }
    })
}

function findById(schema, callback, id){
    openConnection(function(coErr){
        if(conn){
            var model = conn.model(schema.collection,schema.schema);
			
			model.findById(id, function (err, result) {
				if(err) { 
					closeConnection();
					callback(err, null);
					return;
				}
				logMsg("ptp:mongo:():findById:OK:(object found in "+schema.collection+" with id "+id+")");
				closeConnection()
				callback(null, result);
				return;
			});
			
        }else{
            callback(coErr, null);
        }
    })
}


function removeById(schema, callback, id){
    openConnection(function(coErr){
        if(conn){
            var model = conn.model(schema.collection,schema.schema);
            model.findById(id).remove(function(err,result){
                if(err) { 
                    closeConnection();
                    callback(err, null);
					return;
                }
                logMsg("ptp:mongo:():removeById:OK:("+result.length+" objects removed with id "+id+")");
                closeConnection()
                callback(null, result);
				return;
            });
        }else{
            callback(coErr, null);
        }
    })
}

function updateObject(schema,callback, condition, update, option){
    openConnection(function(coErr){
        if(conn){
            var model = conn.model(schema.collection,schema.schema);
            model.update(condition, update, option, function(err){
                if (err) {
                    closeConnection();
                    callback(err, null);
					return;
                }
                logMsg(`ptp:mongo:():updateObject:OK:(update ok : ${JSON.stringify(condition)} --> ${JSON.stringify(update)})`);
                closeConnection();
                callback(null, 'update ok');
				return;
            });
        }else{
            callback(coErr, null);
        }
    })
}


function removeObject(schema, callback, condition){
    openConnection(function(coErr){
        if(conn){
            var model = conn.model(schema.collection,schema.schema);
            model.remove(condition, function (err) {
                if (err) {
                    closeConnection();
                    callback(err, null);
					return;
                }
                logMsg(`ptp:mongo:():updateObject:OK:(remove ok (${JSON.stringify(condition)}))`);
                closeConnection();
                callback(err, 'remove ok');
				return;
            });
        }else{
            callback(coErr, nulll);
        }
    })
}


function count(schema,callback, condition){
    openConnection(function(coErr){
        if(conn){
            var model = conn.model(schema.collection,schema.schema);
            model.count(condition , function(err, count){
                if(!err && count){
                    closeConnection();
                    callback(null, count);
                    logMsg(`ptp:mongo:():updateObject:OK:( ${count} object have ${JSON.stringify(condition)})`);
					return;
                }else {
                    closeConnection();
                    callback(err, null);
					return;
                }
            });
        }else{
            callback(coErr, null);
        }
    })
}

// onDoc(doc)
// onEnd()
function streamFind(schema, onDoc, onEnd, condition) {
    openConnection(function(coErr){
        if(conn){
            var model = conn.model(schema.collection,schema.schema);
            let cursor = model.find(condition).cursor();
            
            cursor.eachAsync(doc => onDoc(doc)).
            then(() => onEnd());
            
            
        } else {
            onEnd(null);
        }
    });
}



/**
methode de test. envoi de maniere recursive des données dans la DB

mongoOperation : 1 seule opération
schema : 1 seul schema
dataArray plusieurs object dans le dataArray
current : par ou commence l'array
onDone(stats) : action executée à la fin
(optionnel) onTick(done, requested) : function
(optionnel) stats : statistiques de l'operation
*/
function processFunction(mongoOperation, schema, dataArray, current, onDone, onTick, stats){
    if(!stats) {
        stats = {
            error:0,
            success:0,
            requested:dataArray.length,
            collection:schema.collection,
        };    
    }
    if(current >= dataArray.length || current < 0){
        onDone(stats);
        return ;
    }
    // console.log('operation '+(current+1)+'/'+dataArray.length+':')
    mongoOperation(schema, function(err, result){
        if(err){
            // console.log('error on '+(current+1)+' : '+err);
            stats.error++;
        }else{
            // console.log('operation '+(current+1)+' executed with success !');
            stats.success++;
        }
        if(onTick) {
            onTick(current+1,stats.requested);
        }
        processFunction(mongoOperation, schema, dataArray, current + 1, onDone, onTick, stats);
    } , dataArray[current]);
}


var ObjectId = mongoose.Schema.Types.ObjectId;

module.exports = {
	initMongo : initMongo,
    add: addObject,
    find: findObject,
    findOne: findOne,
    findById: findById,
    update: updateObject,
    remove: removeObject,
    removeById: removeById,
    count: count,
    findWithOptions : findObjectWithOptions,
    streamFind : streamFind,
    ObjectId : ObjectId,
    processFunction : processFunction
}


