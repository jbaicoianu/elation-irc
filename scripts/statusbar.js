elation.extend("irc.statusbar", function() {
  this.init = function() {
    this.windows = [];
  }
  this.addWindow = function(win) {
    this.windows.push(win);
  }
  this.update = function() {
  }
});
