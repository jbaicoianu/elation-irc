elation.extend("irc.scripts.default", new function() {
  this.styles = {
    'irc.style.timestamp'   : '<span class="elation_irc_timestamp">{time.hour}:{time.minute}</span>',
    'irc.style.link'        : '<a href="{url}" target="_blank">{url}</a>',
    'irc.style.misc'        : '{payload}',
    'irc.style.error'       : '{payload}',
    'irc.style.ping'        : 'POING',
    'irc.style.clear'       : '',
    'irc.style.selfmsg'     : '<span class="elation_irc_message_self"><span class="elation_irc_user">{src.nick}</span> {payload|s|colorize|urlize}</span>',
    'irc.style.selfjoin'    : '-!- <span class="elation_irc_message_self">joined {payload}</span>',
    'irc.style.selfpart'    : '-!- <span class="elation_irc_message_self">left {payload}</span>',
    'irc.style.join'        : '-!- {src.nick} [{src.ident}@{src.host}] has joined {payload}',
    'irc.style.part'        : '-!- {src.nick} [{src.ident}@{src.host}] has left {args[0]}',
    'irc.style.quit'        : '-!- {src.nick} [{src.ident}@{src.host}] has quit [{payload}]',
    'irc.style.msg'         : '<span class="elation_irc_user">{src.nick}</span> {payload|s|colorize|urlize}',
    'irc.style.notice'      : '<span class="elation_irc_user">{src.nick}!{src.ident}@{src.host}</span> {payload}',
    'irc.style.servernotice': '<span class="elation_irc_server">{src.nick}</span> {payload}',
    'irc.style.topic'       : '-!- {src.display} changed topic of {channel} to {payload|s|colorize|urlize}',
    'irc.style.chantopic'   : '-!- topic for {args[1]}: {payload|s|colorize|urlize}',
    'irc.style.chantopicby' : '-!- topic set by {args[2]} at {args[3]}',
    'irc.style.333'         : '[Users {args[1]}]',
    'irc.style.names'       : '{#data.users}<span class="elation_irc_user">{nick}</span> {/data.users}',
    'irc.style.366'         : 'End of /NAMES list',
    'irc.style.nick'        : '-!- {src.nick} changed nick to {payload}',
    'irc.style.action'      : '* <span class="elation_irc_user">{src.nick}</span> {payload|s|colorize|urlize}',
    'irc.style.mode'        : '-!- mode/{args[0]} [{args[1]} {range a="b"}] by <span class="elation_irc_user">{src.nick}</span>',
    'irc.style.kick'        : '-!- <span class="elation_irc_user">{args[1]}</span> was kicked from {args[0]} by {src.nick}: {payload}'
  };

  this.commands = {
    'script': function(ev) {
      var msg = ev.data;
      var cmdparts = msg.payload.split(' ');
      var cmd = cmdparts[0];
      var scriptname = cmdparts[1];

      switch (cmd) {
        case 'load':
          msg.server.script("load", scriptname);
          break;
        case 'unload':
          msg.server.script("unload", scriptname);
          break;
        case 'reload':
          msg.server.script("unload", scriptname);
          delete elation.irc.scripts[scriptname];
          msg.server.script("load", scriptname);
          break;
      }
      ev.stopPropagation();
    },
    'raw': function(ev) {
      var msg = ev.data;
      msg.server.send(msg.payload);
    },
    'msg': function(ev) {
      var msg = ev.data.handle();
      if (msg.payload[0] == '') { // CTCP
        var pos = msg.indexOf(' ');
        var ctcp = msg.substring(1, pos).toLowerCase();
        var payload = msg.payload.substring(pos);
        switch (ctcp) {
          case 'action':
            msg.command = 'action';
            msg.payload = payload.substring(7);
            break;
        }
      } else {
        msg.command = "selfmsg";
      }
      msg.server.send("PRIVMSG " + msg.args[0] + " :" + msg.payload);
    },
    'me': function(ev) {
      var msg = ev.data.handle();
      msg.server.send("PRIVMSG " + msg.channel.name + " :ACTION " + msg.payload + "");
      msg.command = "action";
    },
    'slap': function(ev) {
      var msg = ev.data.handle();
      msg.payload = "slaps " + msg.payload + " around with a large trout";
      msg.server.send("PRIVMSG " + msg.channel.name + " :ACTION " + msg.payload + "");
      msg.command = "action";
    },
    'join': function(ev) {
      var msg = ev.data;

      msg.server.send("JOIN :" + msg.payload);
    },
    'part': function(ev) {
      var msg = ev.data;
      var channel = msg.payload || msg.channel.name;
      msg.server.send("PART " + channel);
    },
    'cycle': function(ev) {
      var msg = ev.data;
      var channel = msg.payload || msg.channel.name;
      msg.server.send("PART " + channel);
      msg.server.send("JOIN :" + channel);
    },
    'connect': function(ev) {
      var msg = ev.data;
      msg.server.send("BNCCONNECT " + msg.payload);
    },
    'whois': function(ev) {
      var msg = ev.data;
      msg.server.send("WHOIS " + msg.payload);
    },
    'window': function(ev) {
console.log(channel, win);
      var msg = ev.data;
      var parts = msg.payload.split(' ', 2);
      var action = parts[0];
      switch (action) {
        case 'fix':
          msg.server.send('WHOIS ' + msg.src.nick);
          var channel = msg.server.getchannel(parts[1]);
          var win = msg.server.client.getwindow(channel);
          msg.server.send('TOPIC ' + channel.name);
          msg.server.send('NAMES ' + channel.name);
          break;
        case 'close':
          alert('not implemented!');
          break;
      }    },
    'topic': function(ev) {
      var msg = ev.data;
      var channelname = msg.channel.name;
      var topic = false;
      if (msg.payload[0] == '#' || msg.payload[0] == '&') {
        var spos = msg.payload.indexOf(' ');
        channelname = (spos == -1 ? msg.payload : msg.payload.substring(0,spos));
        topic = (spos == -1 ? false : msg.payload.substring(spos));
      }
      msg.server.send('TOPIC ' + channelname + (topic ? ' :' + topic : ''));
    },
    'names': function(ev) {
      var msg = ev.data;
      var channelname = msg.channel.name;
      if (msg.payload[0] == '#' || msg.payload[0] == '&') {
        var spos = msg.payload.indexOf(' ');
        channelname = (spos == -1 ? msg.payload : msg.payload.substring(0,spos));
      }
      console.log('send: NAMES ' + channelname);
      msg.server.send('NAMES ' + channelname);
    },
    'clear': function(ev) {
      var msg = ev.data;
      msg.channel.clear();
    }

  };
  
  this.events = {
    "irc_server_connect": function(msg)  {
      msg.command = "misc";
      var self = msg.server.self;
console.log(this, self, msg);
      //msg.server.send("PASS " + self.pass);
      msg.server.send("NICK " + self.nick);
      msg.server.send("USER " + self.nick + " " + self.nick + " " + self.nick + " " + self.nick);
      msg.server.send("BNCCONNECT " + msg.server.host + " " + msg.server.port);
    },
    "irc_server_disconnect": function(msg)  {
      console.log('disconnected!');
      msg.command = "error";
    },
    "irc_server_init": function(msg)  {
      msg.command = "misc";
      msg.channel.settopic(msg.server.self.nick);
    },

    "irc_server_msg": function(msg)  {
console.log('got a message', msg);
      //msg.setwindow(this.routemessage(msg.args[0]));
      msg.setchannel(msg.args[0]);
      msg.server.client.getwindow(msg.channel);
      if (msg.payload[0] == '') { // CTCP
        var pos = msg.payload.indexOf(' ');
        var ctcp = msg.payload.substring(1, pos).toLowerCase();
        var payload = msg.payload.substr(pos+1);
console.log('ctcp!', ctcp, payload);
        switch (ctcp) {
          case 'action':
            msg.command = 'action';
            msg.payload = payload;
            break;
        }
      }
    },

    "irc_server_notice": function(msg)  {
      if (msg.src.type == 'server') {
        msg.command = 'servernotice';
      }
      //msg.setwindow(this.routemessage(msg.args[0]));
      //msg.setchannel(msg.args[0]);
    },

    "irc_server_ping": function(msg)  {
      //msg.setwindow(this.routemessage(msg.src.host));
      msg.setchannel(msg.src.host);
      msg.server.send("PONG :" + msg.payload);
    },

    "irc_server_join": function(msg)  {
      //var channel = msg.server.getchannel(msg.payload);
      var channel = msg.setchannel(msg.payload);
console.log('join', msg, channel);
      if (msg.src.nick == msg.server.self.nick) {
        //msg.setwindow(this.createwindow(channel));
        //msg.server.self.addchannel(msg.payload);
        msg.server.client.getwindow(channel);
      } else {
        //msg.setwindow(this.routemessage(channel));
        //msg.window[0].nicklist.add(msg.src);
        msg.src.addchannel(channel);
        channel.adduser(msg.src);
      }
    },
    "irc_server_part": function(msg)  {
      var channel = msg.setchannel(msg.args[0]);
      if (msg.src.nick == msg.server.self.nick) {
        //this.closeWindow(channel);
      } else {
        //msg.setwindow(this.routemessage(channel));
        msg.src.removechannel(channel);
        channel.removeuser(msg.src);
      }
    },
    "irc_server_quit": function(msg)  {
      console.log('quit fuck', msg);
      var user = msg.src;
      console.log(user);
      //msg.setwindow(this.routemessage(user.channels));
      msg.setchannel(user.channels);
      for (var i = 0; i < user.channels.length; i++) {
        user.removechannel(channel);
        channel.removeuser(user);
      }
    },
    "irc_server_topic": function(msg)  {
      var channel = msg.setchannel(msg.args[1]);
      channel.settopic(msg.payload);
      //msg.channel = this.getchannel(msg.args[1]);
      //msg.setwindow(this.routemessage(channel));
    },
    "irc_server_chantopic": function(msg)  {
      var channel = msg.setchannel(msg.args[1]);
      channel.settopic(msg.payload);
    },
    "irc_server_chantopicby": function(msg)  {
console.log('topicby', msg);
      var channel = msg.setchannel(msg.args[1]);
    },

    "irc_server_nick": function(msg)  {
      var oldnick = msg.src.nick;
      var newnick = msg.payload;
      var user = false;
      msg.setchannel(msg.args[0]);
      if (oldnick == msg.server.self.nick) {
        user = msg.server.self;
        console.log('hey thats me', user, user);
      } else {
        user = this.users[oldnick];
      }
      if (user) {
        if (user.channels.length > 0) {
          for (var i = 0; i < user.channels.length; i++) {
            //this.routemessage(user.channels[i]).nicklist.update();
            
          }
        }
        user.update({nick: newnick});
        this.users[newnick] = user;
        delete this.users[oldnick];
      }
    },
    "irc_server_nickinuse": function(msg)  {
      var oldnick = msg.server.self.nick;
      var newnick = oldnick + '-';
      delete this.users[oldnick];
      msg.server.self.nick = newnick;
      this.users[newnick] = msg.server.self;
      msg.server.send("NICK " + newnick);
    },

    "irc_server_names": function(msg)  {
      var channel = msg.setchannel(msg.args[2]);
      //msg.setwindow(this.routemessage(msg.args[2]));
      msg.data.users = [];

      var nicks = msg.payload.split(' ');
      var special = "@+%";
      for (var i = 0; i < nicks.length; i++) {
        var nick = nicks[i];
        var usermode = 'peon';
        switch (nicks[i][0]) {
          case '@':
            usermode = 'op';
            break;
          case '%':
            usermode = 'halfop';
            break;
          case '+':
            usermode = 'voice';
            break;
        }
        if (usermode != 'peon') {
          nick = nick.substring(1);
        }
        var user = this.getuser(nick);
        user.addchannel(channel);
        channel.adduser(user, usermode);
        msg.data.users.push(user);
      }
      //msg.window[0].nicklist.set(msg.data.users);
    },
    "irc_server_mode": function(msg) {
      if (msg.args[0][0] == '#') {
        msg.setchannel(msg.args[0]);
      }  
    },
    "irc_server_kick": function(msg) {
      msg.setchannel(msg.args[0]);
    }
  }
}, true);

