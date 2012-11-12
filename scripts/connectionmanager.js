elation.component.add('irc.connectionmanager', function() {
  this.init = function() {
    this.client = elation.component.fetch(this.container.parentNode);
    elation.events.add(this.container, "submit", this);
  }
  this.submit = function(ev) {
    var form = ev.target;
    try {
      this.client.connect(form.host.value, form.port.value, form.nick.value);
    } catch(e) {
      console.error(e.stack);
    }
    ev.preventDefault();
  }
});
