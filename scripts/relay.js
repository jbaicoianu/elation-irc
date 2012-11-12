if (typeof require != 'undefined') {
  var elation = require("elation"),
      ws = require("ws"),
      net = require('net');
  require('irc/messages');
}

elation.extend("irc.relay", function() {
  this.users = {};
  this.pending = [];
  this.init = function() {
    this.sockserver = new ws.Server({host: "meobets.com", port: 8888});
    this.sockserver.on('connection', elation.bind(this, this.handleconnect));
  }

  this.handleconnect = function(sock) {
    console.log('connection');
    var client = new elation.irc.relay.client(this, sock);
    elation.events.add(client, "clientauth", elation.bind(this, this.clientauth));
    this.pending.push(client);
  }
  this.clientauth = function(ev) {
console.log('clientauth', ev.data);
    var client = ev.target;
    var auth = ev.data;
    var i = this.pending.indexOf(client);
    if (i != -1) {
      this.pending.splice(i, 1);
      if (!this.users[auth.user]) {
        this.users[auth.user] = new elation.irc.relay.user(auth);
      }
      this.users[auth.user].addclient(client);
    } else {
      console.log("tried to complete connection which wasn't in pending state!", client);
    }
  }
  this.init();
});

elation.extend("irc.relay.client", function(server, sock) {
  this.pending = true;
  this.server = server;
  this.sock = sock;
  this.auth = {};
  this.requirepassword = false;
  this.queue = [];
  
  this.init = function() {
    console.log('new relay client');
    if (this.sock) {
      this.sock.on("message", elation.bind(this, this.handlemessage));
      this.sock.on("close", elation.bind(this, this.handleclose));
    }
  } 
  this.send = function(msg) {
    if (this.sock) {
      console.log('client sock send: ' + msg.raw);
      this.sock.send(msg.raw);
    }
  }
  this.handlemessage = function(msgstr) {
    var msg = new elation.irc.message(this.server, msgstr.toString('utf8'));
    console.log('client message: ', msg.raw);
    switch (msg.command) {
      case 'heyo':
        //this.server.completeconnection(this, msg.args);
        this.pending = false;
        break;
      case 'user':
      case 'pass':
      case 'nick':
        this.auth[msg.command] = msg.args[0];
        break;
      default:
    }
    elation.events.fire({type: 'clientmessage', element: this, data: msg});
    if (this.auth !== true && this.auth['user'] && this.auth['nick'] && (!this.requirepassword || this.auth['pass'])) {
      elation.events.fire({type: "clientauth", element: this, data: this.auth});
      this.auth = true;
    }
  }
  this.handleclose = function() {
    elation.events.fire({type: 'clientclose', element: this});
  }
  this.init();
});
elation.extend("irc.relay.server", function(host, port, auth) {
  this.host = host;
  this.port = port;
  this.sock = false;

  this.init = function() {
    if (this.host && this.port) {
      this.connect();
    }
  }
  this.connect = function() {
    console.log('connect to server: ' + this.host + ':' + this.port);
    this.sock = net.connect({host: this.host, port: this.port}, elation.bind(this, this.handleconnect));
    this.sock.on('data', elation.bind(this, this.handledata));
  }
  this.send = function(data) {
    if (this.sock) {
      var str = (data instanceof elation.irc.message ? data.raw : data);
      console.log('server send: ' + str);
      this.sock.write(str + '\r\n');
    }
  }
  this.handleconnect = function() {
    console.log('server connected: ' + this.host + ':' + this.port);
    elation.events.fire({type: 'serverconnect', element: this});
  }
  this.handledisconnect = function() {
    console.log('server disconnected: ' + this.host + ':' + this.port);
    this.sock = false;
  }
  this.handledata = function(data) {
    console.log('server data:', data.toString('utf8'));
    elation.events.fire({type: 'servermessage', element: this, data: new elation.irc.message(this, data.toString('utf8'))});
  }
  this.init();
});
elation.extend("irc.relay.user", function(auth) {
  this.auth = auth;
  this.user = auth.user;
  this.nick = auth.nick;
  this.servers = {};
  this.clients = [];

  this.init = function() {
    console.log('init relay user for ' + this.user);
  }
  this.addclient = function(client) {
    console.log('add client for user ' + this.user);
    elation.events.add(client, 'clientmessage,clientclose', this)
    this.clients.push(client);
  }
  this.removeclient = function(client) {
    var i = this.clients.indexOf(client);
    if (i != -1) {
      this.clients.splice(i, 1);
    }
  }
  this.addserver = function(host, port) {
    var servername = host+':'+port;
    if (!this.servers[servername]) {
      console.log('add server: ', servername);
      this.servers[servername] = new elation.irc.relay.server(host, port, auth);
      elation.events.add(this.servers[servername], 'serverconnect,servermessage,serverclose', this);
    } else {
      console.log('server already exists: ' + servername);
    }
  }
  this.routemessage = function(msg) {
    for (var k in this.servers) {
      return this.servers[k];
    }
    //return this.servers[0];
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == 'function') {
      this[ev.type](ev);
    }
  }
  this.clientmessage = function(ev) {
    var msg = ev.data;
    switch (msg.command) {
      case 'bncconnect':
        this.addserver(msg.args[0], msg.args[1]);
        break;
      default:
        var server = this.routemessage(msg);
        if (server) {
          server.send(msg);
        }
    }
  }
  this.clientclose = function(ev) {
    console.log('client disconnected!', ev.target);
    this.removeclient(ev.target);
  }
  this.serverconnect = function(ev) {
    console.log('really connected now', this);
    ev.target.send('NICK ' + this.nick);
    ev.target.send('USER ' + this.user + ' ' + this.user + ' ' + this.user + ' ' + this.user);
/*
    for (var i = 0; i < this.queue.length; i++) {
      this.netsock.write(this.queue[i].raw + '\r\n');
    }
*/
  }
  this.servermessage = function(ev) {
    var msg = ev.data;
    for (var i in this.clients) {
      this.clients[i].send(msg);
    }
  }
  this.serverclose = function(data) {
    if (this.websock) {
      console.log('data!', data.toString('utf8'));
      this.websock.send(data.toString('utf8'));
    } else {
      console.log('no websock!');
    }
  }
  this.init();
});

