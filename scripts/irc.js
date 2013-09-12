elation.require(['irc.user', 'irc.client']);

elation.extend("irc.channel", function(server, name) {
  this.server = server;
  this.name = name;
  this.topic = '';
  this.users = {};

  this.init = function() {
  }
  this.addusers = function(users) {
    for (var k in users) {
      this.users[user.nick] = user;
    }
    elation.events.fire({type: 'irc_channel_change', element: this});
  }
  this.adduser = function(user, type) {
    if (!type) type = 'peon';
    this.users[user.nick] = user;
    elation.events.fire({type: 'irc_channel_change', element: this});
  }
  this.removeuser = function(user) {
    if (this.users[user.nick]) {
      delete this.users[user.nick];
      elation.events.fire({type: 'irc_channel_change', element: this});
    }
  }
  this.settopic = function(topic) {
    this.topic = topic;
    elation.events.fire({type: 'irc_channel_change', element: this});
  }
  this.clear = function() {
    elation.events.fire({type: 'irc_channel_clear', element: this});
  }
  this.getid = function() {
    return server.host + ":" + this.name;
  }
  this.init(); 
});
elation.extend("irc.channeluser", function(channel, user, mode) {
  this.user = user;
  this.channel = channel;
  this.mode = model
});
elation.extend("irc.utils.parsecolorcode", function(str) {
  var colorcodes = ['', ''];
  var coloridx = 0;
  for (var j = 0; j < str.length; j++) {
    var c = str[j];
    if (!isNaN(parseInt(c))) {
      colorcodes[coloridx] += c;
    } else if (c == ',') {
      coloridx++;
    } else {
      break;
    }
  }
  if (colorcodes[0] == '') colorcodes[0] = false;
  if (colorcodes[1] == '') colorcodes[1] = false;
  return [j, colorcodes];
});
