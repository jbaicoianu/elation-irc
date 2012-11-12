if (typeof require != 'undefined') {
  var elation = require("elation");
}

elation.extend("irc.user", function(userstring) {
  this.nick = '';
  this.type = 'unknown';
  this.channels = [];
  this.valid = false;

  this.init = function() {
    if (userstring) {
      this.valid = true;
      var parts = userstring.trim().split("!", 2);
      this.nick = parts[0];
      if (parts.length > 1) {
        var hostparts = parts[1].split("@", 2);
        this.ident = hostparts[0];
        this.host = hostparts[1];
      }
    }
  }
  this.update = function(newinfo) {
    var oldnick = this.nick;
    for (var k in newinfo) {
      this[k] = newinfo[k];
    }
    elation.events.fire({type: 'irc_user_update', element: this});
    if (this.nick != oldnick) {
      elation.events.fire({type: 'irc_user_rename', element: this});
    }
  }
  this.setnick = function(newnick) {
    this.nick = newnick;
  }
  this.addchannel = function(channel) {
console.log('add channel', channel);
    if (this.channels.indexOf(channel) == -1) {
      this.channels.push(channel);
    }
  }
  this.removechannel = function(channel) {
    var i = this.channels.indexOf(channel);
    if (i != -1) {
      this.channels.splice(i, 1);
    }
  }
  this.init(); 
});

