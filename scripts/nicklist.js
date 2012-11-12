elation.component.add("irc.nicklist", function() {
  this.init = function() {
    this.users = {};

    this.ul = elation.html.create({tag: 'ul', append: this.container}); 
    elation.html.addclass(this.container, "elation_irc_nicklist");
  }
  this.set = function(users) {
    this.users = {};
    for (var k in users) {
      this.users[users[k].nick] = users[k];
    }
    this.update();
  }
  this.add = function(user) {
    if (!this.users[user.nick]) {
      this.users[user.nick] = user;
      this.update();
    }
  }
  this.remove = function(user) {
    if (this.users[user.nick]) {
      delete this.users[user.nick];
      this.update();
    }
  }
  this.update = function() {
    this.ul.innerHTML = '';
    for (var k in this.users) {
      var user = this.users[k];
      elation.html.create({tag: 'li', content: user.nick, append: this.ul});
    }
  }
});
