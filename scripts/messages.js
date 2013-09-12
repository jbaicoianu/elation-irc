if (typeof require != 'undefined') {
  var elation = require("utils/elation");
}
elation.component.add("irc.messages", function() {
  this.init = function() {
    this.client = elation.component.fetch(this.container.parentNode);
    this.group = this.args.group || false;
    elation.html.addclass(this.container, "elation_irc_messages");
    if (this.group) {
      elation.html.addclass(this.container, "elation_irc_messages_group");
    }
    console.log('new message window');
  }
  this.add = function(msg) {
    var el = elation.html.create('li');
    el.className = "elation_irc_message elation_irc_message_" + msg.command;
    var showtimestamp = elation.template.exists("irc.style.timestamp");

    var time = new Date();
    var tplname = "irc.style." + msg.command;
    if (!elation.template.exists(tplname)) {
      tplname = "irc.style.unknown";
    }
    var msgtxt = (showtimestamp ? elation.template.get("irc.style.timestamp", msg) : '');
    msgtxt += elation.template.get(tplname, msg);
    el.innerHTML = msgtxt;

    this.container.appendChild(el);
    this.container.scrollTop = this.container.scrollHeight;
  }
  this.clear = function() {
    this.container.innerHTML = '';
  }
});
elation.extend("irc.message", function(server, raw, channel) {
  this.server = server;
  this.raw = raw;
  this.channel = channel || this.server.channel;
  this.src = false;
  this.command = false;
  this.args = false;
  this.payload = false;
  this.handled = false;
  this.data = {};

  //console.log('msg init:', this.server, this.server.channel);
  this.init = function() {
    var currpos = 0;
    this.time = this.getTimestamp();
    if (this.raw[0] == ":") {
      var currpos = this.raw.indexOf(" ");
      this.prefix = this.raw.substring(1, currpos);
      var parseduser = new elation.irc.user(this.prefix);
      this.src = (this.server && this.server.getuser ? this.server.getuser(parseduser.nick, parseduser) : parseduser);
    }
    var colpos = this.raw.indexOf(":", currpos);
    if (colpos != -1) {
      var cmdpart = this.raw.substring(currpos,colpos);
      this.payload = this.raw.substring(colpos+1);
    } else {
      var cmdpart = this.raw.substring(currpos);
    }
    if (cmdpart) {
      var cmdparts = cmdpart.trim().split(' ');
      this.command = (this.server && this.server.client ? this.server.client.mapcommand(cmdparts[0]) : cmdparts[0]).toLowerCase();
      this.args = cmdparts.slice(1);
    }
  }
  this.handle = function() { 
    this.handled = true;
    return this;
  }
  this.setchannel = function(channel) {
    this.channel = (channel instanceof elation.irc.channel ? channel : this.server.getchannel(channel));
    console.log('msg setchannel:', this.channel);
    return this.channel;
  }
  this.getTimestamp = function() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes(), s = d.getSeconds();
    var ts = {
      day:    d.getDay(),
      month:  d.getMonth(),
      year:   d.getYear(),
      hour:   (h < 10 ? "0" : "") + h,
      minute: (m < 10 ? "0" : "") + m,
      second: (s < 10 ? "0" : "") + s
    };
    return ts;
  }
  this.init();
});
