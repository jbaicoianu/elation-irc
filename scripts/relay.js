if (typeof require != 'undefined') {
  var elation = require("utils/elation"),
      ws = require("ws"),
      net = require('net');
  require('utils/events');
  require('irc/messages');
}

elation.extend("irc.relay", function() {
  this.users = {};
  this.pending = [];
  this.init = function() {
    this.websockserver = new ws.Server({host: "meobets.com", port: 8888});
    this.websockserver.on('connection', elation.bind(this, this.handleconnect));
  }

  this.handleconnect = function(websock) {
    console.log('client connected: ', websock.upgradeReq.client.remoteAddress);
    var client = new elation.irc.relay.client(this, websock);
    elation.events.add(client, "clientauth", elation.bind(this, this.clientauth));
    this.pending.push(client);
  }
  this.clientauth = function(ev) {
    var client = ev.target;
    var auth = ev.data;
    var i = this.pending.indexOf(client);
    if (i != -1) {
      this.pending.splice(i, 1);
      if (!this.users[auth.user]) {
        console.log("client authorized: " + client.websock.upgradeReq.client.remoteAddress + " => " + auth.user);
        this.users[auth.user] = new elation.irc.relay.user(auth);
      }
      this.users[auth.user].addclient(client);
    } else {
      console.log("tried to complete connection which wasn't in pending state!", client);
    }
  }
  this.init();
});

elation.extend("irc.relay.client", function(server, websock) {
  this.pending = true;
  this.server = server;
  this.websock = websock;
  this.auth = {};
  this.requirepassword = false;
  this.queue = [];
  
  this.init = function() {
    console.log('new relay client');
    if (this.websock) {
      this.websock.on("message", elation.bind(this, this.handlemessage));
      this.websock.on("close", elation.bind(this, this.handleclose));
    }
  } 
  this.send = function(msg) {
    if (this.websock) {
      console.log('client send:\n\t' + msg.raw.replace(/\n/gm, "\n\t").trim());
      this.websock.send(msg.raw);
    }
  }
  this.handlemessage = function(msgstr) {
    var msg = new elation.irc.message(this.server, msgstr.toString('utf8'));
    console.log('client receive:\n\t' + msg.raw.replace(/\n/gm, "\n\t").trim());
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
  this.tcpsock = false;
  this.reconnectdelay = 5000;

  this.init = function() {
    if (this.host && this.port) {
      this.connect();
    }
  }
  this.connect = function() {
    if (this.reconnecttimer) {
      clearTimeout(this.reconnecttimer);
      this.reconnecttimer = false;
    }
    if (!this.tcpsock || !this.tcpsock.connected) {
      console.log('connect to server: ' + this.host + ':' + this.port);
      this.tcpsock = net.connect({host: this.host, port: this.port}, elation.bind(this, this.handletcpconnect));
      this.tcpsock.on('close', elation.bind(this, this.handletcpclose));
      this.tcpsock.on('data', elation.bind(this, this.handletcpdata));
      this.tcpsock.on('error', elation.bind(this, this.handletcperror));
    } else {
      console.log('already connected to server: ' + this.host + ':' + this.port);
    }
  }
  this.reconnect = function() {
    if (!this.reconnecttimer) {
      console.log("reconnect in " + (this.reconnectdelay / 1000) + " seconds...");
      this.reconnecttimer = setTimeout(elation.bind(this, this.connect), this.reconnectdelay);
    }
  }
  this.send = function(data) {
    if (this.tcpsock) {
      var str = (data instanceof elation.irc.message ? data.raw : data);
      console.log('server send:\n\t' + str.replace(/\n/m, "\n\t").trim());
      try {
        this.tcpsock.write(str + '\r\n');
      } catch (e) {
        console.log("FUCK", e);
      }
    }
  }
  this.handletcpconnect = function() {
    console.log('server connected: ' + this.host + ':' + this.port);
    elation.events.fire({type: 'serverconnect', element: this});
  }
  this.handletcpclose = function() {
    console.log('server disconnected: ' + this.host + ':' + this.port);
    this.tcpsock = false;
    if (!this.cancelled) {
      this.reconnect();
    }
  }
  this.handletcpdata = function(data) {
    console.log('server receive:\n\t' + data.toString('utf8').replace(/\n/gm, "\n\t").trim());
    elation.events.fire({type: 'servermessage', element: this, data: new elation.irc.message(this, data.toString('utf8'))});
  }
  this.handletcperror = function(err) {
    console.log("server error: " + err.code);
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
      this.servers[servername] = new elation.irc.relay.server(host, port, auth);
      elation.events.add(this.servers[servername], 'serverconnect,servermessage,serverclose', this);
    } else {
      console.log('server already exists: ' + servername);
    }
  }
  this.routemessage = function(msg) {
    // FIXME - to properly support multi-server, the client might need to provide more information with each message
    for (var k in this.servers) {
      return this.servers[k];
    }
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
          try {
            server.send(msg);
          } catch (e) {
            console.log("ERROR relaying from client to server", e);
          }
        }
    }
  }
  this.clientclose = function(ev) {
    console.log('client disconnected: ', this.nick);
    this.removeclient(ev.target);
  }
  this.serverconnect = function(ev) {
    var server = ev.target;
    ev.target.send('NICK ' + this.nick);
    ev.target.send('USER ' + this.user + ' ' + this.user + ' ' + this.user + ' ' + this.user);
/*
    for (var i = 0; i < this.queue.length; i++) {
      this.tcpsock.write(this.queue[i].raw + '\r\n');
    }
*/
  }
  this.servermessage = function(ev) {
    var msg = ev.data;
    for (var i in this.clients) {
      try {
        this.clients[i].send(msg);
      } catch (e) {
        console.log("ERROR relaying from server to client:", e);
      }
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

