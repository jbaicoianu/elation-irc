{dependency name="irc.connectionmanager"}
<form elation:component="irc.connectionmanager">
  <input name="nick" value="{$nick|escape:html}">
  <input name="host" value="{$host|escape:html}">
  <input name="port" value="6667">
  <input type="submit" value="connect">
</form>
