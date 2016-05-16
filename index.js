"use strict";
var storage = require('node-persist');
var bcrypt = require('bcryptjs');
var cookieParser = require('cookie-parser');
var uuid = require('node-uuid');
var readlineSync = require('readline-sync');
var fs = require('fs');
var express = require('express');


var app = express();

var bodyParser = require('body-parser');
var path = require('path');

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(cookieParser());

storage.initSync();


//User stuff
var users = storage.getItem('users');
var port = storage.getItem('port');
var rootDir = storage.getItem('rootDir');
var test = storage.getItem('jemoeder');

if(port == undefined){
	 firstRun();	
}

function firstRun(){
	console.log("FlunkED is run for the first time. Some variables need to be set before FlunkED can start.");
  	var user = readlineSync.question('Username : ');
  	var pass1 = "a";
  	var pass2 = "b";
  	var i = 0;
  	while(pass1 != pass2){
      	if(i > 0){
         	console.log("Passwords did not match :("); 
        }
      	
      	pass1 = readlineSync.question('Password : ', {
    		hideEchoBack: true // The typed text on screen is hidden by `*` (default). 
 		});
      	pass2 = readlineSync.question('Confirm password : ', {
    		hideEchoBack: true // The typed text on screen is hidden by `*` (default). 
 		});
      	i++;
    }
  	addUser(user, pass1);
      
   	port = readlineSync.question('HTTP Port to use : ');
    storage.setItem('port',port);
	rootDir = readlineSync.question('Root directory : ');
    storage.setItem('rootDir',rootDir);
}

function addUser(name, pass){
	var user = {}; 
  	user.name = name;
	user.hash = bcrypt.hashSync(pass, bcrypt.genSaltSync(10));
	
  	if(users == undefined){
     	 users = [];
    }
  	users.push(user);
  	storage.setItem('users',users);
  	console.log("User " + name + " added.");
	return user;
}

function checkPass(user, pass){
	return bcrypt.compareSync(pass, user.hash);  
}

function getUser(name){
  	var found = null;
  	var i = 0;
  
  	while (i < users.length){
      	if(name == users[i].name){
          	return users[i]; 
        }
      	i++; 
    }
  	return found;
}

var server = app.listen(port);
console.log("Started on port "+ port);
var io = require('socket.io')(server);


//Session stuff
var sessions = {};

function newSession(user){
	var session = {};
  	session.uuid = uuid.v4();
  	session.csrfToken = uuid.v4();
  	session.user = user;
  	session.loggedIn = true;
  	sessions[session.uuid] = session;
  	return session;
}

var checkSession = function(req,  res, checkCsrf, callback){
  	if(sessions[req.cookies.sessionId] != null){
      	if(sessions[req.cookies.sessionId].loggedIn){
        	if(checkCsrf){
              	if(req.get("X-Csrf-Token") == sessions[req.cookies.sessionId].csrfToken){
                  	callback(sessions[req.cookies.sessionId]);
                } else {
                  	res.statusCode = 401;
                	res.send("Incorrect CSRF Token");
                }
            } else { 
              	callback(sessions[req.cookies.sessionId]);
            }
          	
        } else {
          	res.statusCode = 401;
    		res.send("Session logged oud");
        } 
    } else {
      	res.statusCode = 401;
    	res.send("Session unknown");
    }	 
}


 
//API routes
app.get('/api/dir', function (req, res) {
    checkSession(req, res, true, function(session){
      	console.log("Getdir " + rootDir + req.query.cd);
      	//TODO: Fix directory traversal
      	res.send(getFiles(rootDir + req.query.cd));
    });
});

app.get('/api/file/:name', function (req, res) {
    checkSession(req,res, true,function(session){
    	console.log("Getfile " + rootDir + req.query.cd + req.params.name);
      	//TODO: Fix directory traversal
      	res.sendFile(rootDir + req.query.cd + req.params.name)
    });
});

