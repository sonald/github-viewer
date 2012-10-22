$(function() {
    var ref_tmpl = '<li><a tabindex="-1" href="#">%1</a></li>';

    var gh = require('github-proxy');
    var repo = null;
    var activeStreams = [];
    var $repo_select = $('#modal-choose-repo');

    var blob_tmpl = $('#blob_tmpl').text();
    var tree_tmpl = $('#tree_tmpl').text();
    var commit_tmpl = $('#commit_tmpl').text();
    var tag_tmpl = $('#tag_tmpl').text();

    function updateTags(code) {
        var jstag = require('jstag');
        var fs = require('fs');
        var $root = $('#file-tags');

        function makeTag(obj) {
            var $o = $(tag_tmpl.replace(/%1/g, obj.ctx));
            $o.data('tagobj', obj);
            $root.append($o);
        }

        updateTags = function(code) {
            var tags = jstag.parse(code);
            $root.empty();
            tags.functions().forEach(makeTag);
            tags.definitions().forEach(makeTag);
        };

        updateTags(code);
    }

    $('#file-tags').on('click', 'li', function() {
        var tag = $(this).data('tagobj');
        if (tag.name) { // valid tag obj
            console.log(tag);
            // editor.setCursor(tag.loc.start.line, tag.loc.start.column);
            var start = {
                    line: tag.loc.start.line-1,
                    ch: tag.loc.start.column
                },
                end = {
                    line: tag.loc.end.line-1,
                    ch: tag.loc.end.column
                };

            var coords = editor.charCoords(start, 'local');
            var info = editor.getScrollInfo();
            editor.scrollTo(coords.x, coords.y-info.width/2);
            editor.setSelection(start, end);
        }

    });

    window.editor = CodeMirror.fromTextArea(
        document.getElementById('srcviewer'),
        {
            theme: 'elegant',
            lineWrapping: true,
            lineNumbers: true,
            onChange: function() {
                if (editor.filename && /\.js$/.test(editor.filename)) {
                    console.log('update js tags');
                    updateTags(editor.getValue());
                }
            }
        });
    CodeMirror.modeURL = 'lib/CodeMirror/mode/%N/%N.js';

    function appendBranchCommit(commit) {
        var html = commit_tmpl.replace('%1', commit.sha.substr(0, 6))
            .replace(/%2/g, commit.message).replace('%3', commit.sha);

        $('#branch-commits').append(html);
    }

    function updateFileTree(treeobj) {
        var html = '';
        treeobj.tree.forEach(function(obj) {
            if (obj.type === 'blob') {
                html += blob_tmpl.replace('%1', obj.path).replace("%2", obj.sha);
            } else if (obj.type === 'tree') {
                html += tree_tmpl.replace('%1', obj.path).replace("%2", obj.sha);
            }
        });

        $('#commit-files').html(html);
    }

    $('#branch-commits').on('click', 'li', function() {
        repo.getCommit($(this).data('sha'), function(err, commit) {
            repo.getSnapshot(commit, function(err, data) {
                if (!err) {
                    updateFileTree(data);
                }
            });
        });
    });

    $('ul.references').on('click', 'li:not(.nav-header)', function() {
        if (!repo)
            return;

        repo.changeBranch($(this).text(), function(err) {
            if (err) {
                console.log(err);
                return;
            }

            if (activeStreams) {
                var old_stream;
                while((old_stream = activeStreams.shift())) {
                    old_stream.pause();
                    old_stream.destroy();
                }
            }

            $('#branch-commits').empty();
            var stream = repo.createCommitStream();
            activeStreams.push(stream);
            stream.on('data', function(commit) {
                appendBranchCommit(commit);
            });
            stream.on('end', function() {
                console.log('commits end');
            });
        });
    });

    var mode_name_map = [
        [/js$/, "javascript"],
        [/less$/, 'less'],
        [/css$/, 'css'],
        [/coffee$/, 'coffescript'],
        [/(htm|xml|xhtml)$/, 'htmlmixed'],
        [/md$/, 'markdown'],
        [/(sh|Makefile)$/, 'shell'],
        [/(c|cxx|cpp|h|hxx)$/, 'javascript'], // no c right now
        [/.*/, 'javascript']
    ];

    function loadMode(filename) {
        var mode = filename || "";
        for (var i = 0; i < mode_name_map.length; i++) {
            var rule = mode_name_map[i];
            if (rule[0].test(filename)) {
                mode = rule[1];
                break;
            }
        }
        editor.setOption("mode", mode);
        editor.filename = filename;
        CodeMirror.autoLoadMode(editor, mode);
    }

    $('#commit-files').on('click', 'li.git-blob', function() {
        var $this = $(this);

        repo.getBlob($this.data("sha"), function(err, code) {
            loadMode($this.text().trim());
            editor.setValue( new Buffer(code.content, 'base64').toString('utf8') );
        });
    });

    $('#commit-files').on('click', 'li.git-tree', function() {
        repo.getTree($(this).data('sha'), function(err, data) {
            if (!err) {
                updateFileTree(data);
            }
        });
    });

    function loadRepo(user, name, done) {
        if (repo) {
            if (activeStreams) {
                var stream;
                while((stream = activeStreams.shift())) {
                    stream.pause();
                    stream.destroy();
                }
            }
            repo.released = true;
            repo = null;
        }

        // clear repo
        $('#branch-commits').empty();
        $('#commit-files').empty();

        repo = new gh.Repo(user, name);
        var loc = 'https://github.com/' + user + '/' + name;
        $('#repo_link').text(loc);

        repo.showRefs('heads', function(err, refs) {
            var html = refs.map(function(ref) {
                return ref.ref.replace(/^refs\//, '');

            }).map(function(ref) {
                return ref_tmpl.replace('%1', ref);

            }).join('\n');

            $('ul.references').html(html);
            done(err);
        });
    }

    $('#load-repo').on('click', function() {
        var user = $('#repo-user').val(), name = $('#repo-name').val();
        console.log(user, name);
        loadRepo(user, name, function(err) {
            if (err) {
                debug(err);
            }
            $repo_select.modal('hide');
        });
    });

    $('#menu_change_repo').on('click', function() {
        $repo_select.modal('toggle');
    });

    webkitRequestAnimationFrame(function() {
        $repo_select.modal({
            keyboard: true,
            show: true,
            focus: true
        });
    });

});
