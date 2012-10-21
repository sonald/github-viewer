Github Source Code Viewer
========================

this is just for fun. I use several great projects for this. [node-webkit][]
is used for UI powered by html and css. It's also highly experimental,
and not suitable for product use. [CodeMirror][] for source code hightlighting
and present. and finally [node-github][] for interfacing with github repos.

right now, if you want to run and test it, go to [node-webkit][] and download 
binary release for your system ( I use ubuntu x86-64 version ), then run 
`nw .` inside project root.

for tags support, I wrote a small lib for it which I badly named [jstag][].

[node-webkit]: http://github.com/rogerwang/node-webkit
[CodeMirror]: http://codemirror.net/
[node-github]: http://ajaxorg.github.com/node-github
[jstag]: http://github.com/sonald/jstag

todos
-----
+ load repo by user
+ highlight files by file type(done?)
+ tree-ish file listing
+ tags support (basically)
+ timeline!
+ change mode by blob name or content
+ seperate each panel into reusable components
