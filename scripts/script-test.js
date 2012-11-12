elation.extend("irc.scripts.test", new function() {
  this.events = {
    'irc_server_mode': function(msg) { alert('heheheh'); }
  }
}, true);