app.post('/api/save/:name', function(req, res){    
	checkSession(req, res, true, function(session){
      	console.log("Saving " + rootDir + req.query.cd + req.params.name);
      	//TODO: Fix directory traversal
        fs.writeFile(rootDir + req.query.cd + req.params.name, req.body.data, function (err,data) {
            if (err) {
              	res.statusCode = 400;
                res.send("Error saving");
            } else {
              	io.sockets.emit('refresh', 'now');
                res.send(true);
            }
        });
	});
});

app.post('/api/newFile/:name', function(req, res){    
	checkSession(req, res, true, function(session){
      	console.log("Creating New File " + rootDir + req.query.cd + req.params.name);
        fs.lstat(rootDir + req.query.cd + req.params.name, function(err, stats) {
    		if (err) { //TODO: Fix directory traversal
                fs.writeFile(rootDir + req.query.cd + req.params.name, req.body.data, function (err,data) {
                    if (err) {
                      	res.statusCode = 418;
                        res.send("Error creating file");
                    } else {
                        res.send(true);
                    }
                });
    		} else {
              	 res.statusCode = 409;
             	 res.send("File exists!");
            }
		});

	});
});

app.post('/api/newDir', function(req, res){    
	checkSession(req, res, true, function(session){
      	console.log("Creating New Directory " + rootDir + req.query.cd);
        fs.lstat(rootDir + req.query.cd, function(err, stats) {
    		if (err) {
                 fs.mkdirSync(rootDir + req.query.cd); //TODO: Fix directory traversal
              	 res.send(true);
    		} else {
              	 res.statusCode = 409;
             	 res.send("Directory exists!");
            }
		});

	});
});


app.post('/api/delete', function(req, res){    
	checkSession(req, res, true, function(session){
      	console.log("Deleting " + rootDir + req.query.cd);
        fs.lstat(rootDir + req.query.cd, function(err, stats) {
    		if (!err) {
              	 if(stats.isDirectory()){
                 	 deleteFolderRecursive(rootDir + req.query.cd);
                   	 res.send(true);
                 } else {
                     fs.unlinkSync(rootDir + req.query.cd); //TODO: Fix directory traversal
                     res.send(true);
                 }
    		} else {
              	 res.statusCode = 404;
             	 res.send("File doesn't exist!");
            }
		});
	});
});



app.post('/api/reauth', function(req, res){    
	checkSession(req, res, false, function(session){
		res.send({csrfToken:session.csrfToken});
	});
});

app.post('/api/login', function(req, res){
  	var username = req.body.data.user;
  	var password = req.body.data.pass;
  	var user = getUser(username);
 	if(user != null){
      		//TODO Fix bruteforce password vuln
       		if(checkPass(user, password)){
        		var session = newSession(user);
              		res.cookie("sessionId", session.uuid, { httpOnly: true });
              		console.log("Login " + username + " OK");
           			res.send({csrfToken:session.csrfToken});
        	} else {
              	console.log("Login " + username + " FAILED!");
				res.statusCode = 401;
              	res.send("Login failed");
       		}
	     	
    	} else {
          	console.log("Login " + username + " UNKNOWN!");
          	res.statusCode = 401;
      		res.send("Login failed");
    	}
});

var getFiles = function(dir, files_){
    files_ = [];
    var files = fs.readdirSync(dir); //TODO: Fix directory traversal
    for (var i in files){
        var file = {name:files[i]};
        var name = dir + '/' + files[i];

        file.isDir = fs.statSync(name).isDirectory();
      
        files_.push(file);
    }
    return files_;
}

var deleteFolderRecursive = function(path) {
  if( fs.existsSync(path) ) {
    fs.readdirSync(path).forEach(function(file,index){
      var curPath = path + "/" + file;
      if(fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath); //TODO: Fix directory traversal
      }
    });
    fs.rmdirSync(path);
  }
};

// Websocket stuffs
io.on('connection', function(socket) {
    console.log("Client connected!");
  
    socket.on('disconnect', function() {
      	console.log('Client disconnect!');
	});
});
