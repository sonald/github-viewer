$(function() {
    var ref_tmpl = '<li><a tabindex="-1" href="#">%1</a></li>';

    var gh = require('github-proxy');
    var repo = null;

    var $repo_select = $('#modal-choose-repo');

    var blob_tmpl = '<li class="git-blob" data-sha="%2"><i class="icon-file"></i><a>%1</a></li>';
    var tree_tmpl = '<li class="git-tree" data-sha="%2"><i class="icon-folder-close"></i><a>%1</a></li>';
    var commit_tmpl = '<li data-sha="%3"><a><span class="text-warning">[%1] &nbsp;</span><span class="text-success">%2</span></a></li>';

    var editor = CodeMirror.fromTextArea(
        document.getElementById('srcviewer'),
        {
            mode: 'javascript',
            theme: 'elegant',
            lineWrapping: true,
            lineNumbers: true
        });

    function appendBranchCommit(commit) {
        var html = commit_tmpl.replace('%1', commit.sha.substr(0, 6))
            .replace('%2', commit.message).replace('%3', commit.sha);

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

            $('#branch-commits').empty();
            var stream = repo.createCommitStream();
            stream.on('data', function(commit) {
                // console.log(commit);
                appendBranchCommit(commit);
            });
            stream.on('end', function(commit) {
                console.log('commits end');
            });
        });
    });

    $('#commit-files').on('click', 'li.git-blob', function() {
        repo && repo.getBlob($(this).data("sha"), function(err, code) {
            editor.setValue( new Buffer(code.content, 'base64').toString('utf8') );
        });
    });

    $('#commit-files').on('click', 'li.git-tree', function() {
        repo && repo.getTree($(this).data('sha'), function(err, data) {
            if (!err) {
                updateFileTree(data);
            }
        });
    });

    function loadRepo(user, name, done) {
        // clear repo
        $('#branch-commits').empty();
        $('#commit-files').empty();

        repo = new gh.Repo(user, name);
        repo.showRefs(function(err, refs) {
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
