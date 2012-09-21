$(function() {
    var ref_tmpl = '<li><a tabindex="-1" href="#">%1</a></li>';

    var gh = require('github-wrapper');
    var repo = null;

    var $repo_select = $('#modal-choose-repo');

    var editor = CodeMirror.fromTextArea(
        document.getElementById('srcviewer'),
        {
            mode: 'javascript',
            theme: 'elegant',
            lineWrapping: true,
            lineNumbers: true
        });

    function updateBranchCommits(commits) {
        var commit_tmpl = '<li data-sha="%3"><a><span>%1 &nbsp;</span><span>%2</span></a></li>';
        var html = '';
        commits.forEach(function(commit) {
            html += commit_tmpl.replace('%1', commit.sha.substr(0, 6))
                .replace('%2', commit.message).replace('%3', commit.sha);
        });

        $('#branch-commits').html(html);
    }

    function updateFileTree(treeobj) {
        var blob_tmpl = '<li class="git-blob" data-sha="%2"><i class="icon-file"></i><a>%1</a></li>';
        var tree_tmpl = '<li class="git-tree" data-sha="%2"><i class="icon-folder-close"></i><a>%1</a></li>';

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
        repo && repo.getFileHierachy($(this).data('sha'), function(err, data) {
            if (!err) {
                updateFileTree(data);
            }
        });
    });

    $('ul.references').on('click', 'li:not(.nav-header)', function() {
        repo && repo.getBranchCommits($(this).text(), function(err, commits) {
            if (!err) {
                updateBranchCommits(commits);
            }
        });
    });

    $('#commit-files').on('click', 'li.git-blob', function() {
        repo && repo.getBlob($(this).data("sha"), function(err, code) {
            editor.setValue( new Buffer(code, 'base64').toString('utf8') );
        });
    });


    function loadRepo(user, name, done) {
        repo = new gh.Repo(user, name);
        repo.getRefs(function(err, refs) {
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

    $repo_select.modal({
        keyboard: false,
        show: true
    });

});
