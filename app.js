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
        var tags = jstag.parse(code);
        var $root = $('#file-tags');

        function makeTag(obj) {
            $root.append( tag_tmpl.replace('%1', obj.ctx).replace('%2', JSON.stringify(obj)) );
        }

        $root.empty();
        tags.functions().forEach(makeTag);
        tags.definitions().forEach(makeTag);
    }

    var editor = CodeMirror.fromTextArea(
        document.getElementById('srcviewer'),
        {
            theme: 'elegant',
            lineWrapping: true,
            lineNumbers: true,
            onChange: function() {
                console.log('content updated');
                updateTags(editor.getValue());
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
        CodeMirror.autoLoadMode(editor, mode);
    }

    $('#commit-files').on('click', 'li.git-blob', function() {
        var $this = $(this);

        repo.getBlob($this.data("sha"), function(err, code) {
            editor.setValue( new Buffer(code.content, 'base64').toString('utf8') );
            loadMode($this.text());
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
