elation.component.add("irc.window", function() {
  this.init = function() {
    elation.html.addclass(this.container, "elation_irc_window");
    this.client = this.args.client;
    this.titlebar = elation.html.create({tag: 'div', classname: 'elation_irc_window_titlebar', append: this.container});
    if (this.args.channel) {
      this.setchannel(this.args.channel);
    }

    if (!(this.channel instanceof elation.irc.channel)) {
      this.channel = new elation.irc.channel(this.channel);
    }
    this.contentarea = elation.html.create({tag: "div", append: this.container, classname: 'elation_irc_window_content'});
console.log(this.channel);
    if (this.channel.name[0] == '#') {
      this.messages = elation.irc.messages(null, elation.html.create({append: this.contentarea}), {window: this, group: true});
      this.nicklist = elation.irc.nicklist(null, elation.html.create({append: this.contentarea}), {window: this});
    } else {
      this.messages = elation.irc.messages(null, elation.html.create({append: this.contentarea}), {window: this, group: false});
    }

    this.input = elation.irc.input(null, elation.html.create({append: this.container}), {window: this});

    elation.events.add(this.container, "click", this);
    elation.events.add(this.channel, "irc_channel_change,irc_channel_clear", this);
    this.setTopic(false);
  }
  this.setchannel = function(channel) {
    // TODO - a window might have multiple channels, this should really be add/remove instead of set
    this.channel = channel;
    elation.events.add(channel, "irc_channel_default", this);
    this.setTopic();
  }
  this.getactivechannel = function() {
    return this.channel;
  }
  this.setTopic = function(topic) {
    this.titlebar.innerHTML = topic;
  }
  this.focus = function() {
    this.input.focus();
    elation.html.addclass(this.container, "elation_state_active");
  }
  this.blur = function() {
    elation.html.removeclass(this.container, "elation_state_active");
  }
  this.click = function(ev) {
    this.client.setActiveWindow(this);
  }
  this.irc_channel_change = function(ev) {
    var channel = ev.target;
    if (this.nicklist) {
      this.nicklist.set(channel.users);
    }
    var newtopic = '<span class="elation_irc_channel">' + channel.name + '</span>';
    if (channel.topic) {
      var topichtml = elation.utils.htmlentities(channel.topic);
      newtopic += '<span class="elation_irc_topic" title="' + topichtml + '">' + this.client.urlize(topichtml) + '</span>';
    }
    this.setTopic(newtopic);
  }
  this.irc_channel_clear = function(ev) {
    this.messages.clear(); 
  }
  this.irc_channel_default = function(ev) {
    console.log('window got shit', ev);
    var msg = ev.data;
    this.messages.add(msg);
  }
});
