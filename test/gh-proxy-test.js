var gh = require('../node_modules/github-proxy');
var assert = require('assert');

describe('github proxy', function() {
    describe('repo: sonald/semacs', function() {
        var repo;

        beforeEach(function() {
            repo = null;
            repo = new gh.Repo('sonald', 'semacs');
        });

        it('repo released', function(done) {
            repo.released = true;
            repo.updateRefsCache(function(err) {
                assert.ok(err);

                repo.showRefs(function(err) {
                    assert.ok(err);

                    repo.getCommit('', function(err) {
                        assert.ok(err);

                        repo.getTree('', function(err) {
                            assert.ok(err);

                            repo.changeBranch('master', function(err) {
                                assert.ok(err);
                                done();
                            });
                        });
                    });

                });
            });
        });

        it('update refs', function(done) {
            repo.updateRefsCache(function(err) {
                assert.ok(!err);
                assert.ok(repo._refs);
                assert.equal(repo._refs.length, 1);
                done();
            });
        });


        it('change branch', function(done) {
            assert.ok(!repo._branch);

            repo.changeBranch('master', function(err) {
                if (!err)
                    assert.equal(repo._branch, repo._refs[0]);
                else
                    console.log(err);

                done();
            });
        });


        it('show refs', function(done) {
            repo.showRefs(function(err, refs) {
                assert.equal(refs.length, 1);
                done();
            });
        });

        it('show refs with filter', function(done) {
            repo.showRefs('tag',
                function(err, refs) {
                    assert.equal(refs.length, 0);
                    done();
                });
        });

        it('show refs and released', function(done) {
            repo.showRefs(function(err, refs) {
                assert.equal(refs.length, 1);

                assert.ok(!repo.released);
                repo.released = true;

                repo.showRefs(function(err, refs) {
                    assert.ok(err);
                    console.log(err);
                    done();
                });
            });
        });

        it('change branch', function(done) {
            repo.changeBranch('heads/master', function(err) {
                if (!err) {
                    assert.ok(repo.currentBranch().ref.indexOf('heads/master') > -1);
                }
                done();
            });
        });

        it('get tip commit', function(done) {
            repo.changeBranch('master', function(err) {
                repo.getCommit(repo.currentBranch().object.sha, function(err, commit) {
                    assert.equal(repo._branch.object.sha, commit.sha);
                    done();
                });
            });
        });

        it("get tip's parents", function(done) {
            repo.changeBranch('master', function(err) {

                repo.getCommit(repo.currentBranch().object.sha, function(err, commit) {

                    commit.getParents(function(err, parents) {
                        assert.equal(parents.length, 1);
                        done();
                    });
                });
            });
        });

        it('collect commits from master', function(done) {
            var nr_commits = 0;

            repo.changeBranch('master', function(err) {
                var stream = repo.createCommitStream();
                stream.on('data', function(commit) {
                    nr_commits++;
                    console.log('[%s] - %s', commit.sha.slice(0,6), commit.author.date);
                });

                stream.on('end', function() {
                    console.log('commits end');
                    assert.equal(nr_commits, 15);
                    done();
                });
            });
        });

        it('collect commits from master with pause/resume', function(done) {
            var nr_commits = 0;

            repo.changeBranch('master', function(err) {
                var stream = repo.createCommitStream();
                stream.on('data', function(commit) {
                    nr_commits++;
                    console.log('[%s] - %s', commit.sha.slice(0,6), commit.author.date);
                    if (nr_commits === 4) {
                        stream.pause();
                        setTimeout(function() {
                            console.log('resume');
                            stream.resume();
                        }, 4000);
                    }
                });

                stream.on('end', function() {
                    console.log('commits end');
                    assert.equal(nr_commits, 15);
                    done();
                });
            });
        });

        // the second time should be super fast ( got caches )
        it('collect commits from master twice', function(done) {
            var iter_count = 0;

            repo.changeBranch('master', function(err) {
                function iterate() {
                    var nr_commits = 0;
                    var start_time = new Date();
                    var stream = repo.createCommitStream();
                    stream.on('data', function(commit) {
                        nr_commits++;
                        console.log('[%s] - %s', commit.sha.slice(0,6), commit.author.date);
                    });

                    stream.on('end', function() {
                        console.log('commits end, cost %d', new Date() - start_time);
                        assert.equal(nr_commits, 15);

                        iter_count++;
                        if (iter_count >= 2) {
                            done();
                        } else {
                            process.nextTick(iterate);
                        }

                    });
                }
                iterate();
            });
        });

        it('collect commits from master and destroy at mid', function(done) {
            var nr_commits = 0;

            repo.changeBranch('master', function(err) {
                var stream = repo.createCommitStream();
                stream.on('data', function(commit) {
                    nr_commits++;
                    console.log('[%s] - %s', commit.sha.slice(0,6), commit.author.date);
                    if (nr_commits > 4) {
                        stream.destroy();
                    }
                });

                stream.on('end', function() {
                    console.log('commits end');
                    assert.ok(nr_commits < 15);
                    done();
                });
            });
        });

        it.only('collect commits from master twice by parallel', function(done) {
            var activeStreams = [];
            var round = 0;

            function hitBranch() {
                repo.changeBranch('master', function(err) {
                    if (activeStreams) {
                        var old_stream;
                        while((old_stream = activeStreams.shift())) {
                            console.log('destroy old stream');
                            old_stream.pause();
                            old_stream.destroy();
                        }
                    }

                    var stream = repo.createCommitStream();
                    activeStreams.push(stream);
                    stream.on('data', function(commit) {
                        console.log('[%s] - %s', commit.sha.slice(0,6), commit.author.date);
                    });
                    stream.on('end', function() {
                        console.log('commits end');
                        round++;
                        if (round >= 2) {
                            done();
                        }
                    });
                });
            }

            hitBranch();
            setTimeout(function() {
                hitBranch();
            }, 8000);
        });
    });
});
