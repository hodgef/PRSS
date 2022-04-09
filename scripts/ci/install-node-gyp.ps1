npm install -g node-gyp
npx node-gyp --verbose list
npx node-gyp --verbose install $(node -v)
npx node-gyp --verbose list
Get-ChildItem "C:\Users\runneradmin\AppData\Local\node-gyp\Cache\$($(node -v).TrimStart('v'))\include\node"
