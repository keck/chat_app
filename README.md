# chat_app

This chat app is basically a conversation piece for us to discuss the merits of all manner of dev practices..

## Approach
  First I took some time to consider what tools to use, naturally.
  
  As you'd suggested node, and that you make use of it at CM, I figured it was at least worth checking out.  Of course, a chat app is the canonical example of an application benefiting from async communication, so that's certainly a plus.  The only downside I could find was that websockets are not a good match for peer-to-peer communication; a little more research turned up WebRTC though, which is.
  
  Being that I didn't have any meaningful experience with node, I first started with a lot of reading and did a few hello-world type excercises with node, then express, socket.io, jquery, and so on.  The UI I've got is entirely from the express.js example's CSS.  Then I discovered express.io, which papers over express and socket.io, and re-built everything I'd done so far with that.
  
  There are apparantly more npm modules out there for defining and exposing a REST interface than there are grains of sand on an average beach, but I actually like restify the best of the ones I've looked at.
 
  Outside of the node world, I've used swagger (http://swagger.io) to maintain an API's definition, and like it quite a bit.  It turns out there are also many, many npm modules incorporating restify and or swagger..  
  - https://github.com/krakenjs/swaggerize-express
  - https://github.com/swagger-api/swagger-node-express
  - https://www.npmjs.com/package/node-restify-swagger

As of yet, though, I've been too busy playing with node to have added a REST interface to this project.  My thoughts about how to go about it though are somewhat limited to exposing limited sets of information (connected users, perhaps stats if we were to gather any, connection information, etc) as RESTful HTTP just doesn't line up that well with the stated requirements.

### General code structure

   - scratch dir -> my throwaway efforts from ramping up
   - src/chat.js -> the server code
   - src/public/index.html -> the client

   As you might expect, from src/ you can run 'npm install' and then 'node chat.js'.

   This will fire up a server on port 3000 by default.

   Pop open a couple of browser windows and connect to it, and play around.

   I modeled the control channel after IRC, of course. https://twitter.com/garybernhardt/status/566038610655576064

   Valid commands:  /join, /part, /list, /users, /nick, /whoami, /whereami, /msg
   (though /msg is unimplemented at the moment)

### Production-readiness gap

This is the list off the top of my head of what else I'd want before exposing this (or any project) to the outside world.

   - proper documentation
   - security -- it's trivial to at least wrap this in SSL but that's not enough, really.
   - persistent configuration
   - message history (so you can see previous n msgs in channel when you join it)
   - allow clients to connect to multiple rooms simultaneously
   - UI leaves a bit to be desired.  Or a lot.
   - differentiated authorization levels for online administration (+o, +v, etc)
   - better dev environment + documented to encourage collaboration
   - CI/CD automation
   - service reliability - forever module?  monit?
   - monitoring, load balancing if needed



