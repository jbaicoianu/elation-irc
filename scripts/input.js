elation.component.add("irc.input", function() {
  this.init = function() {
    this.history = [];
    this.historypos = 0;

    this.window = this.args.window;
    this.client = this.window.client;

    var inputs = elation.find("input", this.container);
    if (inputs[0]) {
      this.input = inputs[0];
    } else {
      this.input = elation.html.create({tag: 'input', append: this.container});
    }
    elation.html.addclass(this.input, "elation_irc_input");
    elation.events.add(this.input, "keydown,keyup", this);
    this.focus();
  }
  this.focus = function() {
    this.input.focus();
  }
  this.keydown = function(ev) {
    switch (ev.keyCode) {
      case 13: // enter
        var value = this.input.value;
        this.history.push(value);
        this.historypos = 0;
        var channel = this.window.getactivechannel();
        channel.server.processcommand(value, this.window);
        this.input.value = '';
        ev.preventDefault();
        break;
      case 38: // up
        if (++this.historypos >= this.history.length) {
          this.historypos = this.history.length;
        }
        var value = this.history[this.history.length - this.historypos] || '';
        this.input.value = value;
        ev.preventDefault();
        break;
      case 40: // down
        var value = "";
        if (--this.historypos <= 0) {
          this.historypos = 0;
        } else {
          value = this.history[this.history.length - this.historypos] || '';
        }
        this.input.value = value;
        ev.preventDefault();
        break;
    }
  }
});
