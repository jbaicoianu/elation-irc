elation.require(['ui.window', 'irc.window', 'irc.server']);
elation.component.add("irc.client", function() {
  this.mappings = {
    "init"       : ["001"],
    "misc"       : ["002", "003", "004", "005", "015", "025", "251", "254", "250", "256", "265", "266", "255", "372", "375", "376"],
    "names"      : ["353"],
    "nickinuse"  : ["433"],
    "chantopic"  : ["332"],
    "chantopicby": ["333"],
    "msg"        : ["PRIVMSG"],
  };
  this.raw = {};
  
  this.init = function() {
    this.servers = {};
    this.windows = {};
    this.initmappings();

    /* FIXME - should be a function on elation.template */
    if (dust) {
      dust.filters.colorize = this.colorize;
      dust.filters.urlize = this.urlize;

      dust.helpers.range = function(chunk, context, bodies, params) {
        alert('do range');
        console.log(chunk, context, bodies, params);
      }
    }
  }

  this.getwindow = function(channel) {
    var id = channel.getid();
    if (!this.windows[id]) {
      this.windows[id] = new elation.irc.window(null, elation.html.create({append: this.container}), {channel: channel, client: this});
      this.setActiveWindow(this.windows[id]);
    }
    return this.windows[id];
  }
  this.setActiveWindow = function(win) {
    if (this.activewindow) {
      this.activewindow.blur();
    }
    this.activewindow = win;
    this.activewindow.focus();
  }
  this.connect = function(host, port, nick) {
    if (!port) port = 6667;
    var servername = host + ':' + port;

    var server = new elation.irc.server(this, host, port);
    server.connect(nick);

    return server;
  }
  this.initmappings = function() {
    // build reverse mapping for easier lookups
    for (var k in this.mappings) {
      for (var i = 0; i < this.mappings[k].length; i++) {
        this.raw[this.mappings[k][i]] = k;
      }
    }
  }
  this.mapcommand = function(cmd) {
    if (this.raw[cmd]) {
      return this.raw[cmd];
    }
    return cmd;
  }
  this.colorize = function(str) {
    var colornames = ["white", "black", "blue", "green", "lightred", "brown", "purple", "orange", "yellow", "lightgreen", "cyan", "lightcyan", "lightblue", "pink", "grey", "lightgrey"];
    var state = {'c1':false,'c2':false,'u':false,'r':false,'b':false};
    var statename = {2: 'b', 18: 'r', 31: 'u'};
    var escapechars = {'<': '&lt;', '>': '&gt;'};
    //var str = elation.utils.htmlentities(str);
    var opentag = false;
    var outstr = "";
    for (var i = 0; i < str.length; i++) {
      var newstate = elation.utils.merge(state); // clone state variable
      var diff = {};
      var c = str.charCodeAt(i);
      var printable = true;
      switch (str.charCodeAt(i)) {
        // simple toggles
        case  2: // ^B - bold
        case 18: // ^R - reverse
        case 31: // ^U - underline
          printable = false;
          diff[statename[c]] = !state[statename[c]];
          break;
        case 3: // ^C - color
          printable = false;
          var colorcodes = elation.irc.utils.parsecolorcode(str.substr(i+1,5));
          i += colorcodes[0];
          if (colorcodes[1][0] === false) {
            diff.c1 = newstate.c2 = false;
          } else {
            diff.c1 = colorcodes[1][0];
            diff.c2 = colorcodes[1][1] || state.c2;;
          }
          break;
        case 15: // ^O - reset
          printable = false;
          diff.c1 = diff.c2 = diff.b = diff.u = diff.r = false;
          break;
      }

      var numdiffs = 0;
      for (var k in diff) {
        numdiffs++;
        newstate[k] = diff[k];
      }
      if (numdiffs > 0) {
        var classname = '';
        if (newstate.b) classname += "irc_message_style_bold ";
        if (newstate.r) classname += "irc_message_style_reverse ";
        if (newstate.u) classname += "irc_message_style_underline ";
        if (newstate.c1) classname += "irc_message_color_" + colornames[newstate.c1] + " ";
        if (newstate.c2) classname += "irc_message_background_" + colornames[newstate.c2] + " ";
        if (classname != '') {
          if (opentag) outstr += '</span>';
          outstr += '<span class="' + classname + '">';
          opentag = true;
        } else {
          outstr += '</span>';
          opentag = false;
        }
      }
      if (printable) {
        outstr += (escapechars[str[i]] ? escapechars[str[i]] : str[i]); //elation.utils.htmlentities(str[i]);
      }
      state = newstate;
    }
    if (opentag) outstr += '</span>';
    
    return outstr;
  }
  this.urlize = function(str) {
    var re = new RegExp(/\b((?:[a-z][\w-]+:(?:\/{1,3}|[a-z0-9%])|www\d{0,3}[.]|[a-z0-9.\-]+[.][a-z]{2,4}\/)(?:[^\s()<>]+|\(([^\s()<>]+|(\([^\s()<>]+\)))*\))+(?:\(([^\s()<>]+|(\([^\s()<>]+\)))*\)|[^\s`!()\[\]{};:'".,<>?«»“”‘’]))/g);
    var match;
    var replaces = {};
    while ((match = re.exec(str, re.lastIndex)) != null) {
      var url = match[0];
      if (!url.match(/^(\w+:)?\/\//)) {
        url = "http://" + url;
      }
      replaces[match[0]] = elation.template.get("irc.style.link", {url: url, text: match[0]});
    }
    for (var url in replaces) {
      str = str.replace(url, replaces[url]);
    }
    return str;
  }
});
