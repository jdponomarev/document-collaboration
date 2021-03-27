## Node.js backend by Dmitrii Ponomarev
```
pm2 start ecosystem.config.js
pm2 logs 0
```

## Notes
- Took me all the 4 hours
- I was not very familliar with socket.io, I was using it for the last time about 10 yrs ago

## TODO:
- Organize socket middlewares in a better way, make a single function for handling auth token
- Keep the list of all viewers of the document and return it on open
- Move JSON.parse to middleware, or even switch to MessagePack for speed
- Handle room leavings