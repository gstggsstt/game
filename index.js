var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res){
	res.sendFile(__dirname + '/html/game.html');
});

app.get('/playalone', function(req, res){
	res.sendFile(__dirname + '/html/game2.html');
});

app.get('/html/a.js', function(req, res){
	res.sendFile(__dirname + '/html/a.js');
});

app.get('/create', function(req, res){
	res.sendFile(__dirname + '/html/index.html');
});

var temp={};
var idmap={};
var nmap={};

io.on('connection', function(socket){
	console.log(socket.id+" connected");
	socket.on('disconnect', function() {
		console.log(socket.id+" disconnected");
		var name=idmap[socket.id];
		if(name==undefined) return ;
		io.to(temp[name].x).emit('escape');
		io.to(temp[name].o).emit('escape');
		idmap[temp[name].x]=undefined;
		idmap[temp[name].o]=undefined;
		temp[name]=undefined;
		nmap[name]=undefined;
	});
	socket.on('join', function(name, N){
		console.log("get"+name);
		console.log("id:"+socket.id);
		if(temp[name]==undefined) {
			temp[name]={x:socket.id};
			idmap[socket.id]=name;
			io.to(socket.id).emit('x');
			nmap[name]=N;
		}
		else if(temp[name].o==undefined) {
			if(N!=nmap[name])
				socket.emit('size error');
			temp[name].o=socket.id;
			idmap[socket.id]=name;
			io.to(socket.id).emit('o');
			io.to(temp[name].x).emit('ready');
			io.to(temp[name].o).emit('ready');
		}
		else io.to(socket.id).emit('used');
	});
	socket.on('click', function(id){
		var name=idmap[socket.id];
		if(socket.id==temp[name].x)
			io.to(temp[name].o).emit('click',id);
		else
			io.to(temp[name].x).emit('click',id);
	});
});

http.listen(2333, function(){
	console.log('listening on *:2333');
});

