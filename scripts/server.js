elation.extend("irc.server", function(client, host, port, ssl) {
  this.client = client;
  this.host = host;
  this.port = port || 6667;
  this.ssl = ssl || false;
  this.connected = false;
  this.self = new elation.irc.user();

  this.users = {};
  this.channels = {};
  this.scripts = {};

  this.connect = function(nick) {
    if (nick) {
      this.self.setnick(nick);
    }

    this.registerstyle('irc.style.unknown', '{raw}');
    this.registercommand('script', this.irc_client_script);
    this.script("load", "default");

    this.channel = new elation.irc.channel(this, host);
    this.client.getwindow(this.channel);
    var websockify = false;
    if (websockify) {
      this.socket = new Websock();
      this.socket.open("ws://meobets.com:8888/");
      this.socket.on("open", elation.bind(this, this.ws_open));
      this.socket.on("close", elation.bind(this, this.ws_close));
      this.socket.on("message", elation.bind(this, this.ws_message));
    } else {
      this.recvbuf = '';
      this.socket = new WebSocket('ws://meobets.com:8888/');
      elation.events.add(this.socket, "open,message,close", this);
    }
  }
  this.handleEvent = function(ev) {
    if (typeof this[ev.type] == "function") {
      return this[ev.type](ev);
    }
  }
  this.open = function(ev) {
    console.log('connection opened', ev);
    this.connected = true;
    var msg = new elation.irc.message(this, "connect :Connection established");
    //this.send("HEYO " + this.self.nick + " " + this.host + " " + this.port);
    this.dispatchmessage("server", msg);
  }
  this.close = function(ev) {
    console.log('connection closed', ev);
    this.connected = false;
    var msg = new elation.irc.message(this, "disconnect :Lost connection", this.serverwindow);
    this.dispatchmessage("server", msg);
  }
  this.message = function(ev) {
    this.recvbuf += ev.data;
    var nlpos = 0, lastpos = 0;
    while ((nlpos = this.recvbuf.indexOf('\r\n', lastpos)) != -1) {;
      this.processmessage(this.recvbuf.substring(lastpos, nlpos));
      lastpos = nlpos+2;
    }
    this.recvbuf = this.recvbuf.substring(lastpos);
  }
  this.ws_open = function(ev) {
    this.open(ev);
  }
  this.ws_close = function(ev) {
    this.close(ev);
  }
  this.ws_message = function(ev) {
    var rQ, rQi, i;

    while (this.socket.rQlen() > 1) {
      rQ = this.socket.get_rQ();
      rQi = this.socket.get_rQi();
      for (i = rQi; i < rQ.length; i++) {
        if (rQ[i] === 10) {
            break;
        }
      }
      if (i >= rQ.length) {
        // No line break found
        break;
      }
      var line = this.socket.rQshiftStr((i-rQi) + 1);
      this.processmessage(line.trim());
    }
  }
  this.send = function(data) {
    if (this.socket) {
      console.log('send: ', data);
      this.socket.send(data + "\r\n");
    }
  }
  this.processmessage = function(msg) {
    var cmd = new elation.irc.message(this, msg);

    this.dispatchmessage("server", cmd);
  }
  this.processcommand = function(cmd, win) {
    if (cmd[0] == '/') {
      var payloadpos = cmd.indexOf(' ');
      if (payloadpos != -1) {
        var rawcmd = cmd.substring(1, payloadpos) + ' :' + cmd.substring(payloadpos+1);
      } else {
        rawcmd = cmd.substring(1);
      }
      var msg = new elation.irc.message(this, rawcmd);
    } else {
      var msg = new elation.irc.message(this, "PRIVMSG " + win.channel.name + " :" + cmd);
    }
    msg.src = this.self;
    msg.setchannel(win.channel);
    this.dispatchmessage("client", msg);
  }
  this.dispatchmessage = function(src, msg) {
    try {
      elation.events.fire({type: "irc_" + src + "_" + msg.command, element: this, data: msg});
      elation.events.fire({type: "irc_" + src + "_default", element: this, data: msg});

      elation.events.fire({type: "irc_channel_" + msg.command, element: msg.channel, data: msg});
      elation.events.fire({type: "irc_channel_default", element: msg.channel, data: msg});
    } catch (e) {
      console.error('elation.irc.server: ', e.stack);
    }
  }
  this.getchannel = function(channel) {
    if (!this.channels[channel]) {
      this.channels[channel] = new elation.irc.channel(this, channel);
    }
    return this.channels[channel];
  }
  this.getuser = function(nick, newinfo) {
    if (!this.users[nick]) {
      this.users[nick] = new elation.irc.user(nick);
    }
    this.users[nick].update(newinfo);
    return this.users[nick];
  }
  this.setnick = function(nick) {
    this.self.setnick(nick);
    if (this.connected) {
      this.send("NICK " + nick);
    }
  }
  this.script = function(action, scriptname, skipautoload) {
    if (action == 'load' && !elation.irc.scripts[scriptname] && !skipautoload) {
      elation.file.get(
        'javascript',
        '/scripts/irc/script-' + scriptname + '.js', 
        elation.bind(this, function() { this.script("load", scriptname, true) })
      );
      return false;
    } 
    var remove = false;
    if (action == 'unload') {
      var script = this.scripts[scriptname];
      remove = true;
    } else {
      var script = elation.irc.scripts[scriptname];
      this.scripts[scriptname] = {};
    }
        
    if (script) {
      if (script.events) {
        this.scripts[scriptname].events = this.register("event", script.events, remove);
      }
      if (script.styles) {
        this.scripts[scriptname].styles = this.register("style", script.styles, remove);
      }
      if (script.commands) {
        this.scripts[scriptname].commands = this.register("command", script.commands, remove);
      }
      console.log(action + 'ed script: ' + scriptname, this.scripts[scriptname]);
      return this.scripts[scriptname];
    } else {
      console.log('Error loading script: ' + scriptname);
    }
    return false;
  }
  this.register = function(type, things, remove) {
    var ret = null;
    //console.log('register ' + type, things);
    if (things) {
      var funcname = 'register'+type;
      if (typeof this[funcname] == 'function') {
        ret = {};
        for (var name in things) {
          ret[name] = this[funcname](name, things[name], remove);
        }
      }
    }
    return ret;
  }
  this.registerevent = function(name, func, remove) {
    if (!remove) {
      var bindfunc = elation.bind(this, function(ev) {
        func.call(this, ev.data);
      });
      elation.events.add(this, name, bindfunc);
      return bindfunc;
    } else {
      elation.events.remove(this, name, func);
      return null;
    }
  }
  this.registerstyle = function(name, tpl, remove) {
    if (!remove) {
      return elation.template.add(name, tpl);
    } else {
      elation.template.remove(name);
      return null;
    }
  }
  this.registercommand = function(name, command, remove) {
    if (!remove) {
      var bindfunc = elation.bind(this, command);
      elation.events.add(this, "irc_client_" + name, bindfunc);
      return bindfunc;
    } else {
      elation.events.remove(this, "irc_client_" + name, command);
      return null;
    }
  }
});
