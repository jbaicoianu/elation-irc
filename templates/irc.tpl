{dependency type="javascript" url="http://www.meobets.com/~bai/websockify/include/base64.js"}
{dependency type="javascript" url="http://www.meobets.com/~bai/websockify/include/websock.js"}
{dependency type="javascript" url="http://www.meobets.com/~bai/websockify/include/util.js"}
{dependency name="utils.dust"}
{dependency name="utils.template"}
{dependency name="irc"}

<div class="elation_irc_client" elation:component="irc.client">
  {component name="irc.connect" host=$host port=$port nick=$nick}
</div>

{set var="page.title"}ripIRC v0.1{/set}
