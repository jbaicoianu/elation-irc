elation-irc
===========

Elation IRC is a scriptable web-based client/server relay written in JavaScript which allows a user to connect to multiple IRC servers and maintain a persistent connection to a server without having to keep a client open at all times.  Elation IRC is intended as a web-based replacement for the commonly-used screen+irssi setup.

Architecture
============

Client component runs in the browser, and establishes a websocket connection to the server.

Server component runs in Node.js, and acts as a relay between websockets and TCP sockets.  When a client issues a BNCCONNECT command, the server will establish a TCP connection to the specified server.  As long a a client is connected, it will act as a bidirectional relay.  If all clients disconnect, the server will maintain connection and respond to ping requests.  Clients can reconnect and resume the session at any time in the future.

Basic IRC protocol is handled by scripts/server.js, and from there all events and commands are handled by scripts.

Scripts are also written in javascript, and can define their own templates, event handlers, and commands.  (eg: scripts/script-default.js scripts/script-test.js).  Scripts can be loaded, unloaded, and reloaded on the fly without having to refresh by using the built-in /script command.


client
------
elation.irc.client
  - scripts-default
  - scripts-client


server
------
elation.irc.relay
  - scripts-default
  - scripts-relay


