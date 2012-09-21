github source code viewer
-------------------------
this is just for fun. I use several great projects for this. [node-webkit][]
is used for UI powered by html and css. It's also highly experimental,
and not suitable for product use. [CodeMirror][] for source code hightlighting
and present. and finally [node-github][] for interfacing with github repos.

right now, if you want to run and test it, go to [node-webkit][] and download 
binary release for your system ( I use ubuntu x86-64 version ), then run 
`nw .` inside project root.

[node-webkit]: https://github.com/rogerwang/node-webkit
[CodeMirror]: http://codemirror.net/
[node-github]: http://ajaxorg.github.com/node-github/

todos
=====
+ load repo by user
+ highlight files by file type
+ tree-ish file listing
+ tags support
+ timeline!
+ change mode by blob name or content
