{dependency type="javascript" url="http://www.meobets.com/~bai/websockify/include/base64.js"}
{dependency type="javascript" url="http://www.meobets.com/~bai/websockify/include/websock.js"}
{dependency type="javascript" url="http://www.meobets.com/~bai/websockify/include/util.js"}
{dependency name="utils.dust"}
{dependency name="utils.template"}
{dependency name="irc"}
{dependency name="irc.user"}
{dependency name="irc.server"}
{dependency name="irc.script-default"}
{dependency name="irc.window"}
{dependency name="irc.input"}
{dependency name="irc.messages"}
{dependency name="irc.nicklist"}

<div class="elation_irc_client" elation:component="irc.client">
  {component name="irc.connect" host=$host nick=$nick}
</div>

{set var="page.title"}ripIRC v0.1{/set}
