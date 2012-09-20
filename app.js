$(function() {
    var ref_tmpl = '<li><a tabindex="-1" href="#">%1</a></li>';

    var gh = require('github-wrapper');
    var repo = null;

    var editor = CodeMirror.fromTextArea(
        document.getElementById('srcviewer'),
        {
            mode: 'javascript',
            theme: 'elegant',
            lineWrapping: true,
            lineNumbers: true
        });

    function updateFileTree(treeobj) {
        var blob_tmpl = '<li class="git-blob" data-sha="%2"><i class="icon-file"></i>%1</li>';
        var tree_tmpl = '<li class="git-tree" data-sha="%2"><i class="icon-folder-close"></i>%1</li>';

        var html = '';
        treeobj.tree.map(function(obj) {
            if (obj.type === 'blob') {
                html += blob_tmpl.replace('%1', obj.path).replace("%2", obj.sha);
            } else if (obj.type === 'tree') {
                html += tree_tmpl.replace('%1', obj.path).replace("%2", obj.sha);
            }
        });

        $('ul.filetree').html(html);
    }


    $('ul.references').on('click', 'li:not(.nav-header)', function() {
        repo && repo.getFileHierachy($(this).text(), function(err, data) {
            updateFileTree(data);
        });
    });

    $('ul.filetree').on('click', 'li.git-blob', function() {
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
            done();
        });
    }


    $('#load-repo').on('click', function() {
        var user = $('#repo-user').val(), name = $('#repo-name').val();
        console.log(user, name);
        loadRepo(user, name, function() {
            $('#modal-choose-repo').modal('hide');
        });
    });

    $('#modal-choose-repo').modal({
        keyboard: false,
        show: true
    });
});
